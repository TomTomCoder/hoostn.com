/**
 * Mapbox Geocoding Integration
 * Server-side geocoding and reverse geocoding using Mapbox API
 */

import mbxClient from '@mapbox/mapbox-sdk';
import mbxGeocoding from '@mapbox/mapbox-sdk/services/geocoding';

/**
 * Geocoding result type
 */
export interface GeocodingResult {
  latitude: number;
  longitude: number;
  formatted_address: string;
  accuracy: string;
  place_name: string;
  city: string | null;
  postal_code: string | null;
  country: string | null;
  country_code: string | null;
}

/**
 * Geocoding error type
 */
export class GeocodingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GeocodingError';
  }
}

/**
 * Initialize Mapbox client
 */
function getMapboxClient() {
  const accessToken = process.env.MAPBOX_SECRET_TOKEN;

  if (!accessToken) {
    throw new GeocodingError(
      'MAPBOX_SECRET_TOKEN environment variable is not set'
    );
  }

  const baseClient = mbxClient({ accessToken });
  return mbxGeocoding(baseClient);
}

/**
 * Extract city from Mapbox place context
 * @param context - Array of context objects from Mapbox response
 * @returns City name or null
 */
function extractCity(context: Array<{ id: string; text: string }>): string | null {
  const cityContext = context.find((c) =>
    c.id.startsWith('place.') || c.id.startsWith('locality.')
  );
  return cityContext?.text || null;
}

/**
 * Extract postal code from Mapbox place context
 * @param context - Array of context objects from Mapbox response
 * @returns Postal code or null
 */
function extractPostalCode(context: Array<{ id: string; text: string }>): string | null {
  const postalContext = context.find((c) => c.id.startsWith('postcode.'));
  return postalContext?.text || null;
}

/**
 * Extract country from Mapbox place context
 * @param context - Array of context objects from Mapbox response
 * @returns Country name or null
 */
function extractCountry(context: Array<{ id: string; text: string }>): string | null {
  const countryContext = context.find((c) => c.id.startsWith('country.'));
  return countryContext?.text || null;
}

/**
 * Extract country code from Mapbox place context
 * @param context - Array of context objects from Mapbox response
 * @returns ISO 3166-1 alpha-2 country code or null
 */
function extractCountryCode(context: Array<{ id: string; text: string; short_code?: string }>): string | null {
  const countryContext = context.find((c) => c.id.startsWith('country.'));
  return countryContext?.short_code?.toUpperCase() || null;
}

/**
 * Geocode an address to coordinates
 * Converts a human-readable address into latitude/longitude coordinates
 *
 * @param address - Full address string to geocode
 * @param options - Additional options
 * @param options.country - ISO 3166-1 alpha-2 country code to limit results (e.g., 'FR', 'US')
 * @param options.proximity - [longitude, latitude] to bias results near this location
 * @returns Promise resolving to geocoding result
 * @throws GeocodingError if geocoding fails
 *
 * @example
 * ```ts
 * const result = await geocodeAddress('1 Rue de Rivoli, Paris, France', {
 *   country: 'FR'
 * });
 * console.log(result.latitude, result.longitude);
 * ```
 */
export async function geocodeAddress(
  address: string,
  options?: {
    country?: string;
    proximity?: [number, number];
  }
): Promise<GeocodingResult> {
  try {
    const geocodingClient = getMapboxClient();

    const request = geocodingClient.forwardGeocode({
      query: address,
      limit: 1,
      countries: options?.country ? [options.country.toLowerCase()] : undefined,
      proximity: options?.proximity,
    });

    const response = await request.send();

    if (!response.body.features || response.body.features.length === 0) {
      throw new GeocodingError('No results found for the provided address');
    }

    const feature = response.body.features[0];
    const [longitude, latitude] = feature.center;

    // Extract context information
    const context = feature.context || [];
    const city = extractCity(context);
    const postalCode = extractPostalCode(context);
    const country = extractCountry(context);
    const countryCode = extractCountryCode(context);

    return {
      latitude,
      longitude,
      formatted_address: feature.place_name,
      accuracy: feature.properties?.accuracy || 'unknown',
      place_name: feature.place_name,
      city: city || feature.text, // Fallback to text if no city found
      postal_code: postalCode,
      country,
      country_code: countryCode,
    };
  } catch (error) {
    if (error instanceof GeocodingError) {
      throw error;
    }

    console.error('Geocoding error:', error);

    if (error instanceof Error) {
      throw new GeocodingError(`Failed to geocode address: ${error.message}`);
    }

    throw new GeocodingError('Failed to geocode address: Unknown error');
  }
}

/**
 * Reverse geocode coordinates to address
 * Converts latitude/longitude coordinates into a human-readable address
 *
 * @param latitude - Latitude coordinate
 * @param longitude - Longitude coordinate
 * @param options - Additional options
 * @param options.types - Limit results to specific place types (e.g., ['address', 'poi'])
 * @returns Promise resolving to geocoding result
 * @throws GeocodingError if reverse geocoding fails
 *
 * @example
 * ```ts
 * const result = await reverseGeocode(48.8566, 2.3522);
 * console.log(result.formatted_address);
 * ```
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number,
  options?: {
    types?: string[];
  }
): Promise<GeocodingResult> {
  try {
    // Validate coordinates
    if (latitude < -90 || latitude > 90) {
      throw new GeocodingError('Latitude must be between -90 and 90');
    }

    if (longitude < -180 || longitude > 180) {
      throw new GeocodingError('Longitude must be between -180 and 180');
    }

    const geocodingClient = getMapboxClient();

    const request = geocodingClient.reverseGeocode({
      query: [longitude, latitude],
      limit: 1,
      types: options?.types,
    });

    const response = await request.send();

    if (!response.body.features || response.body.features.length === 0) {
      throw new GeocodingError('No results found for the provided coordinates');
    }

    const feature = response.body.features[0];

    // Extract context information
    const context = feature.context || [];
    const city = extractCity(context);
    const postalCode = extractPostalCode(context);
    const country = extractCountry(context);
    const countryCode = extractCountryCode(context);

    return {
      latitude,
      longitude,
      formatted_address: feature.place_name,
      accuracy: feature.properties?.accuracy || 'unknown',
      place_name: feature.place_name,
      city: city || feature.text,
      postal_code: postalCode,
      country,
      country_code: countryCode,
    };
  } catch (error) {
    if (error instanceof GeocodingError) {
      throw error;
    }

    console.error('Reverse geocoding error:', error);

    if (error instanceof Error) {
      throw new GeocodingError(`Failed to reverse geocode: ${error.message}`);
    }

    throw new GeocodingError('Failed to reverse geocode: Unknown error');
  }
}

/**
 * Validate and geocode address, returning enriched address data
 * This is a convenience function that geocodes an address and returns
 * structured data suitable for database storage
 *
 * @param address - Address components or full address string
 * @returns Promise resolving to validated and geocoded address data
 * @throws GeocodingError if geocoding fails
 *
 * @example
 * ```ts
 * const result = await validateAndGeocodeAddress({
 *   address: '1 Rue de Rivoli',
 *   city: 'Paris',
 *   postalCode: '75001',
 *   country: 'FR'
 * });
 * ```
 */
export async function validateAndGeocodeAddress(address: {
  address: string;
  city?: string;
  postalCode?: string;
  country?: string;
}): Promise<{
  address: string;
  city: string;
  postal_code: string | null;
  country: string;
  latitude: number;
  longitude: number;
  formatted_address: string;
}> {
  // Construct full address string
  const fullAddress = [
    address.address,
    address.city,
    address.postalCode,
    address.country,
  ]
    .filter(Boolean)
    .join(', ');

  // Geocode the address
  const result = await geocodeAddress(fullAddress, {
    country: address.country,
  });

  return {
    address: address.address,
    city: result.city || address.city || '',
    postal_code: result.postal_code || address.postalCode || null,
    country: result.country_code || address.country || '',
    latitude: result.latitude,
    longitude: result.longitude,
    formatted_address: result.formatted_address,
  };
}
