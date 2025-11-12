-- ============================================================================
-- Geocoding Metadata Columns Migration
-- Add geocoding-related columns to properties table
-- ============================================================================

-- ============================================================================
-- PART 1: Add Geocoding Columns to Properties Table
-- ============================================================================

-- Add formatted_address column for storing geocoded address
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS formatted_address TEXT;

-- Add geocoded_at timestamp to track when geocoding was performed
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS geocoded_at TIMESTAMPTZ;

-- Add geocode_accuracy to track quality of geocoding result
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS geocode_accuracy VARCHAR(50);

-- Add geocode_source to track which geocoding service was used
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS geocode_source VARCHAR(50);

-- Add geocode_confidence score (0-100)
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS geocode_confidence INTEGER CHECK (geocode_confidence >= 0 AND geocode_confidence <= 100);

-- Add geocode_metadata JSONB for storing additional geocoding data
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS geocode_metadata JSONB DEFAULT '{}'::jsonb;

-- ============================================================================
-- PART 2: Add Column Comments
-- ============================================================================

COMMENT ON COLUMN public.properties.formatted_address IS
'Formatted address returned by geocoding service (e.g., Google Maps, OpenStreetMap).
May be more complete or standardized than the original address.';

COMMENT ON COLUMN public.properties.geocoded_at IS
'Timestamp when the property was last geocoded.
NULL indicates property has never been geocoded or coordinates were manually entered.';

COMMENT ON COLUMN public.properties.geocode_accuracy IS
'Accuracy level of geocoding result.
Examples: ROOFTOP, RANGE_INTERPOLATED, GEOMETRIC_CENTER, APPROXIMATE.
Varies by geocoding service used.';

COMMENT ON COLUMN public.properties.geocode_source IS
'Geocoding service that provided the coordinates.
Examples: google, mapbox, nominatim, manual.
NULL indicates coordinates were manually entered.';

COMMENT ON COLUMN public.properties.geocode_confidence IS
'Confidence score of geocoding result (0-100).
100 = exact match, lower values indicate less precise results.
NULL indicates no confidence score available.';

COMMENT ON COLUMN public.properties.geocode_metadata IS
'Additional geocoding metadata stored as JSONB.
May include: place_id, formatted components, bounding box, viewport, etc.
Structure varies by geocoding service.';

-- ============================================================================
-- PART 3: Create Indexes for Performance
-- ============================================================================

-- Index on geocoded_at for finding properties that need re-geocoding
CREATE INDEX IF NOT EXISTS idx_properties_geocoded_at ON public.properties(geocoded_at)
  WHERE geocoded_at IS NOT NULL;

-- Index on geocode_source for filtering by geocoding provider
CREATE INDEX IF NOT EXISTS idx_properties_geocode_source ON public.properties(geocode_source)
  WHERE geocode_source IS NOT NULL;

-- Index on geocode_accuracy for filtering by quality
CREATE INDEX IF NOT EXISTS idx_properties_geocode_accuracy ON public.properties(geocode_accuracy)
  WHERE geocode_accuracy IS NOT NULL;

-- GIN index on geocode_metadata for efficient JSONB queries
CREATE INDEX IF NOT EXISTS idx_properties_geocode_metadata ON public.properties USING GIN (geocode_metadata);

-- Partial index for properties needing geocoding (no coordinates or old geocode)
CREATE INDEX IF NOT EXISTS idx_properties_needs_geocoding ON public.properties(id)
  WHERE (latitude IS NULL OR longitude IS NULL) OR geocoded_at IS NULL OR geocoded_at < NOW() - INTERVAL '1 year';

-- ============================================================================
-- PART 4: Helper Functions for Geocoding
-- ============================================================================

-- Function to mark property as geocoded
CREATE OR REPLACE FUNCTION public.mark_property_geocoded(
  target_property_id UUID,
  new_latitude DECIMAL,
  new_longitude DECIMAL,
  new_formatted_address TEXT DEFAULT NULL,
  new_accuracy VARCHAR DEFAULT NULL,
  new_source VARCHAR DEFAULT NULL,
  new_confidence INTEGER DEFAULT NULL,
  new_metadata JSONB DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Update property with geocoding results
  UPDATE public.properties
  SET
    latitude = new_latitude,
    longitude = new_longitude,
    formatted_address = COALESCE(new_formatted_address, formatted_address),
    geocoded_at = NOW(),
    geocode_accuracy = new_accuracy,
    geocode_source = new_source,
    geocode_confidence = new_confidence,
    geocode_metadata = COALESCE(new_metadata, '{}'::jsonb),
    updated_at = NOW()
  WHERE
    id = target_property_id
    AND org_id = public.get_user_org_id();

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.mark_property_geocoded IS
'Updates a property with geocoding results.
Parameters:
  - target_property_id: Property to update
  - new_latitude: Geocoded latitude
  - new_longitude: Geocoded longitude
  - new_formatted_address: Formatted address from geocoder (optional)
  - new_accuracy: Accuracy level (optional)
  - new_source: Geocoding service used (optional)
  - new_confidence: Confidence score 0-100 (optional)
  - new_metadata: Additional metadata as JSONB (optional)
Returns true if property was updated, false otherwise.';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.mark_property_geocoded TO authenticated;

-- Function to get properties needing geocoding
CREATE OR REPLACE FUNCTION public.get_properties_needing_geocoding(
  limit_count INTEGER DEFAULT 100,
  min_age_days INTEGER DEFAULT 365
)
RETURNS TABLE (
  id UUID,
  name VARCHAR,
  address TEXT,
  city VARCHAR,
  postal_code VARCHAR,
  country VARCHAR,
  latitude DECIMAL,
  longitude DECIMAL,
  geocoded_at TIMESTAMPTZ,
  org_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.address,
    p.city,
    p.postal_code,
    p.country,
    p.latitude,
    p.longitude,
    p.geocoded_at,
    p.org_id
  FROM public.properties p
  WHERE
    p.org_id = public.get_user_org_id()
    AND (
      -- No coordinates
      (p.latitude IS NULL OR p.longitude IS NULL)
      -- Or never geocoded
      OR p.geocoded_at IS NULL
      -- Or geocoded more than min_age_days ago
      OR p.geocoded_at < NOW() - (min_age_days || ' days')::INTERVAL
    )
  ORDER BY
    -- Prioritize properties with no coordinates
    CASE WHEN p.latitude IS NULL OR p.longitude IS NULL THEN 0 ELSE 1 END,
    -- Then by oldest geocoding date
    p.geocoded_at NULLS FIRST
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.get_properties_needing_geocoding IS
'Returns properties that need geocoding (no coordinates or stale geocoding).
Parameters:
  - limit_count: Maximum number of properties to return (default 100)
  - min_age_days: Consider geocoding stale after this many days (default 365)
Returns properties ordered by priority (no coordinates first, then oldest).';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_properties_needing_geocoding TO authenticated;

-- Function to validate geocoding data completeness
CREATE OR REPLACE FUNCTION public.validate_geocoding_data(
  target_property_id UUID
)
RETURNS TABLE (
  has_coordinates BOOLEAN,
  has_formatted_address BOOLEAN,
  has_geocoding_metadata BOOLEAN,
  is_geocoded BOOLEAN,
  geocoding_age_days INTEGER,
  is_stale BOOLEAN,
  validation_score INTEGER
) AS $$
DECLARE
  prop RECORD;
  age_days INTEGER;
BEGIN
  -- Get property data
  SELECT * INTO prop
  FROM public.properties
  WHERE id = target_property_id;

  -- Calculate age of geocoding
  IF prop.geocoded_at IS NOT NULL THEN
    age_days := EXTRACT(EPOCH FROM (NOW() - prop.geocoded_at))::INTEGER / 86400;
  ELSE
    age_days := NULL;
  END IF;

  -- Return validation results
  RETURN QUERY
  SELECT
    (prop.latitude IS NOT NULL AND prop.longitude IS NOT NULL) AS has_coordinates,
    (prop.formatted_address IS NOT NULL) AS has_formatted_address,
    (prop.geocode_metadata IS NOT NULL AND prop.geocode_metadata != '{}'::jsonb) AS has_geocoding_metadata,
    (prop.geocoded_at IS NOT NULL) AS is_geocoded,
    age_days AS geocoding_age_days,
    (age_days IS NOT NULL AND age_days > 365) AS is_stale,
    (
      CASE WHEN prop.latitude IS NOT NULL AND prop.longitude IS NOT NULL THEN 40 ELSE 0 END +
      CASE WHEN prop.formatted_address IS NOT NULL THEN 20 ELSE 0 END +
      CASE WHEN prop.geocoded_at IS NOT NULL THEN 20 ELSE 0 END +
      CASE WHEN prop.geocode_metadata IS NOT NULL AND prop.geocode_metadata != '{}'::jsonb THEN 20 ELSE 0 END
    ) AS validation_score;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.validate_geocoding_data IS
'Validates the completeness and freshness of geocoding data for a property.
Returns various validation flags and a score (0-100).
Score of 100 indicates complete, fresh geocoding data.';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.validate_geocoding_data TO authenticated;

-- Function to clear geocoding data
CREATE OR REPLACE FUNCTION public.clear_property_geocoding(
  target_property_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.properties
  SET
    formatted_address = NULL,
    geocoded_at = NULL,
    geocode_accuracy = NULL,
    geocode_source = NULL,
    geocode_confidence = NULL,
    geocode_metadata = '{}'::jsonb,
    updated_at = NOW()
  WHERE
    id = target_property_id
    AND org_id = public.get_user_org_id();

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.clear_property_geocoding IS
'Clears all geocoding metadata for a property.
Does NOT clear latitude/longitude (coordinates may be manually entered).
Returns true if property was updated, false otherwise.';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.clear_property_geocoding TO authenticated;

-- ============================================================================
-- PART 5: Create Views for Geocoding Status
-- ============================================================================

-- View for geocoding status across all properties
CREATE OR REPLACE VIEW public.property_geocoding_status AS
SELECT
  p.id,
  p.name,
  p.org_id,
  p.address,
  p.city,
  p.latitude IS NOT NULL AND p.longitude IS NOT NULL AS has_coordinates,
  p.geocoded_at IS NOT NULL AS is_geocoded,
  p.formatted_address IS NOT NULL AS has_formatted_address,
  p.geocode_accuracy,
  p.geocode_source,
  p.geocode_confidence,
  p.geocoded_at,
  EXTRACT(EPOCH FROM (NOW() - p.geocoded_at))::INTEGER / 86400 AS geocode_age_days,
  CASE
    WHEN p.latitude IS NULL OR p.longitude IS NULL THEN 'NEEDS_GEOCODING'
    WHEN p.geocoded_at IS NULL THEN 'MANUAL_COORDINATES'
    WHEN p.geocoded_at < NOW() - INTERVAL '1 year' THEN 'STALE'
    ELSE 'CURRENT'
  END AS geocoding_status
FROM public.properties p;

COMMENT ON VIEW public.property_geocoding_status IS
'Overview of geocoding status for all properties.
Shows which properties need geocoding, have manual coordinates, or have stale data.';

-- Grant select on view
GRANT SELECT ON public.property_geocoding_status TO authenticated;

-- View for geocoding statistics per organization
CREATE OR REPLACE VIEW public.geocoding_stats_by_org AS
SELECT
  p.org_id,
  o.name AS organization_name,
  COUNT(*) AS total_properties,
  COUNT(*) FILTER (WHERE p.latitude IS NOT NULL AND p.longitude IS NOT NULL) AS with_coordinates,
  COUNT(*) FILTER (WHERE p.geocoded_at IS NOT NULL) AS geocoded,
  COUNT(*) FILTER (WHERE p.geocoded_at IS NULL AND p.latitude IS NOT NULL) AS manual_coordinates,
  COUNT(*) FILTER (WHERE p.latitude IS NULL OR p.longitude IS NULL) AS missing_coordinates,
  COUNT(*) FILTER (WHERE p.geocoded_at < NOW() - INTERVAL '1 year') AS stale_geocoding,
  ROUND(
    COUNT(*) FILTER (WHERE p.latitude IS NOT NULL AND p.longitude IS NOT NULL)::NUMERIC /
    NULLIF(COUNT(*), 0) * 100,
    2
  ) AS coordinate_coverage_pct,
  STRING_AGG(DISTINCT p.geocode_source, ', ') AS geocoding_sources_used
FROM public.properties p
LEFT JOIN public.organizations o ON p.org_id = o.id
GROUP BY p.org_id, o.name;

COMMENT ON VIEW public.geocoding_stats_by_org IS
'Geocoding statistics aggregated by organization.
Shows coverage, sources used, and data quality metrics.';

-- Grant select on view
GRANT SELECT ON public.geocoding_stats_by_org TO authenticated;

-- ============================================================================
-- PART 6: Create Trigger to Update Geocode Status
-- ============================================================================

-- Function to auto-clear geocode metadata when coordinates change manually
CREATE OR REPLACE FUNCTION public.handle_manual_coordinate_update()
RETURNS TRIGGER AS $$
BEGIN
  -- If coordinates were manually changed (not by geocoding function)
  IF (NEW.latitude IS DISTINCT FROM OLD.latitude OR NEW.longitude IS DISTINCT FROM OLD.longitude) THEN
    -- Only clear if this is NOT a geocoding update (geocoded_at not being updated)
    IF NEW.geocoded_at = OLD.geocoded_at OR NEW.geocoded_at IS NULL THEN
      -- Mark coordinates as manually entered
      NEW.geocode_source := 'manual';
      NEW.geocode_accuracy := NULL;
      NEW.geocode_confidence := NULL;
      -- Don't set geocoded_at - this indicates manual entry
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for manual coordinate updates
DROP TRIGGER IF EXISTS trigger_manual_coordinate_update ON public.properties;
CREATE TRIGGER trigger_manual_coordinate_update
  BEFORE UPDATE OF latitude, longitude ON public.properties
  FOR EACH ROW
  WHEN (NEW.latitude IS DISTINCT FROM OLD.latitude OR NEW.longitude IS DISTINCT FROM OLD.longitude)
  EXECUTE FUNCTION public.handle_manual_coordinate_update();

COMMENT ON FUNCTION public.handle_manual_coordinate_update() IS
'Detects manual coordinate updates and marks geocode_source as "manual".
Helps distinguish between geocoded and manually-entered coordinates.';

-- ============================================================================
-- PART 7: Testing Queries
-- ============================================================================

-- Uncomment to test after applying migration:
/*
-- Verify new columns were added
SELECT
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'properties'
  AND column_name IN ('formatted_address', 'geocoded_at', 'geocode_accuracy', 'geocode_source', 'geocode_confidence', 'geocode_metadata')
ORDER BY column_name;

-- View all geocoding-related indexes
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'properties'
  AND indexname LIKE '%geocod%';

-- Check geocoding status across all properties
SELECT
  geocoding_status,
  COUNT(*) AS property_count
FROM public.property_geocoding_status
GROUP BY geocoding_status
ORDER BY property_count DESC;

-- View geocoding statistics by organization
SELECT * FROM public.geocoding_stats_by_org;

-- Find properties needing geocoding
SELECT * FROM public.get_properties_needing_geocoding(10);

-- Test marking a property as geocoded
-- SELECT public.mark_property_geocoded(
--   'property-id-here',
--   48.8566,
--   2.3522,
--   '1 Avenue des Champs-Élysées, 75008 Paris, France',
--   'ROOFTOP',
--   'google',
--   95,
--   '{"place_id": "ChIJDwoRlE-65kcRr1iNegzOONk"}'::jsonb
-- );

-- Test validation function
-- SELECT * FROM public.validate_geocoding_data('property-id-here');

-- Test clearing geocoding data
-- SELECT public.clear_property_geocoding('property-id-here');

-- Find properties with low geocoding confidence
SELECT
  id,
  name,
  address,
  geocode_confidence,
  geocode_accuracy,
  geocoded_at
FROM public.properties
WHERE geocode_confidence IS NOT NULL AND geocode_confidence < 70
ORDER BY geocode_confidence ASC;

-- Find properties by geocoding source
SELECT
  geocode_source,
  COUNT(*) AS property_count,
  AVG(geocode_confidence) AS avg_confidence
FROM public.properties
WHERE geocode_source IS NOT NULL
GROUP BY geocode_source
ORDER BY property_count DESC;

-- Query geocode_metadata JSONB
SELECT
  id,
  name,
  geocode_metadata->>'place_id' AS place_id,
  geocode_metadata->>'types' AS types
FROM public.properties
WHERE geocode_metadata IS NOT NULL AND geocode_metadata != '{}'::jsonb
LIMIT 10;
*/
