import { Page } from '@playwright/test';
import { faker } from '@faker-js/faker';

/**
 * Test Data Fixtures
 *
 * Helper functions to create and manage test data for E2E tests.
 * Provides realistic mock data generators and cleanup utilities.
 */

export interface TestProperty {
  id?: string;
  name: string;
  type: string;
  description: string;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  contact: {
    name: string;
    email: string;
    phone: string;
  };
}

export interface TestLot {
  id?: string;
  propertyId: string;
  name: string;
  description: string;
  type: string;
  maxGuests: number;
  basePrice: number;
  amenities: string[];
}

export interface TestReservation {
  id?: string;
  lotId: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  status: string;
}

/**
 * Generate mock property data
 */
export function generatePropertyData(): TestProperty {
  return {
    name: `Test Property ${faker.company.name()}`,
    type: faker.helpers.arrayElement(['campground', 'rv_park', 'glamping', 'marina']),
    description: faker.lorem.paragraph(),
    address: {
      street: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state(),
      postalCode: faker.location.zipCode(),
      country: 'Canada',
    },
    contact: {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      phone: faker.phone.number(),
    },
  };
}

/**
 * Generate mock lot data
 */
export function generateLotData(propertyId: string): TestLot {
  return {
    propertyId,
    name: `Lot ${faker.number.int({ min: 1, max: 100 })}`,
    description: faker.lorem.paragraph(),
    type: faker.helpers.arrayElement(['rv', 'tent', 'cabin', 'yurt']),
    maxGuests: faker.number.int({ min: 2, max: 8 }),
    basePrice: faker.number.float({ min: 30, max: 200, precision: 0.01 }),
    amenities: faker.helpers.arrayElements(
      ['wifi', 'electricity', 'water', 'sewer', 'picnic_table', 'fire_pit', 'bbq'],
      { min: 2, max: 5 }
    ),
  };
}

/**
 * Generate mock reservation data
 */
export function generateReservationData(lotId: string): TestReservation {
  const checkIn = faker.date.future();
  const checkOut = new Date(checkIn);
  checkOut.setDate(checkOut.getDate() + faker.number.int({ min: 2, max: 7 }));

  return {
    lotId,
    guestName: faker.person.fullName(),
    guestEmail: faker.internet.email(),
    guestPhone: faker.phone.number(),
    checkIn: checkIn.toISOString().split('T')[0],
    checkOut: checkOut.toISOString().split('T')[0],
    guests: faker.number.int({ min: 1, max: 4 }),
    status: 'pending',
  };
}

/**
 * Create a test property through the UI
 */
export async function createPropertyViaUI(page: Page, propertyData?: Partial<TestProperty>): Promise<string> {
  const data = { ...generatePropertyData(), ...propertyData };

  await page.goto('/dashboard/properties');
  await page.getByRole('button', { name: /nouvelle propriété|new property|ajouter/i }).click();

  // Step 1: Basic info
  await page.getByLabel(/nom|name/i).fill(data.name);
  await page.getByLabel(/type/i).selectOption({ label: data.type });
  await page.getByLabel(/description/i).fill(data.description);
  await page.getByRole('button', { name: /suivant|next/i }).click();

  // Step 2: Address
  await page.getByLabel(/rue|street/i).fill(data.address.street);
  await page.getByLabel(/ville|city/i).fill(data.address.city);
  await page.getByLabel(/province|state/i).fill(data.address.state);
  await page.getByLabel(/code postal|postal code|zip/i).fill(data.address.postalCode);
  await page.getByLabel(/pays|country/i).fill(data.address.country);
  await page.getByRole('button', { name: /suivant|next/i }).click();

  // Step 3: Contact
  await page.getByLabel(/nom du contact|contact name/i).fill(data.contact.name);
  await page.getByLabel(/email|courriel/i).fill(data.contact.email);
  await page.getByLabel(/téléphone|phone/i).fill(data.contact.phone);
  await page.getByRole('button', { name: /créer|create|enregistrer|save/i }).click();

  // Wait for success and get property ID
  await page.waitForURL(/\/dashboard\/properties\/\w+/, { timeout: 10000 });
  const url = page.url();
  const propertyId = url.split('/').pop() || '';

  return propertyId;
}

/**
 * Create a test lot through the UI
 */
export async function createLotViaUI(page: Page, propertyId: string, lotData?: Partial<TestLot>): Promise<string> {
  const data = { ...generateLotData(propertyId), ...lotData };

  await page.goto(`/dashboard/properties/${propertyId}`);
  await page.getByRole('button', { name: /nouveau lot|new lot|ajouter/i }).click();

  // Step 1: Basic info
  await page.getByLabel(/nom|name/i).fill(data.name);
  await page.getByLabel(/description/i).fill(data.description);
  await page.getByLabel(/type/i).selectOption({ label: data.type });
  await page.getByLabel(/nombre de personnes|max guests/i).fill(data.maxGuests.toString());
  await page.getByRole('button', { name: /suivant|next/i }).click();

  // Step 2: Pricing & Amenities
  await page.getByLabel(/prix de base|base price/i).fill(data.basePrice.toString());

  // Select amenities
  for (const amenity of data.amenities) {
    await page.getByLabel(new RegExp(amenity, 'i')).check();
  }

  await page.getByRole('button', { name: /créer|create|enregistrer|save/i }).click();

  // Wait for success and get lot ID
  await page.waitForURL(/\/dashboard\/properties\/\w+\/lots\/\w+/, { timeout: 10000 });
  const url = page.url();
  const lotId = url.split('/').pop() || '';

  return lotId;
}

/**
 * Create a test reservation through the public booking flow
 */
export async function createReservationViaUI(
  page: Page,
  lotId: string,
  reservationData?: Partial<TestReservation>
): Promise<string> {
  const data = { ...generateReservationData(lotId), ...reservationData };

  // Navigate to lot details
  await page.goto(`/lots/${lotId}`);

  // Fill booking form
  await page.getByLabel(/check-in|arrivée/i).fill(data.checkIn);
  await page.getByLabel(/check-out|départ/i).fill(data.checkOut);
  await page.getByLabel(/nombre de personnes|guests/i).fill(data.guests.toString());

  await page.getByRole('button', { name: /réserver|book|reserve/i }).click();

  // Fill guest information
  await page.getByLabel(/nom|name/i).fill(data.guestName);
  await page.getByLabel(/email|courriel/i).fill(data.guestEmail);
  await page.getByLabel(/téléphone|phone/i).fill(data.guestPhone);

  await page.getByRole('button', { name: /confirmer|confirm/i }).click();

  // Wait for confirmation page
  await page.waitForURL(/\/reservations\/\w+\/confirmation/, { timeout: 10000 });
  const url = page.url();
  const reservationId = url.split('/').filter(s => s === 'reservations')[1] || '';

  return reservationId;
}

/**
 * Delete test property
 */
export async function deleteProperty(page: Page, propertyId: string): Promise<void> {
  await page.goto(`/dashboard/properties/${propertyId}`);
  await page.getByRole('button', { name: /supprimer|delete/i }).click();
  await page.getByRole('button', { name: /confirmer|confirm/i }).click();
  await page.waitForURL(/\/dashboard\/properties$/, { timeout: 5000 });
}

/**
 * Delete test lot
 */
export async function deleteLot(page: Page, propertyId: string, lotId: string): Promise<void> {
  await page.goto(`/dashboard/properties/${propertyId}/lots/${lotId}`);
  await page.getByRole('button', { name: /supprimer|delete/i }).click();
  await page.getByRole('button', { name: /confirmer|confirm/i }).click();
  await page.waitForURL(/\/dashboard\/properties\/\w+$/, { timeout: 5000 });
}

/**
 * Clean up all test data created during tests
 */
export async function cleanupTestData(page: Page): Promise<void> {
  // This would ideally use direct database access or API calls
  // For now, we'll rely on test isolation and database reset between runs
  console.log('Cleanup test data - implement based on your cleanup strategy');
}
