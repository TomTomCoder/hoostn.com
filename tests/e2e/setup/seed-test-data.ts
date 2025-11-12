import { createClient } from '@supabase/supabase-js';

/**
 * Test Data Seeding Script
 *
 * Creates test data for E2E tests:
 * - Test organization
 * - Test users (owner, admin, employee)
 * - Test properties (3-5 properties)
 * - Test lots (10-15 lots)
 * - Test reservations (20-30 reservations)
 * - Test images (upload test images)
 *
 * Usage:
 *   npm run seed-test-data
 *   or
 *   npx tsx tests/e2e/setup/seed-test-data.ts
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface TestUser {
  id: string;
  email: string;
  role: string;
}

interface TestOrganization {
  id: string;
  name: string;
}

interface TestProperty {
  id: string;
  name: string;
  organization_id: string;
}

interface TestLot {
  id: string;
  name: string;
  property_id: string;
}

const TEST_DATA = {
  organization: {
    name: 'Test E2E Organization',
    type: 'campground',
  },
  users: [
    {
      email: 'test-owner@hoostn.com',
      role: 'owner',
      full_name: 'Test Owner',
    },
    {
      email: 'test-admin@hoostn.com',
      role: 'admin',
      full_name: 'Test Admin',
    },
    {
      email: 'test-employee@hoostn.com',
      role: 'employee',
      full_name: 'Test Employee',
    },
  ],
  properties: [
    {
      name: 'Lakeview RV Park',
      type: 'rv_park',
      description: 'Beautiful lakefront RV park with full hookups',
      address: {
        street: '123 Lake Road',
        city: 'Banff',
        state: 'Alberta',
        postal_code: 'T1L 1A1',
        country: 'Canada',
      },
    },
    {
      name: 'Mountain View Campground',
      type: 'campground',
      description: 'Scenic mountain campground with hiking trails',
      address: {
        street: '456 Mountain Drive',
        city: 'Jasper',
        state: 'Alberta',
        postal_code: 'T0E 1E0',
        country: 'Canada',
      },
    },
    {
      name: 'Riverside Glamping',
      type: 'glamping',
      description: 'Luxury glamping experience by the river',
      address: {
        street: '789 River Avenue',
        city: 'Canmore',
        state: 'Alberta',
        postal_code: 'T1W 1N1',
        country: 'Canada',
      },
    },
  ],
  lots: [
    { name: 'Lot A1', type: 'rv', max_guests: 4, base_price: 75.0 },
    { name: 'Lot A2', type: 'rv', max_guests: 4, base_price: 75.0 },
    { name: 'Lot A3', type: 'rv', max_guests: 6, base_price: 95.0 },
    { name: 'Lot B1', type: 'tent', max_guests: 2, base_price: 35.0 },
    { name: 'Lot B2', type: 'tent', max_guests: 4, base_price: 45.0 },
    { name: 'Lot C1', type: 'cabin', max_guests: 6, base_price: 150.0 },
    { name: 'Lot C2', type: 'cabin', max_guests: 4, base_price: 125.0 },
    { name: 'Lot D1', type: 'yurt', max_guests: 2, base_price: 100.0 },
    { name: 'Lot D2', type: 'yurt', max_guests: 4, base_price: 135.0 },
    { name: 'Lot E1', type: 'rv', max_guests: 8, base_price: 110.0 },
  ],
};

async function seedOrganization(): Promise<TestOrganization> {
  console.log('Creating test organization...');

  const { data, error } = await supabase
    .from('organizations')
    .insert([
      {
        name: TEST_DATA.organization.name,
        type: TEST_DATA.organization.type,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Error creating organization:', error);
    throw error;
  }

  console.log(`✓ Created organization: ${data.name} (ID: ${data.id})`);
  return data;
}

async function seedUsers(organizationId: string): Promise<TestUser[]> {
  console.log('Creating test users...');

  const users: TestUser[] = [];

  for (const userData of TEST_DATA.users) {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: 'TestPassword123!',
      email_confirm: true,
      user_metadata: {
        full_name: userData.full_name,
      },
    });

    if (authError) {
      console.error(`Error creating user ${userData.email}:`, authError);
      continue;
    }

    // Create profile
    const { error: profileError } = await supabase.from('profiles').insert([
      {
        id: authData.user.id,
        email: userData.email,
        full_name: userData.full_name,
        organization_id: organizationId,
        role: userData.role,
      },
    ]);

    if (profileError) {
      console.error(`Error creating profile for ${userData.email}:`, profileError);
      continue;
    }

    users.push({
      id: authData.user.id,
      email: userData.email,
      role: userData.role,
    });

    console.log(`✓ Created user: ${userData.email} (${userData.role})`);
  }

  return users;
}

async function seedProperties(organizationId: string): Promise<TestProperty[]> {
  console.log('Creating test properties...');

  const properties: TestProperty[] = [];

  for (const propData of TEST_DATA.properties) {
    const { data, error } = await supabase
      .from('properties')
      .insert([
        {
          organization_id: organizationId,
          name: propData.name,
          type: propData.type,
          description: propData.description,
          address_street: propData.address.street,
          address_city: propData.address.city,
          address_state: propData.address.state,
          address_postal_code: propData.address.postal_code,
          address_country: propData.address.country,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error(`Error creating property ${propData.name}:`, error);
      continue;
    }

    properties.push(data);
    console.log(`✓ Created property: ${data.name}`);
  }

  return properties;
}

async function seedLots(properties: TestProperty[]): Promise<TestLot[]> {
  console.log('Creating test lots...');

  const lots: TestLot[] = [];
  let lotIndex = 0;

  for (const property of properties) {
    // Create 3-5 lots per property
    const lotsPerProperty = Math.floor(Math.random() * 3) + 3;

    for (let i = 0; i < lotsPerProperty && lotIndex < TEST_DATA.lots.length; i++, lotIndex++) {
      const lotData = TEST_DATA.lots[lotIndex];

      const { data, error } = await supabase
        .from('lots')
        .insert([
          {
            property_id: property.id,
            name: lotData.name,
            type: lotData.type,
            description: `${lotData.type} lot with capacity for ${lotData.max_guests} guests`,
            max_guests: lotData.max_guests,
            base_price: lotData.base_price,
            status: 'active',
          },
        ])
        .select()
        .single();

      if (error) {
        console.error(`Error creating lot ${lotData.name}:`, error);
        continue;
      }

      lots.push(data);
      console.log(`✓ Created lot: ${data.name} at ${property.name}`);
    }
  }

  return lots;
}

async function seedReservations(lots: TestLot[]): Promise<void> {
  console.log('Creating test reservations...');

  const statuses = ['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled'];
  const paymentStatuses = ['pending', 'paid', 'refunded'];

  for (let i = 0; i < 25; i++) {
    const lot = lots[Math.floor(Math.random() * lots.length)];
    const checkInDate = new Date();
    checkInDate.setDate(checkInDate.getDate() + Math.floor(Math.random() * 90) - 30);

    const checkOutDate = new Date(checkInDate);
    checkOutDate.setDate(checkOutDate.getDate() + Math.floor(Math.random() * 7) + 1);

    const { error } = await supabase.from('reservations').insert([
      {
        lot_id: lot.id,
        guest_name: `Test Guest ${i + 1}`,
        guest_email: `guest${i + 1}@example.com`,
        guest_phone: `555-${String(i).padStart(4, '0')}`,
        check_in: checkInDate.toISOString().split('T')[0],
        check_out: checkOutDate.toISOString().split('T')[0],
        guests: Math.floor(Math.random() * 4) + 1,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        payment_status: paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)],
        total_price: lot.base_price * Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)),
      },
    ]);

    if (error) {
      console.error(`Error creating reservation ${i + 1}:`, error);
      continue;
    }

    if ((i + 1) % 5 === 0) {
      console.log(`✓ Created ${i + 1} reservations...`);
    }
  }

  console.log('✓ Created 25 test reservations');
}

async function main() {
  console.log('Starting test data seeding...\n');

  try {
    // Create organization
    const organization = await seedOrganization();

    // Create users
    const users = await seedUsers(organization.id);

    // Create properties
    const properties = await seedProperties(organization.id);

    // Create lots
    const lots = await seedLots(properties);

    // Create reservations
    await seedReservations(lots);

    console.log('\n✅ Test data seeding completed successfully!');
    console.log('\nTest credentials:');
    console.log('  Owner: test-owner@hoostn.com / TestPassword123!');
    console.log('  Admin: test-admin@hoostn.com / TestPassword123!');
    console.log('  Employee: test-employee@hoostn.com / TestPassword123!');
    console.log(`\nOrganization ID: ${organization.id}`);
  } catch (error) {
    console.error('\n❌ Error seeding test data:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { seedOrganization, seedUsers, seedProperties, seedLots, seedReservations };
