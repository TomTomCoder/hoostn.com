'use server';

/**
 * Public Search Server Actions
 * Server-side actions for public lot search functionality
 * No authentication required - uses public RLS policies
 */

import { createClient } from '@/lib/supabase/server';
import type {
  SearchParams,
  SearchResult,
  SearchResponse,
  SearchAmenity,
  CitySuggestion,
  SearchFiltersSummary,
  AmenityFilterOption,
} from '@/types/search';

/**
 * Action result type for consistent error handling
 */
export type ActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Get Supabase storage URL for lot images
 * @param storagePath - Storage path from lot_images table
 * @returns Full public URL or null
 */
function getImageUrl(storagePath: string | null): string | null {
  if (!storagePath) return null;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${supabaseUrl}/storage/v1/object/public/lot-images/${storagePath}`;
}

/**
 * Search for available lots with filters
 * Public action - no authentication required
 * @param params - Search parameters
 * @returns Search results with pagination
 */
export async function searchLots(
  params: SearchParams
): Promise<ActionResult<SearchResponse>> {
  try {
    const supabase = await createClient();

    // Validate and parse parameters
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(50, Math.max(1, params.limit || 20));
    const offset = (page - 1) * limit;

    // Build base query for lots with property and images
    let query = supabase
      .from('lots')
      .select(
        `
        id,
        title,
        description,
        bedrooms,
        bathrooms,
        max_guests,
        base_price,
        cleaning_fee,
        tourist_tax,
        pets_allowed,
        property_id,
        properties!inner (
          id,
          name,
          city,
          country,
          address
        ),
        lot_images (
          id,
          storage_path,
          is_primary,
          alt_text,
          display_order
        )
      `,
        { count: 'exact' }
      )
      .eq('status', 'active'); // Only active lots

    // Filter by city (case-insensitive)
    if (params.city) {
      query = query.ilike('properties.city', `%${params.city}%`);
    }

    // Filter by guests (lot must accommodate requested number)
    if (params.guests) {
      query = query.gte('max_guests', params.guests);
    }

    // Filter by price range
    if (params.minPrice !== undefined) {
      query = query.gte('base_price', params.minPrice);
    }
    if (params.maxPrice !== undefined) {
      query = query.lte('base_price', params.maxPrice);
    }

    // Filter by bedrooms (exact match or more)
    if (params.bedrooms !== undefined) {
      query = query.gte('bedrooms', params.bedrooms);
    }

    // Filter by bathrooms
    if (params.bathrooms !== undefined) {
      query = query.gte('bathrooms', params.bathrooms);
    }

    // Filter by pets allowed
    if (params.petsAllowed === true) {
      query = query.eq('pets_allowed', true);
    }

    // Apply sorting
    switch (params.sortBy) {
      case 'price_low':
        query = query.order('base_price', { ascending: true, nullsFirst: false });
        break;
      case 'price_high':
        query = query.order('base_price', { ascending: false, nullsFirst: false });
        break;
      case 'bedrooms':
        query = query.order('bedrooms', { ascending: false });
        break;
      case 'guests':
        query = query.order('max_guests', { ascending: false });
        break;
      case 'newest':
      default:
        query = query.order('created_at', { ascending: false });
        break;
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    // Execute query
    const { data: lots, error, count } = await query;

    if (error) {
      console.error('Failed to search lots:', error);
      return {
        success: false,
        error: 'Failed to search lots. Please try again.',
      };
    }

    if (!lots) {
      return {
        success: true,
        data: {
          results: [],
          total: 0,
          page,
          limit,
          total_pages: 0,
          has_more: false,
        },
      };
    }

    // Get lot IDs for amenity filtering
    let lotIds = lots.map((lot) => lot.id);

    // Filter by amenities if specified
    if (params.amenities && params.amenities.length > 0) {
      const { data: lotsWithAmenities } = await supabase
        .from('lot_amenities')
        .select('lot_id')
        .in('amenity_id', params.amenities)
        .in('lot_id', lotIds);

      if (lotsWithAmenities) {
        // Count how many of the requested amenities each lot has
        const lotAmenityCounts = lotsWithAmenities.reduce((acc, { lot_id }) => {
          acc[lot_id] = (acc[lot_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        // Only include lots that have ALL requested amenities
        const requiredCount = params.amenities.length;
        lotIds = Object.entries(lotAmenityCounts)
          .filter(([, count]) => count >= requiredCount)
          .map(([lotId]) => lotId);
      } else {
        lotIds = [];
      }
    }

    // Filter lots by amenity results
    const filteredLots = lots.filter((lot) => lotIds.includes(lot.id));

    // Fetch amenities for remaining lots
    const { data: lotAmenities } = await supabase
      .from('lot_amenities')
      .select(
        `
        lot_id,
        amenities (
          id,
          name,
          category,
          icon
        )
      `
      )
      .in('lot_id', lotIds);

    // Group amenities by lot
    const amenitiesByLot = (lotAmenities || []).reduce((acc, la) => {
      if (!acc[la.lot_id]) {
        acc[la.lot_id] = [];
      }
      if (la.amenities) {
        acc[la.lot_id].push(la.amenities as SearchAmenity);
      }
      return acc;
    }, {} as Record<string, SearchAmenity[]>);

    // Check availability if dates are provided
    let availabilityByLot: Record<string, boolean> = {};
    if (params.checkIn && params.checkOut && lotIds.length > 0) {
      // Check blocked availability rules
      const { data: blockedRules } = await supabase
        .from('availability_rules')
        .select('lot_id')
        .in('lot_id', lotIds)
        .eq('rule_type', 'blocked')
        .lte('start_date', params.checkOut)
        .gte('end_date', params.checkIn);

      const blockedLotIds = new Set(
        (blockedRules || []).map((rule) => rule.lot_id)
      );

      // Check existing reservations
      const { data: reservations } = await supabase
        .from('reservations')
        .select('lot_id')
        .in('lot_id', lotIds)
        .neq('status', 'cancelled')
        .lte('check_in', params.checkOut)
        .gte('check_out', params.checkIn);

      const reservedLotIds = new Set(
        (reservations || []).map((res) => res.lot_id)
      );

      // Mark lots as available if not blocked or reserved
      lotIds.forEach((lotId) => {
        availabilityByLot[lotId] =
          !blockedLotIds.has(lotId) && !reservedLotIds.has(lotId);
      });

      // Filter out unavailable lots if dates were specified
      lotIds = lotIds.filter((lotId) => availabilityByLot[lotId]);
    }

    // Final filtered lots based on availability
    const availableLots = filteredLots.filter((lot) =>
      !params.checkIn || !params.checkOut || availabilityByLot[lot.id] !== false
    );

    // Transform results
    const results: SearchResult[] = availableLots.map((lot) => {
      const images = Array.isArray(lot.lot_images)
        ? lot.lot_images.sort(
            (a: { display_order: number }, b: { display_order: number }) =>
              a.display_order - b.display_order
          )
        : [];

      const primaryImage = images.find(
        (img: { is_primary: boolean }) => img.is_primary
      );
      const primaryImageUrl = primaryImage
        ? getImageUrl(primaryImage.storage_path)
        : images[0]
        ? getImageUrl(images[0].storage_path)
        : null;

      const lotAmenities = amenitiesByLot[lot.id] || [];

      return {
        id: lot.id,
        title: lot.title,
        description: lot.description,
        bedrooms: lot.bedrooms,
        bathrooms: lot.bathrooms,
        max_guests: lot.max_guests,
        base_price: Number(lot.base_price) || 0,
        cleaning_fee: Number(lot.cleaning_fee) || 0,
        tourist_tax: Number(lot.tourist_tax) || 0,
        pets_allowed: lot.pets_allowed,
        property: Array.isArray(lot.properties)
          ? lot.properties[0]
          : lot.properties,
        images: images.map((img: {
          id: string;
          storage_path: string;
          is_primary: boolean;
          alt_text: string | null;
        }) => ({
          id: img.id,
          storage_path: img.storage_path,
          is_primary: img.is_primary,
          alt_text: img.alt_text,
        })),
        primary_image_url: primaryImageUrl,
        amenities: lotAmenities.slice(0, 5), // Show first 5 amenities
        amenity_count: lotAmenities.length,
        is_available:
          params.checkIn && params.checkOut
            ? availabilityByLot[lot.id]
            : undefined,
      };
    });

    // Calculate pagination
    const total = count || 0;
    const totalPages = Math.ceil(total / limit);
    const hasMore = page < totalPages;

    return {
      success: true,
      data: {
        results,
        total,
        page,
        limit,
        total_pages: totalPages,
        has_more: hasMore,
      },
    };
  } catch (error) {
    console.error('Unexpected error searching lots:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}

/**
 * Get available cities for search autocomplete
 * @returns List of cities with lot counts
 */
export async function getAvailableCities(): Promise<
  ActionResult<CitySuggestion[]>
> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('properties')
      .select('city, country')
      .order('city');

    if (error) {
      console.error('Failed to fetch cities:', error);
      return {
        success: false,
        error: 'Failed to fetch cities.',
      };
    }

    // Count lots per city and deduplicate
    const cityMap = new Map<string, CitySuggestion>();

    for (const prop of data || []) {
      const key = `${prop.city}-${prop.country}`;
      if (!cityMap.has(key)) {
        cityMap.set(key, {
          city: prop.city,
          country: prop.country,
          lot_count: 0,
        });
      }
      const city = cityMap.get(key)!;
      city.lot_count += 1;
    }

    const cities = Array.from(cityMap.values()).sort((a, b) =>
      a.city.localeCompare(b.city)
    );

    return {
      success: true,
      data: cities,
    };
  } catch (error) {
    console.error('Unexpected error fetching cities:', error);
    return {
      success: false,
      error: 'An unexpected error occurred.',
    };
  }
}

/**
 * Get all available amenities for filters
 * @returns List of amenities with categories
 */
export async function getAvailableAmenities(): Promise<
  ActionResult<AmenityFilterOption[]>
> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('amenities')
      .select('id, name, category, icon')
      .order('category')
      .order('name');

    if (error) {
      console.error('Failed to fetch amenities:', error);
      return {
        success: false,
        error: 'Failed to fetch amenities.',
      };
    }

    return {
      success: true,
      data: (data || []) as AmenityFilterOption[],
    };
  } catch (error) {
    console.error('Unexpected error fetching amenities:', error);
    return {
      success: false,
      error: 'An unexpected error occurred.',
    };
  }
}

/**
 * Get search filters summary (available options and ranges)
 * @returns Summary of available search filters
 */
export async function getSearchFiltersSummary(): Promise<
  ActionResult<SearchFiltersSummary>
> {
  try {
    const supabase = await createClient();

    // Get cities
    const citiesResult = await getAvailableCities();
    if (!citiesResult.success) {
      return { success: false, error: citiesResult.error };
    }

    // Get amenities
    const amenitiesResult = await getAvailableAmenities();
    if (!amenitiesResult.success) {
      return { success: false, error: amenitiesResult.error };
    }

    // Get price range and stats from active lots
    const { data: stats, error } = await supabase
      .from('lots')
      .select('base_price, bedrooms, bathrooms, max_guests')
      .eq('status', 'active')
      .not('base_price', 'is', null);

    if (error) {
      console.error('Failed to fetch lot stats:', error);
      return {
        success: false,
        error: 'Failed to fetch search filters.',
      };
    }

    const prices = (stats || [])
      .map((s) => Number(s.base_price))
      .filter((p) => p > 0);
    const bedrooms = (stats || []).map((s) => s.bedrooms);
    const bathrooms = (stats || []).map((s) => s.bathrooms);
    const guests = (stats || []).map((s) => s.max_guests);

    return {
      success: true,
      data: {
        available_cities: citiesResult.data,
        price_range: {
          min: prices.length > 0 ? Math.min(...prices) : 0,
          max: prices.length > 0 ? Math.max(...prices) : 1000,
          avg:
            prices.length > 0
              ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
              : 0,
        },
        max_bedrooms: bedrooms.length > 0 ? Math.max(...bedrooms) : 10,
        max_bathrooms: bathrooms.length > 0 ? Math.max(...bathrooms) : 5,
        max_guests: guests.length > 0 ? Math.max(...guests) : 20,
        available_amenities: amenitiesResult.data,
        total_lots: stats?.length || 0,
      },
    };
  } catch (error) {
    console.error('Unexpected error fetching search filters:', error);
    return {
      success: false,
      error: 'An unexpected error occurred.',
    };
  }
}
