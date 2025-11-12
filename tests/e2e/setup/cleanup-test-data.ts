import { createClient } from '@supabase/supabase-js';

/**
 * Test Data Cleanup Script
 *
 * Removes all test data created during E2E tests:
 * - Test reservations
 * - Test lots
 * - Test properties
 * - Test users
 * - Test organization
 * - Reset sequences (if needed)
 * - Clear storage
 *
 * Usage:
 *   npm run cleanup-test-data
 *   or
 *   npx tsx tests/e2e/setup/cleanup-test-data.ts
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const TEST_EMAIL_PATTERNS = [
  'test-owner@hoostn.com',
  'test-admin@hoostn.com',
  'test-employee@hoostn.com',
  'test-e2e@hoostn.com',
  'test-signup-%@example.com',
  'test-login-%@example.com',
  'mobile-%@example.com',
];

async function findTestOrganization(): Promise<string | null> {
  console.log('Finding test organization...');

  const { data, error } = await supabase
    .from('organizations')
    .select('id')
    .eq('name', 'Test E2E Organization')
    .single();

  if (error || !data) {
    console.log('No test organization found');
    return null;
  }

  console.log(`✓ Found test organization: ${data.id}`);
  return data.id;
}

async function deleteReservations(organizationId: string): Promise<number> {
  console.log('Deleting test reservations...');

  // Get all lots for this organization
  const { data: properties } = await supabase
    .from('properties')
    .select('id')
    .eq('organization_id', organizationId);

  if (!properties || properties.length === 0) {
    console.log('No properties found, skipping reservations');
    return 0;
  }

  const propertyIds = properties.map((p) => p.id);

  const { data: lots } = await supabase
    .from('lots')
    .select('id')
    .in('property_id', propertyIds);

  if (!lots || lots.length === 0) {
    console.log('No lots found, skipping reservations');
    return 0;
  }

  const lotIds = lots.map((l) => l.id);

  const { error, count } = await supabase
    .from('reservations')
    .delete()
    .in('lot_id', lotIds);

  if (error) {
    console.error('Error deleting reservations:', error);
    return 0;
  }

  console.log(`✓ Deleted ${count || 0} reservations`);
  return count || 0;
}

async function deleteLots(organizationId: string): Promise<number> {
  console.log('Deleting test lots...');

  const { data: properties } = await supabase
    .from('properties')
    .select('id')
    .eq('organization_id', organizationId);

  if (!properties || properties.length === 0) {
    console.log('No properties found, skipping lots');
    return 0;
  }

  const propertyIds = properties.map((p) => p.id);

  const { error, count } = await supabase
    .from('lots')
    .delete()
    .in('property_id', propertyIds);

  if (error) {
    console.error('Error deleting lots:', error);
    return 0;
  }

  console.log(`✓ Deleted ${count || 0} lots`);
  return count || 0;
}

async function deleteProperties(organizationId: string): Promise<number> {
  console.log('Deleting test properties...');

  const { error, count } = await supabase
    .from('properties')
    .delete()
    .eq('organization_id', organizationId);

  if (error) {
    console.error('Error deleting properties:', error);
    return 0;
  }

  console.log(`✓ Deleted ${count || 0} properties`);
  return count || 0;
}

async function deleteUsers(): Promise<number> {
  console.log('Deleting test users...');

  let deletedCount = 0;

  for (const emailPattern of TEST_EMAIL_PATTERNS) {
    if (emailPattern.includes('%')) {
      // Pattern matching - need to query first
      const { data: users } = await supabase
        .from('profiles')
        .select('id, email')
        .like('email', emailPattern.replace('%', ''));

      if (users && users.length > 0) {
        for (const user of users) {
          const { error } = await supabase.auth.admin.deleteUser(user.id);
          if (!error) {
            deletedCount++;
            console.log(`  ✓ Deleted user: ${user.email}`);
          }
        }
      }
    } else {
      // Exact match
      const { data: user } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', emailPattern)
        .single();

      if (user) {
        const { error } = await supabase.auth.admin.deleteUser(user.id);
        if (!error) {
          deletedCount++;
          console.log(`  ✓ Deleted user: ${emailPattern}`);
        }
      }
    }
  }

  console.log(`✓ Deleted ${deletedCount} users`);
  return deletedCount;
}

async function deleteOrganization(organizationId: string): Promise<boolean> {
  console.log('Deleting test organization...');

  const { error } = await supabase
    .from('organizations')
    .delete()
    .eq('id', organizationId);

  if (error) {
    console.error('Error deleting organization:', error);
    return false;
  }

  console.log('✓ Deleted test organization');
  return true;
}

async function deleteTestImages(organizationId: string): Promise<number> {
  console.log('Deleting test images from storage...');

  // List files in test organization bucket
  const { data: files, error: listError } = await supabase.storage
    .from('lot-images')
    .list(`${organizationId}/`);

  if (listError || !files || files.length === 0) {
    console.log('No test images found');
    return 0;
  }

  // Delete all files
  const filePaths = files.map((file) => `${organizationId}/${file.name}`);

  const { error: deleteError } = await supabase.storage
    .from('lot-images')
    .remove(filePaths);

  if (deleteError) {
    console.error('Error deleting images:', deleteError);
    return 0;
  }

  console.log(`✓ Deleted ${files.length} test images`);
  return files.length;
}

async function cleanupDrafts(organizationId: string): Promise<number> {
  console.log('Cleaning up test drafts...');

  const { error, count } = await supabase
    .from('property_drafts')
    .delete()
    .eq('organization_id', organizationId);

  if (error) {
    console.error('Error deleting drafts:', error);
    return 0;
  }

  console.log(`✓ Deleted ${count || 0} drafts`);
  return count || 0;
}

async function main() {
  console.log('Starting test data cleanup...\n');

  try {
    // Find test organization
    const organizationId = await findTestOrganization();

    if (!organizationId) {
      console.log('\n⚠️  No test data found to clean up');
      return;
    }

    // Delete in order (respecting foreign keys)
    const reservationsDeleted = await deleteReservations(organizationId);
    const lotsDeleted = await deleteLots(organizationId);
    const propertiesDeleted = await deleteProperties(organizationId);
    const draftsDeleted = await cleanupDrafts(organizationId);
    const imagesDeleted = await deleteTestImages(organizationId);
    const usersDeleted = await deleteUsers();
    const orgDeleted = await deleteOrganization(organizationId);

    console.log('\n✅ Test data cleanup completed successfully!');
    console.log('\nSummary:');
    console.log(`  - Reservations: ${reservationsDeleted}`);
    console.log(`  - Lots: ${lotsDeleted}`);
    console.log(`  - Properties: ${propertiesDeleted}`);
    console.log(`  - Drafts: ${draftsDeleted}`);
    console.log(`  - Images: ${imagesDeleted}`);
    console.log(`  - Users: ${usersDeleted}`);
    console.log(`  - Organization: ${orgDeleted ? 'deleted' : 'not deleted'}`);
  } catch (error) {
    console.error('\n❌ Error cleaning up test data:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export {
  findTestOrganization,
  deleteReservations,
  deleteLots,
  deleteProperties,
  deleteUsers,
  deleteOrganization,
  deleteTestImages,
  cleanupDrafts,
};
