-- ============================================================================
-- Auth Triggers Migration
-- Automatically creates organization and user profile on signup
-- ============================================================================

-- ============================================================================
-- PART 1: Handle New User Function
-- ============================================================================

-- This function is triggered when a new user signs up via Supabase Auth
-- It automatically:
-- 1. Creates an organization using data from user_metadata
-- 2. Creates a user profile linked to that organization
-- 3. Sets the user's role to 'owner' (first user of the org)
-- 4. Stores org_id in auth.users.raw_app_meta_data (secure, user can't modify)

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_org_id UUID;
  org_name TEXT;
  user_full_name TEXT;
  org_slug TEXT;
BEGIN
  -- Extract organization name from user_metadata (passed during signup)
  org_name := COALESCE(
    NEW.raw_user_meta_data->>'organization_name',
    'My Organization'
  );

  -- Extract full name from user_metadata
  user_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1)
  );

  -- Generate a unique slug from org name
  -- Replace spaces with hyphens, lowercase, remove special chars
  org_slug := lower(regexp_replace(
    org_name || '-' || substr(gen_random_uuid()::text, 1, 8),
    '[^a-zA-Z0-9\-]',
    '',
    'g'
  ));

  -- Create the organization
  INSERT INTO public.organizations (name, slug, plan, status)
  VALUES (org_name, org_slug, 'free', 'active')
  RETURNING id INTO new_org_id;

  -- Create the user profile
  INSERT INTO public.users (id, email, full_name, role, org_id)
  VALUES (
    NEW.id,
    NEW.email,
    user_full_name,
    'owner', -- First user is always the owner
    new_org_id
  );

  -- Store org_id in auth.users.raw_app_meta_data
  -- This is secure because users cannot modify app_metadata
  -- It's accessible via JWT claims for fast RLS lookups
  NEW.raw_app_meta_data := COALESCE(NEW.raw_app_meta_data, '{}'::jsonb) ||
    jsonb_build_object('org_id', new_org_id);

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't prevent user creation
    RAISE WARNING 'Error in handle_new_user trigger: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PART 2: Create Trigger on auth.users
-- ============================================================================

-- Drop trigger if it exists (for idempotency)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger that fires BEFORE INSERT on auth.users
-- This ensures the org and user profile are created before the user record is finalized
CREATE TRIGGER on_auth_user_created
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- PART 3: Handle Existing Users (Migration Safety)
-- ============================================================================

-- For any existing users without org_id in app_metadata, set it
-- This is safe to run multiple times
DO $$
DECLARE
  user_record RECORD;
  user_org_id UUID;
BEGIN
  FOR user_record IN
    SELECT id, email, raw_app_meta_data
    FROM auth.users
    WHERE raw_app_meta_data->>'org_id' IS NULL
  LOOP
    -- Get the user's org_id from the users table
    SELECT org_id INTO user_org_id
    FROM public.users
    WHERE id = user_record.id;

    -- If user has an org, update their app_metadata
    IF user_org_id IS NOT NULL THEN
      UPDATE auth.users
      SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) ||
        jsonb_build_object('org_id', user_org_id)
      WHERE id = user_record.id;

      RAISE NOTICE 'Updated app_metadata for user: %', user_record.email;
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- PART 4: Helper Function for Inviting Users to Existing Org
-- ============================================================================

-- Function to invite a new user to an existing organization
-- This is called when an owner invites team members
CREATE OR REPLACE FUNCTION public.handle_invited_user(
  user_id UUID,
  target_org_id UUID,
  user_role TEXT DEFAULT 'employee'
)
RETURNS VOID AS $$
DECLARE
  user_email TEXT;
BEGIN
  -- Get user email
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = user_id;

  -- Create user profile with specified org and role
  INSERT INTO public.users (id, email, role, org_id)
  VALUES (user_id, user_email, user_role, target_org_id)
  ON CONFLICT (id) DO UPDATE
  SET org_id = target_org_id, role = user_role;

  -- Update auth.users app_metadata
  UPDATE auth.users
  SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) ||
    jsonb_build_object('org_id', target_org_id, 'role', user_role)
  WHERE id = user_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users (owners will use this)
GRANT EXECUTE ON FUNCTION public.handle_invited_user(UUID, UUID, TEXT) TO authenticated;

-- ============================================================================
-- PART 5: Updated Timestamp Trigger
-- ============================================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to all relevant tables
DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOR table_name IN
    SELECT unnest(ARRAY['organizations', 'users', 'properties', 'lots', 'reservations'])
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS set_updated_at ON public.%I;
      CREATE TRIGGER set_updated_at
        BEFORE UPDATE ON public.%I
        FOR EACH ROW
        EXECUTE FUNCTION public.handle_updated_at();
    ', table_name, table_name);
  END LOOP;
END $$;

-- ============================================================================
-- PART 6: Verification
-- ============================================================================

COMMENT ON FUNCTION public.handle_new_user() IS
'Trigger function that automatically creates organization and user profile on signup.
Extracts org name from user_metadata.organization_name and full_name from user_metadata.full_name.
Stores org_id in auth.users.raw_app_meta_data for secure, fast RLS lookups.';

COMMENT ON FUNCTION public.handle_invited_user(UUID, UUID, TEXT) IS
'Helper function for inviting users to existing organizations.
Called by owners when adding team members. Sets org_id and role in both public.users and auth.users.raw_app_meta_data.';

-- Test query to verify trigger is installed
-- Run this to confirm the trigger exists:
-- SELECT trigger_name, event_manipulation, event_object_table
-- FROM information_schema.triggers
-- WHERE trigger_schema = 'auth' AND trigger_name = 'on_auth_user_created';
