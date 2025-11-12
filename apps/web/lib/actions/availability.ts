'use server';

/**
 * Availability and Pricing Server Actions
 * Server-side actions for checking availability and calculating prices
 * Public actions (no authentication required)
 */

import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import type {
  AvailabilityCheck,
  PriceBreakdown,
  PublicLotWithDetails,
} from '@/types/booking';

/**
 * Action result type for consistent error handling
 */
export type ActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Get a public lot by ID with all details (no authentication required)
 * @param lotId - Lot ID
 * @returns Complete lot data or error
 */
export async function getPublicLotById(
  lotId: string
): Promise<ActionResult<PublicLotWithDetails>> {
  try {
    // Validate ID
    const idSchema = z.string().uuid();
    if (!idSchema.safeParse(lotId).success) {
      return { success: false, error: 'Invalid lot ID' };
    }

    const supabase = await createClient();

    // Fetch lot with related data (no auth required, RLS should allow public read for active lots)
    const { data: lot, error } = await supabase
      .from('lots')
      .select(
        `
        *,
        lot_images!lot_images_lot_id_fkey (
          id,
          storage_path,
          filename,
          display_order,
          is_primary
        ),
        lot_amenities!lot_amenities_lot_id_fkey (
          id,
          amenity_id,
          quantity,
          notes,
          amenities (
            id,
            name,
            category,
            icon
          )
        ),
        properties!lots_property_id_fkey (
          id,
          name,
          address,
          city,
          state,
          zip_code,
          country,
          latitude,
          longitude
        ),
        lot_pricing_seasons!lot_pricing_seasons_lot_id_fkey (
          id,
          name,
          start_date,
          end_date,
          price_per_night,
          min_nights
        ),
        availability_rules!availability_rules_lot_id_fkey (
          id,
          start_date,
          end_date,
          rule_type,
          price_per_night,
          min_nights,
          reason
        )
      `
      )
      .eq('id', lotId)
      .eq('status', 'active') // Only return active lots publicly
      .single();

    if (error || !lot) {
      return { success: false, error: 'Lot not found' };
    }

    // Transform data
    const images = Array.isArray(lot.lot_images) ? lot.lot_images : [];
    const primaryImage = images.find((img: { is_primary: boolean }) => img.is_primary);

    const lotWithDetails: PublicLotWithDetails = {
      ...lot,
      images: images.sort(
        (a: { display_order: number }, b: { display_order: number }) =>
          a.display_order - b.display_order
      ),
      amenities: Array.isArray(lot.lot_amenities)
        ? lot.lot_amenities.map((la: any) => ({
            id: la.id,
            amenity_id: la.amenity_id,
            quantity: la.quantity,
            notes: la.notes,
            amenity: la.amenities,
          }))
        : [],
      property: lot.properties,
      pricing_seasons: Array.isArray(lot.lot_pricing_seasons)
        ? lot.lot_pricing_seasons
        : [],
      availability_rules: Array.isArray(lot.availability_rules)
        ? lot.availability_rules
        : [],
      primary_image_path: primaryImage?.storage_path || null,
      image_count: images.length,
    };

    return { success: true, data: lotWithDetails };
  } catch (error) {
    console.error('Unexpected error fetching public lot:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}

/**
 * Check if a lot is available for the given dates
 * @param lotId - Lot ID
 * @param checkIn - Check-in date (YYYY-MM-DD)
 * @param checkOut - Check-out date (YYYY-MM-DD)
 * @returns Availability status
 */
export async function checkAvailability(
  lotId: string,
  checkIn: string,
  checkOut: string
): Promise<ActionResult<AvailabilityCheck>> {
  try {
    // Validate inputs
    const schema = z.object({
      lotId: z.string().uuid(),
      checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    });

    const validation = schema.safeParse({ lotId, checkIn, checkOut });
    if (!validation.success) {
      return { success: false, error: 'Invalid input parameters' };
    }

    // Validate date logic
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (checkInDate < today) {
      return {
        success: true,
        data: {
          available: false,
          reason: 'Check-in date must be today or later',
        },
      };
    }

    if (checkOutDate <= checkInDate) {
      return {
        success: true,
        data: {
          available: false,
          reason: 'Check-out date must be after check-in date',
        },
      };
    }

    const supabase = await createClient();

    // Check if lot exists and is active
    const { data: lot, error: lotError } = await supabase
      .from('lots')
      .select('id, status')
      .eq('id', lotId)
      .eq('status', 'active')
      .single();

    if (lotError || !lot) {
      return {
        success: true,
        data: {
          available: false,
          reason: 'Lot not found or not available',
        },
      };
    }

    // Check availability rules for blocked dates
    const { data: blockedRules, error: rulesError } = await supabase
      .from('availability_rules')
      .select('start_date, end_date, rule_type, min_nights')
      .eq('lot_id', lotId)
      .or(`rule_type.eq.blocked,rule_type.eq.min_stay`)
      .lte('start_date', checkOut)
      .gte('end_date', checkIn);

    if (rulesError) {
      console.error('Error checking availability rules:', rulesError);
      return { success: false, error: 'Failed to check availability' };
    }

    // Check for blocked dates
    const blockedDates: string[] = [];
    let minNights: number | undefined;

    if (blockedRules && blockedRules.length > 0) {
      for (const rule of blockedRules) {
        if (rule.rule_type === 'blocked') {
          // Check if dates overlap with blocked period
          const ruleStart = new Date(rule.start_date);
          const ruleEnd = new Date(rule.end_date);

          if (
            (checkInDate >= ruleStart && checkInDate <= ruleEnd) ||
            (checkOutDate >= ruleStart && checkOutDate <= ruleEnd) ||
            (checkInDate <= ruleStart && checkOutDate >= ruleEnd)
          ) {
            return {
              success: true,
              data: {
                available: false,
                reason: 'Selected dates include blocked periods',
              },
            };
          }
        } else if (rule.rule_type === 'min_stay' && rule.min_nights) {
          minNights = Math.max(minNights || 0, rule.min_nights);
        }
      }
    }

    // Check minimum stay requirement
    if (minNights) {
      const nights = Math.ceil(
        (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (nights < minNights) {
        return {
          success: true,
          data: {
            available: false,
            reason: `Minimum stay of ${minNights} night${minNights > 1 ? 's' : ''} required`,
            minNights,
          },
        };
      }
    }

    // Check existing reservations (if reservations table exists)
    // Note: This assumes you have a reservations table
    // If not, you can remove this check
    try {
      const { data: reservations, error: reservationsError } = await supabase
        .from('reservations')
        .select('check_in, check_out, status')
        .eq('lot_id', lotId)
        .in('status', ['pending', 'confirmed'])
        .lte('check_in', checkOut)
        .gte('check_out', checkIn);

      if (!reservationsError && reservations && reservations.length > 0) {
        return {
          success: true,
          data: {
            available: false,
            reason: 'Selected dates are already reserved',
          },
        };
      }
    } catch (error) {
      // If reservations table doesn't exist yet, continue
      console.log('Reservations table not found, skipping reservation check');
    }

    // All checks passed - dates are available
    return {
      success: true,
      data: {
        available: true,
        minNights,
      },
    };
  } catch (error) {
    console.error('Unexpected error checking availability:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}

/**
 * Calculate price for a booking
 * @param lotId - Lot ID
 * @param checkIn - Check-in date (YYYY-MM-DD)
 * @param checkOut - Check-out date (YYYY-MM-DD)
 * @param guests - Number of guests
 * @returns Price breakdown
 */
export async function calculatePrice(
  lotId: string,
  checkIn: string,
  checkOut: string,
  guests: number
): Promise<ActionResult<PriceBreakdown>> {
  try {
    // Validate inputs
    const schema = z.object({
      lotId: z.string().uuid(),
      checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      guests: z.number().int().positive(),
    });

    const validation = schema.safeParse({ lotId, checkIn, checkOut, guests });
    if (!validation.success) {
      return { success: false, error: 'Invalid input parameters' };
    }

    const supabase = await createClient();

    // Fetch lot details
    const { data: lot, error: lotError } = await supabase
      .from('lots')
      .select('base_price, cleaning_fee, tourist_tax, max_guests')
      .eq('id', lotId)
      .single();

    if (lotError || !lot) {
      return { success: false, error: 'Lot not found' };
    }

    // Validate guest count
    if (guests > lot.max_guests) {
      return {
        success: false,
        error: `Maximum ${lot.max_guests} guest${lot.max_guests > 1 ? 's' : ''} allowed`,
      };
    }

    // Calculate number of nights
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const nights = Math.ceil(
      (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (nights <= 0) {
      return { success: false, error: 'Invalid date range' };
    }

    // Check for pricing seasons
    const { data: pricingSeasons } = await supabase
      .from('lot_pricing_seasons')
      .select('price_per_night, start_date, end_date')
      .eq('lot_id', lotId)
      .lte('start_date', checkIn)
      .gte('end_date', checkIn)
      .order('created_at', { ascending: false })
      .limit(1);

    // Use seasonal price if available, otherwise use base price
    let nightlyRate = lot.base_price || 0;
    if (pricingSeasons && pricingSeasons.length > 0) {
      nightlyRate = pricingSeasons[0].price_per_night;
    }

    // Check for price override rules
    const { data: priceOverrides } = await supabase
      .from('availability_rules')
      .select('price_per_night, start_date, end_date')
      .eq('lot_id', lotId)
      .eq('rule_type', 'price_override')
      .lte('start_date', checkIn)
      .gte('end_date', checkIn)
      .order('created_at', { ascending: false })
      .limit(1);

    if (
      priceOverrides &&
      priceOverrides.length > 0 &&
      priceOverrides[0].price_per_night
    ) {
      nightlyRate = priceOverrides[0].price_per_night;
    }

    // Calculate totals
    const accommodationTotal = nights * nightlyRate;
    const cleaningFee = lot.cleaning_fee || 0;
    const touristTax = lot.tourist_tax * guests * nights; // per guest per night
    const totalBeforeTax = accommodationTotal + cleaningFee;
    const total = totalBeforeTax + touristTax;

    const breakdown: PriceBreakdown = {
      nights,
      nightlyRate,
      accommodationTotal,
      cleaningFee,
      touristTax,
      totalBeforeTax,
      total,
    };

    return { success: true, data: breakdown };
  } catch (error) {
    console.error('Unexpected error calculating price:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}

/**
 * Get blocked dates for a lot (for calendar display)
 * @param lotId - Lot ID
 * @param startDate - Start date to check from (YYYY-MM-DD)
 * @param endDate - End date to check until (YYYY-MM-DD)
 * @returns Array of blocked date strings
 */
export async function getBlockedDates(
  lotId: string,
  startDate: string,
  endDate: string
): Promise<ActionResult<string[]>> {
  try {
    // Validate inputs
    const schema = z.object({
      lotId: z.string().uuid(),
      startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    });

    const validation = schema.safeParse({ lotId, startDate, endDate });
    if (!validation.success) {
      return { success: false, error: 'Invalid input parameters' };
    }

    const supabase = await createClient();

    // Get blocked dates from availability rules
    const { data: blockedRules, error: rulesError } = await supabase
      .from('availability_rules')
      .select('start_date, end_date')
      .eq('lot_id', lotId)
      .eq('rule_type', 'blocked')
      .lte('start_date', endDate)
      .gte('end_date', startDate);

    const blockedDates: string[] = [];

    if (!rulesError && blockedRules) {
      for (const rule of blockedRules) {
        const ruleStart = new Date(rule.start_date);
        const ruleEnd = new Date(rule.end_date);
        const currentDate = new Date(ruleStart);

        while (currentDate <= ruleEnd) {
          const dateStr = currentDate.toISOString().split('T')[0];
          if (!blockedDates.includes(dateStr)) {
            blockedDates.push(dateStr);
          }
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }
    }

    // Get reserved dates from reservations (if table exists)
    try {
      const { data: reservations, error: reservationsError } = await supabase
        .from('reservations')
        .select('check_in, check_out')
        .eq('lot_id', lotId)
        .in('status', ['pending', 'confirmed'])
        .lte('check_in', endDate)
        .gte('check_out', startDate);

      if (!reservationsError && reservations) {
        for (const reservation of reservations) {
          const resStart = new Date(reservation.check_in);
          const resEnd = new Date(reservation.check_out);
          const currentDate = new Date(resStart);

          while (currentDate < resEnd) {
            const dateStr = currentDate.toISOString().split('T')[0];
            if (!blockedDates.includes(dateStr)) {
              blockedDates.push(dateStr);
            }
            currentDate.setDate(currentDate.getDate() + 1);
          }
        }
      }
    } catch (error) {
      // If reservations table doesn't exist, continue
      console.log('Reservations table not found, skipping reservation dates');
    }

    return { success: true, data: blockedDates.sort() };
  } catch (error) {
    console.error('Unexpected error getting blocked dates:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}
