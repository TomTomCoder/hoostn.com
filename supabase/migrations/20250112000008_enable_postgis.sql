-- ============================================================================
-- Enable PostGIS Extension Migration
-- Geospatial support for property location queries and distance calculations
-- ============================================================================

-- ============================================================================
-- PART 1: Enable PostGIS Extension
-- ============================================================================

-- Enable PostGIS extension for geospatial queries
-- PostGIS adds support for geographic objects and spatial queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- Verify PostGIS version
COMMENT ON EXTENSION postgis IS 'PostGIS geometry and geography spatial objects and functions';

-- ============================================================================
-- PART 2: Add Geography Column to Properties Table
-- ============================================================================

-- Add geography column for efficient geospatial queries
-- Using geography type (vs geometry) for accurate distance calculations on Earth's surface
-- SRID 4326 is WGS 84 (standard GPS coordinates)
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS geography GEOGRAPHY(POINT, 4326);

-- Add comment
COMMENT ON COLUMN public.properties.geography IS
'Geospatial point using WGS 84 (GPS coordinates).
Auto-populated from latitude/longitude via trigger.
Used for proximity searches and distance calculations.';

-- ============================================================================
-- PART 3: Create Trigger to Auto-Update Geography from Lat/Lng
-- ============================================================================

-- Function to update geography column from latitude/longitude
CREATE OR REPLACE FUNCTION public.update_property_geography()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update geography if latitude and longitude are both provided
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    -- Create a point from longitude (X) and latitude (Y)
    -- Note: ST_SetSRID expects (longitude, latitude) order
    NEW.geography := ST_SetSRID(
      ST_MakePoint(NEW.longitude, NEW.latitude),
      4326
    )::geography;
  ELSE
    -- Clear geography if coordinates are incomplete
    NEW.geography := NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_property_geography ON public.properties;

-- Create trigger to automatically update geography on insert/update
CREATE TRIGGER trigger_update_property_geography
  BEFORE INSERT OR UPDATE OF latitude, longitude ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION public.update_property_geography();

COMMENT ON FUNCTION public.update_property_geography() IS
'Automatically updates the geography column when latitude/longitude changes.
Geography column is used for efficient geospatial queries.
Trigger fires on INSERT or UPDATE of latitude/longitude columns.';

-- ============================================================================
-- PART 4: Backfill Existing Properties
-- ============================================================================

-- Update existing properties to populate geography column
-- This is safe to run multiple times (idempotent)
UPDATE public.properties
SET
  geography = ST_SetSRID(
    ST_MakePoint(longitude, latitude),
    4326
  )::geography
WHERE
  latitude IS NOT NULL
  AND longitude IS NOT NULL
  AND geography IS NULL;

-- ============================================================================
-- PART 5: Create Spatial Index
-- ============================================================================

-- Create GIST index for efficient geospatial queries
-- GIST (Generalized Search Tree) is optimized for spatial data
DROP INDEX IF EXISTS idx_properties_geography;
CREATE INDEX idx_properties_geography ON public.properties USING GIST (geography);

COMMENT ON INDEX idx_properties_geography IS
'GIST index for efficient geospatial queries on properties.
Enables fast proximity searches and distance calculations.';

-- Also ensure we have an index on latitude/longitude for fallback queries
CREATE INDEX IF NOT EXISTS idx_properties_lat_lng ON public.properties(latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- ============================================================================
-- PART 6: Helper Functions for Distance Calculations
-- ============================================================================

-- Function to calculate distance between two properties in meters
CREATE OR REPLACE FUNCTION public.distance_between_properties(
  property_id_1 UUID,
  property_id_2 UUID
)
RETURNS NUMERIC AS $$
DECLARE
  distance_meters NUMERIC;
BEGIN
  SELECT ST_Distance(p1.geography, p2.geography)
  INTO distance_meters
  FROM public.properties p1
  CROSS JOIN public.properties p2
  WHERE p1.id = property_id_1
    AND p2.id = property_id_2
    AND p1.geography IS NOT NULL
    AND p2.geography IS NOT NULL;

  RETURN distance_meters;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.distance_between_properties(UUID, UUID) IS
'Calculates distance in meters between two properties.
Returns NULL if either property has no geography data.
Uses PostGIS ST_Distance on geography type for accurate calculations.';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.distance_between_properties(UUID, UUID) TO authenticated;

-- Function to find properties within radius of a point (lat, lng)
CREATE OR REPLACE FUNCTION public.properties_within_radius(
  center_lat DECIMAL,
  center_lng DECIMAL,
  radius_meters INTEGER,
  target_org_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  name VARCHAR,
  address TEXT,
  city VARCHAR,
  latitude DECIMAL,
  longitude DECIMAL,
  distance_meters NUMERIC,
  org_id UUID
) AS $$
DECLARE
  center_point GEOGRAPHY;
BEGIN
  -- Create geography point from input coordinates
  center_point := ST_SetSRID(
    ST_MakePoint(center_lng, center_lat),
    4326
  )::geography;

  -- Return properties within radius, ordered by distance
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.address,
    p.city,
    p.latitude,
    p.longitude,
    ST_Distance(p.geography, center_point) AS distance_meters,
    p.org_id
  FROM public.properties p
  WHERE
    p.geography IS NOT NULL
    AND ST_DWithin(p.geography, center_point, radius_meters)
    AND (target_org_id IS NULL OR p.org_id = target_org_id)
    AND (target_org_id IS NULL OR p.org_id = public.get_user_org_id())
  ORDER BY ST_Distance(p.geography, center_point) ASC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.properties_within_radius(DECIMAL, DECIMAL, INTEGER, UUID) IS
'Finds properties within specified radius (meters) of a lat/lng point.
Parameters:
  - center_lat: Latitude of center point
  - center_lng: Longitude of center point
  - radius_meters: Search radius in meters
  - target_org_id: Optional org filter (NULL = all orgs, respecting RLS)
Returns properties ordered by distance from center point.';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.properties_within_radius(DECIMAL, DECIMAL, INTEGER, UUID) TO authenticated;

-- Function to get nearest properties to a given property
CREATE OR REPLACE FUNCTION public.nearest_properties(
  target_property_id UUID,
  max_results INTEGER DEFAULT 10,
  max_distance_meters INTEGER DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  name VARCHAR,
  address TEXT,
  city VARCHAR,
  latitude DECIMAL,
  longitude DECIMAL,
  distance_meters NUMERIC,
  org_id UUID
) AS $$
DECLARE
  target_geography GEOGRAPHY;
BEGIN
  -- Get geography of target property
  SELECT geography INTO target_geography
  FROM public.properties
  WHERE id = target_property_id;

  -- Return error if property not found or has no geography
  IF target_geography IS NULL THEN
    RAISE EXCEPTION 'Property not found or has no geographic coordinates';
  END IF;

  -- Return nearest properties
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.address,
    p.city,
    p.latitude,
    p.longitude,
    ST_Distance(p.geography, target_geography) AS distance_meters,
    p.org_id
  FROM public.properties p
  WHERE
    p.id != target_property_id
    AND p.geography IS NOT NULL
    AND p.org_id = public.get_user_org_id()
    AND (
      max_distance_meters IS NULL
      OR ST_DWithin(p.geography, target_geography, max_distance_meters)
    )
  ORDER BY ST_Distance(p.geography, target_geography) ASC
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.nearest_properties(UUID, INTEGER, INTEGER) IS
'Finds nearest properties to a given property.
Parameters:
  - target_property_id: Property to search from
  - max_results: Maximum number of results (default 10)
  - max_distance_meters: Optional maximum distance filter
Returns properties from same org, ordered by distance.';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.nearest_properties(UUID, INTEGER, INTEGER) TO authenticated;

-- Function to calculate property density in an area
CREATE OR REPLACE FUNCTION public.property_density(
  center_lat DECIMAL,
  center_lng DECIMAL,
  radius_meters INTEGER
)
RETURNS TABLE (
  property_count BIGINT,
  radius_meters INTEGER,
  area_sq_km NUMERIC,
  density_per_sq_km NUMERIC
) AS $$
DECLARE
  center_point GEOGRAPHY;
  prop_count BIGINT;
  area_km NUMERIC;
BEGIN
  -- Create geography point from input coordinates
  center_point := ST_SetSRID(
    ST_MakePoint(center_lng, center_lat),
    4326
  )::geography;

  -- Count properties within radius
  SELECT COUNT(*)
  INTO prop_count
  FROM public.properties p
  WHERE
    p.geography IS NOT NULL
    AND ST_DWithin(p.geography, center_point, radius_meters);

  -- Calculate area in square kilometers
  -- Area of circle: π * r²
  area_km := (3.14159 * (radius_meters / 1000.0) * (radius_meters / 1000.0));

  -- Return results
  RETURN QUERY
  SELECT
    prop_count,
    radius_meters,
    ROUND(area_km::NUMERIC, 2) AS area_sq_km,
    ROUND((prop_count / area_km)::NUMERIC, 2) AS density_per_sq_km;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.property_density(DECIMAL, DECIMAL, INTEGER) IS
'Calculates property density in a circular area.
Returns property count, area, and density per square kilometer.
Useful for market analysis and location insights.';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.property_density(DECIMAL, DECIMAL, INTEGER) TO authenticated;

-- ============================================================================
-- PART 7: Create Materialized View for Performance
-- ============================================================================

-- Materialized view for property locations (can be refreshed periodically)
DROP MATERIALIZED VIEW IF EXISTS public.property_locations_cache;
CREATE MATERIALIZED VIEW public.property_locations_cache AS
SELECT
  id,
  org_id,
  name,
  city,
  country,
  latitude,
  longitude,
  geography,
  created_at,
  updated_at
FROM public.properties
WHERE geography IS NOT NULL;

-- Create index on the materialized view
CREATE INDEX idx_property_locations_cache_geography
  ON public.property_locations_cache USING GIST (geography);

CREATE INDEX idx_property_locations_cache_org
  ON public.property_locations_cache(org_id);

COMMENT ON MATERIALIZED VIEW public.property_locations_cache IS
'Cached view of property locations for improved query performance.
Refresh periodically with: REFRESH MATERIALIZED VIEW public.property_locations_cache;
Consider refreshing after bulk imports or significant property updates.';

-- Grant select on materialized view
GRANT SELECT ON public.property_locations_cache TO authenticated;

-- ============================================================================
-- PART 8: Create Validation Function
-- ============================================================================

-- Function to validate latitude/longitude coordinates
CREATE OR REPLACE FUNCTION public.validate_coordinates(
  lat DECIMAL,
  lng DECIMAL
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Latitude must be between -90 and 90
  -- Longitude must be between -180 and 180
  RETURN (
    lat IS NOT NULL
    AND lng IS NOT NULL
    AND lat >= -90
    AND lat <= 90
    AND lng >= -180
    AND lng <= 180
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION public.validate_coordinates(DECIMAL, DECIMAL) IS
'Validates that latitude and longitude are within valid ranges.
Latitude: -90 to 90, Longitude: -180 to 180
Returns false if either value is NULL or out of range.';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.validate_coordinates(DECIMAL, DECIMAL) TO authenticated;

-- Add check constraint to properties table (optional - may affect existing data)
-- Uncomment if you want to enforce validation at database level:
-- ALTER TABLE public.properties
--   ADD CONSTRAINT check_valid_coordinates
--   CHECK (
--     (latitude IS NULL AND longitude IS NULL)
--     OR public.validate_coordinates(latitude, longitude)
--   );

-- ============================================================================
-- PART 9: Testing Queries
-- ============================================================================

-- Uncomment to test after applying migration:
/*
-- Verify PostGIS extension is installed
SELECT extname, extversion FROM pg_extension WHERE extname = 'postgis';

-- Verify geography column was added
SELECT
  column_name,
  data_type,
  udt_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'properties'
  AND column_name = 'geography';

-- View spatial indexes
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'properties'
  AND indexname LIKE '%geography%';

-- Test coordinate validation
SELECT public.validate_coordinates(48.8566, 2.3522); -- Paris (valid)
SELECT public.validate_coordinates(100, 200);        -- Invalid
SELECT public.validate_coordinates(NULL, NULL);      -- Invalid

-- Count properties with geography data
SELECT
  COUNT(*) AS total_properties,
  COUNT(geography) AS properties_with_geography,
  COUNT(*) - COUNT(geography) AS properties_without_geography
FROM public.properties;

-- Test distance calculation between two properties
-- SELECT public.distance_between_properties('property-id-1', 'property-id-2');

-- Test proximity search (properties within 10km of Paris coordinates)
-- SELECT * FROM public.properties_within_radius(48.8566, 2.3522, 10000);

-- Test nearest properties
-- SELECT * FROM public.nearest_properties('property-id-here', 5);

-- Test property density
-- SELECT * FROM public.property_density(48.8566, 2.3522, 5000);

-- Refresh materialized view
-- REFRESH MATERIALIZED VIEW public.property_locations_cache;

-- Sample query using geography for proximity search
-- SELECT
--   p.id,
--   p.name,
--   p.city,
--   ST_Distance(
--     p.geography,
--     ST_SetSRID(ST_MakePoint(2.3522, 48.8566), 4326)::geography
--   ) / 1000.0 AS distance_km
-- FROM public.properties p
-- WHERE p.geography IS NOT NULL
-- ORDER BY p.geography <-> ST_SetSRID(ST_MakePoint(2.3522, 48.8566), 4326)::geography
-- LIMIT 10;
*/
