-- ============================================================================
-- Availability Rules Table Migration
-- Date blocking, price overrides, and minimum stay rules for lots
-- ============================================================================

-- ============================================================================
-- PART 1: Create Availability Rules Table
-- ============================================================================

-- Drop table if it exists (idempotent migration)
DROP TABLE IF EXISTS public.availability_rules CASCADE;

-- Availability rules table for managing lot availability and pricing
CREATE TABLE public.availability_rules (
  -- Primary identification
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Foreign keys for multi-tenant isolation
  lot_id UUID NOT NULL REFERENCES public.lots(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

  -- Date range for the rule
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,

  -- Rule configuration
  rule_type VARCHAR(50) NOT NULL,  -- 'blocked', 'price_override', 'min_stay'
  price_per_night DECIMAL(10, 2) CHECK (price_per_night IS NULL OR price_per_night >= 0),
  min_nights INTEGER CHECK (min_nights IS NULL OR min_nights > 0),
  reason TEXT,

  -- Audit timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_date_range CHECK (end_date >= start_date),
  CONSTRAINT valid_rule_type CHECK (
    rule_type IN ('blocked', 'price_override', 'min_stay')
  ),
  CONSTRAINT valid_blocked_rule CHECK (
    rule_type != 'blocked' OR (price_per_night IS NULL AND min_nights IS NULL)
  ),
  CONSTRAINT valid_price_override CHECK (
    rule_type != 'price_override' OR price_per_night IS NOT NULL
  ),
  CONSTRAINT valid_min_stay CHECK (
    rule_type != 'min_stay' OR min_nights IS NOT NULL
  )
);

-- Add table comment
COMMENT ON TABLE public.availability_rules IS
'Availability rules for lots including date blocking, price overrides, and minimum stay requirements.
RLS: org isolation, all members can view, admins can manage.';

-- Add column comments
COMMENT ON COLUMN public.availability_rules.start_date IS 'Start date of the rule (inclusive).';
COMMENT ON COLUMN public.availability_rules.end_date IS 'End date of the rule (inclusive).';
COMMENT ON COLUMN public.availability_rules.rule_type IS 'Type of rule: blocked (unavailable), price_override (custom pricing), or min_stay (minimum nights).';
COMMENT ON COLUMN public.availability_rules.price_per_night IS 'Override price per night. Required for price_override rules, NULL for others.';
COMMENT ON COLUMN public.availability_rules.min_nights IS 'Minimum number of nights required. Required for min_stay rules, NULL for others.';
COMMENT ON COLUMN public.availability_rules.reason IS 'Optional reason for the rule (e.g., "Maintenance", "Personal use", "Holiday pricing").';

-- ============================================================================
-- PART 2: Create Indexes for Performance
-- ============================================================================

-- Index for querying rules by lot
CREATE INDEX idx_availability_rules_lot_id ON public.availability_rules(lot_id);

-- Index for org isolation (RLS performance)
CREATE INDEX idx_availability_rules_org_id ON public.availability_rules(org_id);

-- Index for date range queries (critical for availability checks)
CREATE INDEX idx_availability_rules_dates ON public.availability_rules(lot_id, start_date, end_date);

-- Index for rule type filtering
CREATE INDEX idx_availability_rules_type ON public.availability_rules(rule_type);

-- Composite index for common query patterns
CREATE INDEX idx_availability_rules_lot_org ON public.availability_rules(lot_id, org_id);

-- GiST index for efficient date range overlap queries
CREATE INDEX idx_availability_rules_date_range ON public.availability_rules
  USING GIST (lot_id, daterange(start_date, end_date, '[]'));

-- ============================================================================
-- PART 3: Create Updated_at Trigger
-- ============================================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_availability_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS trigger_availability_rules_updated_at ON public.availability_rules;
CREATE TRIGGER trigger_availability_rules_updated_at
  BEFORE UPDATE ON public.availability_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_availability_rules_updated_at();

-- ============================================================================
-- PART 4: Enable Row Level Security
-- ============================================================================

-- Enable RLS on availability_rules table
ALTER TABLE public.availability_rules ENABLE ROW LEVEL SECURITY;

-- Force RLS for table owner (security best practice)
ALTER TABLE public.availability_rules FORCE ROW LEVEL SECURITY;

-- ============================================================================
-- PART 5: Create RLS Policies
-- ============================================================================

-- SELECT: All org members can view availability rules
CREATE POLICY "availability_rules_select_org" ON public.availability_rules
  FOR SELECT
  TO authenticated
  USING (
    org_id = public.get_user_org_id()
  );

-- INSERT: Admins/owners can create rules (only for org's lots)
CREATE POLICY "availability_rules_insert_admin" ON public.availability_rules
  FOR INSERT
  TO authenticated
  WITH CHECK (
    org_id = public.get_user_org_id()
    AND public.is_org_admin()
    AND lot_id IN (
      SELECT id FROM public.lots WHERE org_id = public.get_user_org_id()
    )
  );

-- UPDATE: Admins/owners can update rules
CREATE POLICY "availability_rules_update_admin" ON public.availability_rules
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

-- DELETE: Admins/owners can delete rules
CREATE POLICY "availability_rules_delete_admin" ON public.availability_rules
  FOR DELETE
  TO authenticated
  USING (
    org_id = public.get_user_org_id()
    AND public.is_org_admin()
  );

-- ============================================================================
-- PART 6: Create Helper Functions
-- ============================================================================

-- Function to check if a lot is available for a date range
CREATE OR REPLACE FUNCTION public.is_lot_available(
  target_lot_id UUID,
  check_start_date DATE,
  check_end_date DATE
)
RETURNS BOOLEAN AS $$
DECLARE
  blocked_count INTEGER;
BEGIN
  -- Check if any blocked rules overlap with the requested date range
  SELECT COUNT(*)
  INTO blocked_count
  FROM public.availability_rules
  WHERE
    lot_id = target_lot_id
    AND rule_type = 'blocked'
    AND daterange(start_date, end_date, '[]') && daterange(check_start_date, check_end_date, '[]')
    AND org_id = public.get_user_org_id();

  -- If no blocked rules found, lot is available
  RETURN blocked_count = 0;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.is_lot_available(UUID, DATE, DATE) IS
'Checks if a lot is available for a given date range.
Returns true if no blocking rules exist, false otherwise.';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.is_lot_available(UUID, DATE, DATE) TO authenticated;

-- Function to get all rules for a lot in a date range
CREATE OR REPLACE FUNCTION public.get_lot_rules_for_date_range(
  target_lot_id UUID,
  range_start_date DATE,
  range_end_date DATE
)
RETURNS TABLE (
  id UUID,
  rule_type VARCHAR,
  start_date DATE,
  end_date DATE,
  price_per_night DECIMAL,
  min_nights INTEGER,
  reason TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ar.id,
    ar.rule_type,
    ar.start_date,
    ar.end_date,
    ar.price_per_night,
    ar.min_nights,
    ar.reason
  FROM public.availability_rules ar
  WHERE
    ar.lot_id = target_lot_id
    AND ar.org_id = public.get_user_org_id()
    AND daterange(ar.start_date, ar.end_date, '[]') && daterange(range_start_date, range_end_date, '[]')
  ORDER BY ar.start_date, ar.rule_type;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.get_lot_rules_for_date_range(UUID, DATE, DATE) IS
'Returns all availability rules for a lot that overlap with the given date range.
Ordered by start_date and rule_type.';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_lot_rules_for_date_range(UUID, DATE, DATE) TO authenticated;

-- Function to detect overlapping rules (for conflict prevention)
CREATE OR REPLACE FUNCTION public.check_rule_conflicts(
  target_lot_id UUID,
  target_start_date DATE,
  target_end_date DATE,
  exclude_rule_id UUID DEFAULT NULL
)
RETURNS TABLE (
  conflicting_rule_id UUID,
  rule_type VARCHAR,
  start_date DATE,
  end_date DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ar.id AS conflicting_rule_id,
    ar.rule_type,
    ar.start_date,
    ar.end_date
  FROM public.availability_rules ar
  WHERE
    ar.lot_id = target_lot_id
    AND ar.org_id = public.get_user_org_id()
    AND (exclude_rule_id IS NULL OR ar.id != exclude_rule_id)
    AND daterange(ar.start_date, ar.end_date, '[]') && daterange(target_start_date, target_end_date, '[]')
  ORDER BY ar.start_date;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.check_rule_conflicts(UUID, DATE, DATE, UUID) IS
'Checks for overlapping rules for a lot in the given date range.
Used to prevent conflicting rules. Can exclude a specific rule ID (for updates).';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.check_rule_conflicts(UUID, DATE, DATE, UUID) TO authenticated;

-- ============================================================================
-- PART 7: Create View for Calendar Display
-- ============================================================================

-- View to get blocked dates for a lot
CREATE OR REPLACE VIEW public.lot_blocked_dates AS
SELECT
  l.id AS lot_id,
  l.title AS lot_title,
  ar.id AS rule_id,
  ar.start_date,
  ar.end_date,
  ar.reason,
  ar.org_id
FROM public.lots l
INNER JOIN public.availability_rules ar ON l.id = ar.lot_id
WHERE ar.rule_type = 'blocked';

COMMENT ON VIEW public.lot_blocked_dates IS
'View of all blocked dates across all lots.
Useful for calendar display and availability checking.';

-- Grant select on the view to authenticated users
GRANT SELECT ON public.lot_blocked_dates TO authenticated;

-- ============================================================================
-- Migration Complete
-- ============================================================================
