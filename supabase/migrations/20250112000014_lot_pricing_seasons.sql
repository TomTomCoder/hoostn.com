-- ============================================================================
-- Lot Pricing Seasons Table Migration
-- Seasonal pricing rules for lots
-- ============================================================================

-- ============================================================================
-- PART 1: Create Lot Pricing Seasons Table
-- ============================================================================

-- Drop table if it exists (idempotent migration)
DROP TABLE IF EXISTS public.lot_pricing_seasons CASCADE;

-- Seasonal pricing table for managing recurring or seasonal lot pricing
CREATE TABLE public.lot_pricing_seasons (
  -- Primary identification
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Foreign keys for multi-tenant isolation
  lot_id UUID NOT NULL REFERENCES public.lots(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

  -- Season details
  name VARCHAR(100) NOT NULL,  -- 'Summer 2026', 'Winter 2025-26', 'Holiday Season'

  -- Date range for the season
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,

  -- Pricing configuration
  price_per_night DECIMAL(10, 2) NOT NULL CHECK (price_per_night >= 0),
  min_nights INTEGER DEFAULT 1 CHECK (min_nights > 0),

  -- Audit timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_season_date_range CHECK (end_date >= start_date),
  CONSTRAINT valid_season_name CHECK (LENGTH(TRIM(name)) >= 1)
);

-- Add table comment
COMMENT ON TABLE public.lot_pricing_seasons IS
'Seasonal pricing rules for lots.
Allows property managers to set different prices for different seasons (e.g., summer, winter, holidays).
RLS: org isolation, all members can view, admins can manage.';

-- Add column comments
COMMENT ON COLUMN public.lot_pricing_seasons.name IS 'Human-readable name for the season (e.g., "Summer 2026", "Holiday Season").';
COMMENT ON COLUMN public.lot_pricing_seasons.start_date IS 'Start date of the season (inclusive).';
COMMENT ON COLUMN public.lot_pricing_seasons.end_date IS 'End date of the season (inclusive).';
COMMENT ON COLUMN public.lot_pricing_seasons.price_per_night IS 'Price per night during this season. Must be non-negative.';
COMMENT ON COLUMN public.lot_pricing_seasons.min_nights IS 'Minimum number of nights required for bookings during this season.';

-- ============================================================================
-- PART 2: Create Indexes for Performance
-- ============================================================================

-- Index for querying seasons by lot
CREATE INDEX idx_lot_pricing_seasons_lot_id ON public.lot_pricing_seasons(lot_id);

-- Index for org isolation (RLS performance)
CREATE INDEX idx_lot_pricing_seasons_org_id ON public.lot_pricing_seasons(org_id);

-- Index for date range queries (critical for pricing lookups)
CREATE INDEX idx_lot_pricing_seasons_dates ON public.lot_pricing_seasons(lot_id, start_date, end_date);

-- Composite index for common query patterns
CREATE INDEX idx_lot_pricing_seasons_lot_org ON public.lot_pricing_seasons(lot_id, org_id);

-- GiST index for efficient date range overlap queries
CREATE INDEX idx_lot_pricing_seasons_date_range ON public.lot_pricing_seasons
  USING GIST (lot_id, daterange(start_date, end_date, '[]'));

-- ============================================================================
-- PART 3: Create Updated_at Trigger
-- ============================================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_lot_pricing_seasons_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS trigger_lot_pricing_seasons_updated_at ON public.lot_pricing_seasons;
CREATE TRIGGER trigger_lot_pricing_seasons_updated_at
  BEFORE UPDATE ON public.lot_pricing_seasons
  FOR EACH ROW
  EXECUTE FUNCTION public.update_lot_pricing_seasons_updated_at();

-- ============================================================================
-- PART 4: Enable Row Level Security
-- ============================================================================

-- Enable RLS on lot_pricing_seasons table
ALTER TABLE public.lot_pricing_seasons ENABLE ROW LEVEL SECURITY;

-- Force RLS for table owner (security best practice)
ALTER TABLE public.lot_pricing_seasons FORCE ROW LEVEL SECURITY;

-- ============================================================================
-- PART 5: Create RLS Policies
-- ============================================================================

-- SELECT: All org members can view pricing seasons
CREATE POLICY "lot_pricing_seasons_select_org" ON public.lot_pricing_seasons
  FOR SELECT
  TO authenticated
  USING (
    org_id = public.get_user_org_id()
  );

-- INSERT: Admins/owners can create seasons (only for org's lots)
CREATE POLICY "lot_pricing_seasons_insert_admin" ON public.lot_pricing_seasons
  FOR INSERT
  TO authenticated
  WITH CHECK (
    org_id = public.get_user_org_id()
    AND public.is_org_admin()
    AND lot_id IN (
      SELECT id FROM public.lots WHERE org_id = public.get_user_org_id()
    )
  );

-- UPDATE: Admins/owners can update seasons
CREATE POLICY "lot_pricing_seasons_update_admin" ON public.lot_pricing_seasons
  FOR UPDATE
  TO authenticated
  USING (
    org_id = public.get_user_org_id()
    AND public.is_org_admin()
  )
  WITH CHECK (
    org_id = public.get_user_org_id()
    AND public.is_org_admin()
  );

-- DELETE: Admins/owners can delete seasons
CREATE POLICY "lot_pricing_seasons_delete_admin" ON public.lot_pricing_seasons
  FOR DELETE
  TO authenticated
  USING (
    org_id = public.get_user_org_id()
    AND public.is_org_admin()
  );

-- ============================================================================
-- PART 6: Create Helper Functions
-- ============================================================================

-- Function to get pricing for a specific date
CREATE OR REPLACE FUNCTION public.get_lot_price_for_date(
  target_lot_id UUID,
  target_date DATE
)
RETURNS DECIMAL(10, 2) AS $$
DECLARE
  seasonal_price DECIMAL(10, 2);
  base_price DECIMAL(10, 2);
BEGIN
  -- First, check for seasonal pricing
  SELECT price_per_night
  INTO seasonal_price
  FROM public.lot_pricing_seasons
  WHERE
    lot_id = target_lot_id
    AND org_id = public.get_user_org_id()
    AND target_date BETWEEN start_date AND end_date
  ORDER BY created_at DESC
  LIMIT 1;

  -- If seasonal pricing found, return it
  IF seasonal_price IS NOT NULL THEN
    RETURN seasonal_price;
  END IF;

  -- Otherwise, return the base price from lots table
  SELECT base_price
  INTO base_price
  FROM public.lots
  WHERE id = target_lot_id
    AND org_id = public.get_user_org_id();

  RETURN COALESCE(base_price, 0);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.get_lot_price_for_date(UUID, DATE) IS
'Returns the price per night for a lot on a specific date.
Checks seasonal pricing first, falls back to base price if no season defined.';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_lot_price_for_date(UUID, DATE) TO authenticated;

-- Function to calculate total price for a date range
CREATE OR REPLACE FUNCTION public.calculate_lot_total_price(
  target_lot_id UUID,
  check_in_date DATE,
  check_out_date DATE
)
RETURNS TABLE (
  nights INTEGER,
  accommodation_total DECIMAL,
  cleaning_fee DECIMAL,
  tourist_tax DECIMAL,
  grand_total DECIMAL
) AS $$
DECLARE
  current_date DATE;
  night_count INTEGER;
  nightly_price DECIMAL(10, 2);
  accommodation_sum DECIMAL(10, 2) := 0;
  cleaning_fee_amount DECIMAL(10, 2);
  tourist_tax_amount DECIMAL(10, 2);
BEGIN
  -- Calculate number of nights
  night_count := check_out_date - check_in_date;

  -- Validate date range
  IF night_count <= 0 THEN
    RAISE EXCEPTION 'Invalid date range: check-out must be after check-in';
  END IF;

  -- Loop through each night to calculate pricing
  current_date := check_in_date;
  WHILE current_date < check_out_date LOOP
    nightly_price := public.get_lot_price_for_date(target_lot_id, current_date);
    accommodation_sum := accommodation_sum + nightly_price;
    current_date := current_date + INTERVAL '1 day';
  END LOOP;

  -- Get cleaning fee and tourist tax from lots table
  SELECT
    l.cleaning_fee,
    l.tourist_tax * night_count
  INTO
    cleaning_fee_amount,
    tourist_tax_amount
  FROM public.lots l
  WHERE l.id = target_lot_id
    AND l.org_id = public.get_user_org_id();

  -- Return the breakdown
  RETURN QUERY SELECT
    night_count,
    accommodation_sum,
    COALESCE(cleaning_fee_amount, 0),
    COALESCE(tourist_tax_amount, 0),
    accommodation_sum + COALESCE(cleaning_fee_amount, 0) + COALESCE(tourist_tax_amount, 0);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.calculate_lot_total_price(UUID, DATE, DATE) IS
'Calculates the total price for a lot booking including accommodation, cleaning fee, and tourist tax.
Returns a breakdown of all costs.';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.calculate_lot_total_price(UUID, DATE, DATE) TO authenticated;

-- Function to get all seasons for a lot
CREATE OR REPLACE FUNCTION public.get_lot_seasons(target_lot_id UUID)
RETURNS TABLE (
  id UUID,
  name VARCHAR,
  start_date DATE,
  end_date DATE,
  price_per_night DECIMAL,
  min_nights INTEGER,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    lps.id,
    lps.name,
    lps.start_date,
    lps.end_date,
    lps.price_per_night,
    lps.min_nights,
    lps.created_at
  FROM public.lot_pricing_seasons lps
  WHERE
    lps.lot_id = target_lot_id
    AND lps.org_id = public.get_user_org_id()
  ORDER BY lps.start_date ASC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.get_lot_seasons(UUID) IS
'Returns all pricing seasons for a lot ordered by start date.
Respects RLS policies (only returns seasons from user''s org).';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_lot_seasons(UUID) TO authenticated;

-- Function to detect overlapping seasons (for conflict prevention)
CREATE OR REPLACE FUNCTION public.check_season_conflicts(
  target_lot_id UUID,
  target_start_date DATE,
  target_end_date DATE,
  exclude_season_id UUID DEFAULT NULL
)
RETURNS TABLE (
  conflicting_season_id UUID,
  season_name VARCHAR,
  start_date DATE,
  end_date DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    lps.id AS conflicting_season_id,
    lps.name AS season_name,
    lps.start_date,
    lps.end_date
  FROM public.lot_pricing_seasons lps
  WHERE
    lps.lot_id = target_lot_id
    AND lps.org_id = public.get_user_org_id()
    AND (exclude_season_id IS NULL OR lps.id != exclude_season_id)
    AND daterange(lps.start_date, lps.end_date, '[]') && daterange(target_start_date, target_end_date, '[]')
  ORDER BY lps.start_date;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.check_season_conflicts(UUID, DATE, DATE, UUID) IS
'Checks for overlapping pricing seasons for a lot in the given date range.
Used to prevent conflicting seasons. Can exclude a specific season ID (for updates).';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.check_season_conflicts(UUID, DATE, DATE, UUID) TO authenticated;

-- ============================================================================
-- PART 7: Create View for Pricing Overview
-- ============================================================================

-- View to get lots with their seasonal pricing count
CREATE OR REPLACE VIEW public.lots_with_pricing_info AS
SELECT
  l.*,
  COUNT(DISTINCT lps.id) AS season_count,
  MIN(lps.price_per_night) AS min_seasonal_price,
  MAX(lps.price_per_night) AS max_seasonal_price
FROM public.lots l
LEFT JOIN public.lot_pricing_seasons lps ON l.id = lps.lot_id
GROUP BY l.id;

COMMENT ON VIEW public.lots_with_pricing_info IS
'Lots with their pricing information including season count and price range.
Useful for displaying pricing overview in lot listings.';

-- Grant select on the view to authenticated users
GRANT SELECT ON public.lots_with_pricing_info TO authenticated;

-- ============================================================================
-- Migration Complete
-- ============================================================================
