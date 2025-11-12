/**
 * Pricing Utilities
 * Helper functions for calculating lot pricing with seasonal rates, fees, and taxes
 */

import { createClient } from '@/lib/supabase/server';
import type { PricingSeason, AvailabilityRule } from '@/types/lot';

/**
 * Price breakdown interface
 */
export interface PriceBreakdown {
  base_total: number;
  cleaning_fee: number;
  tourist_tax: number;
  total: number;
  nights: number;
  average_per_night: number;
  seasonal_pricing_applied: boolean;
  price_override_applied: boolean;
  seasonal_details?: Array<{
    date: string;
    price: number;
    season_name?: string;
  }>;
}

/**
 * Calculate the number of nights between two dates
 *
 * @param checkIn - Check-in date (YYYY-MM-DD)
 * @param checkOut - Check-out date (YYYY-MM-DD)
 * @returns Number of nights
 */
export function calculateNights(checkIn: string, checkOut: string): number {
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);

  const diffTime = checkOutDate.getTime() - checkInDate.getTime();
  const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return nights;
}

/**
 * Get seasonal price for a specific date
 *
 * @param lotId - UUID of the lot
 * @param date - Date to check (YYYY-MM-DD)
 * @returns Seasonal price per night or null if no season applies
 */
export async function getSeasonalPrice(
  lotId: string,
  date: string
): Promise<number | null> {
  try {
    const supabase = await createClient();

    // Get active pricing season for this date
    const { data: season, error } = await supabase
      .from('lot_pricing_seasons')
      .select('price_per_night')
      .eq('lot_id', lotId)
      .lte('start_date', date)
      .gte('end_date', date)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !season) {
      return null;
    }

    return season.price_per_night;
  } catch (error) {
    console.error('Error getting seasonal price:', error);
    return null;
  }
}

/**
 * Get price override for a specific date
 *
 * @param lotId - UUID of the lot
 * @param date - Date to check (YYYY-MM-DD)
 * @returns Price override per night or null if no override applies
 */
export async function getPriceOverride(
  lotId: string,
  date: string
): Promise<number | null> {
  try {
    const supabase = await createClient();

    // Get price override rule for this date
    const { data: rule, error } = await supabase
      .from('availability_rules')
      .select('price_per_night')
      .eq('lot_id', lotId)
      .eq('rule_type', 'price_override')
      .lte('start_date', date)
      .gte('end_date', date)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !rule || !rule.price_per_night) {
      return null;
    }

    return rule.price_per_night;
  } catch (error) {
    console.error('Error getting price override:', error);
    return null;
  }
}

/**
 * Calculate total stay price for a lot
 * Considers base price, seasonal pricing, price overrides, cleaning fee, and tourist tax
 *
 * @param lotId - UUID of the lot
 * @param checkIn - Check-in date (YYYY-MM-DD)
 * @param checkOut - Check-out date (YYYY-MM-DD)
 * @param guests - Number of guests (for tourist tax calculation)
 * @returns Price breakdown or null if lot not found
 */
export async function calculateLotPrice(
  lotId: string,
  checkIn: string,
  checkOut: string,
  guests: number
): Promise<PriceBreakdown | null> {
  try {
    const supabase = await createClient();

    // Get lot details
    const { data: lot, error: lotError } = await supabase
      .from('lots')
      .select('base_price, cleaning_fee, tourist_tax')
      .eq('id', lotId)
      .single();

    if (lotError || !lot || !lot.base_price) {
      return null;
    }

    const nights = calculateNights(checkIn, checkOut);
    if (nights <= 0) {
      return null;
    }

    // Calculate price for each night
    const checkInDate = new Date(checkIn);
    let baseTotal = 0;
    let seasonalPricingApplied = false;
    let priceOverrideApplied = false;
    const seasonalDetails: Array<{
      date: string;
      price: number;
      season_name?: string;
    }> = [];

    for (let i = 0; i < nights; i++) {
      const currentDate = new Date(checkInDate);
      currentDate.setDate(currentDate.getDate() + i);
      const dateStr = currentDate.toISOString().split('T')[0];

      // Check for price override first (highest priority)
      const priceOverride = await getPriceOverride(lotId, dateStr);
      if (priceOverride !== null) {
        baseTotal += priceOverride;
        priceOverrideApplied = true;
        seasonalDetails.push({
          date: dateStr,
          price: priceOverride,
        });
        continue;
      }

      // Check for seasonal pricing
      const seasonalPrice = await getSeasonalPrice(lotId, dateStr);
      if (seasonalPrice !== null) {
        baseTotal += seasonalPrice;
        seasonalPricingApplied = true;
        seasonalDetails.push({
          date: dateStr,
          price: seasonalPrice,
        });
        continue;
      }

      // Use base price
      baseTotal += lot.base_price;
      seasonalDetails.push({
        date: dateStr,
        price: lot.base_price,
      });
    }

    // Calculate fees
    const cleaningFee = lot.cleaning_fee || 0;
    const touristTax = (lot.tourist_tax || 0) * guests * nights;

    // Calculate total
    const total = baseTotal + cleaningFee + touristTax;
    const averagePerNight = baseTotal / nights;

    return {
      base_total: baseTotal,
      cleaning_fee: cleaningFee,
      tourist_tax: touristTax,
      total,
      nights,
      average_per_night: averagePerNight,
      seasonal_pricing_applied: seasonalPricingApplied,
      price_override_applied: priceOverrideApplied,
      seasonal_details: seasonalDetails,
    };
  } catch (error) {
    console.error('Error calculating lot price:', error);
    return null;
  }
}

/**
 * Calculate total stay price with provided values (no database queries)
 * Useful for quick calculations when you already have the values
 *
 * @param basePrice - Base price per night
 * @param cleaningFee - One-time cleaning fee
 * @param touristTax - Tourist tax per person per night
 * @param nights - Number of nights
 * @param guests - Number of guests
 * @returns Total price
 */
export function getTotalStayPrice(
  basePrice: number,
  cleaningFee: number,
  touristTax: number,
  nights: number,
  guests: number
): number {
  const baseCost = basePrice * nights;
  const taxCost = touristTax * guests * nights;
  return baseCost + cleaningFee + taxCost;
}

/**
 * Format price for display
 *
 * @param amount - Amount to format
 * @param currency - Currency code (default: EUR)
 * @param locale - Locale for formatting (default: fr-FR)
 * @returns Formatted price string
 */
export function formatPrice(
  amount: number,
  currency: string = 'EUR',
  locale: string = 'fr-FR'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Calculate price per night average for a date range
 * Useful for displaying average nightly rate
 *
 * @param lotId - UUID of the lot
 * @param checkIn - Check-in date (YYYY-MM-DD)
 * @param checkOut - Check-out date (YYYY-MM-DD)
 * @returns Average price per night or null
 */
export async function getAveragePricePerNight(
  lotId: string,
  checkIn: string,
  checkOut: string
): Promise<number | null> {
  const priceBreakdown = await calculateLotPrice(lotId, checkIn, checkOut, 1);

  if (!priceBreakdown) {
    return null;
  }

  return priceBreakdown.average_per_night;
}

/**
 * Get price range for a lot (min-max based on seasonal pricing)
 *
 * @param lotId - UUID of the lot
 * @returns Price range { min, max } or null
 */
export async function getLotPriceRange(
  lotId: string
): Promise<{ min: number; max: number } | null> {
  try {
    const supabase = await createClient();

    // Get lot base price
    const { data: lot, error: lotError } = await supabase
      .from('lots')
      .select('base_price')
      .eq('id', lotId)
      .single();

    if (lotError || !lot || !lot.base_price) {
      return null;
    }

    // Get all seasonal prices
    const { data: seasons, error: seasonsError } = await supabase
      .from('lot_pricing_seasons')
      .select('price_per_night')
      .eq('lot_id', lotId);

    if (seasonsError) {
      // Return base price as both min and max if no seasons
      return { min: lot.base_price, max: lot.base_price };
    }

    // Get all price override rules
    const { data: overrides, error: overridesError } = await supabase
      .from('availability_rules')
      .select('price_per_night')
      .eq('lot_id', lotId)
      .eq('rule_type', 'price_override')
      .not('price_per_night', 'is', null);

    const allPrices: number[] = [lot.base_price];

    if (seasons && seasons.length > 0) {
      allPrices.push(...seasons.map((s) => s.price_per_night));
    }

    if (!overridesError && overrides && overrides.length > 0) {
      allPrices.push(
        ...overrides.map((o) => o.price_per_night).filter((p): p is number => p !== null)
      );
    }

    return {
      min: Math.min(...allPrices),
      max: Math.max(...allPrices),
    };
  } catch (error) {
    console.error('Error getting lot price range:', error);
    return null;
  }
}

/**
 * Validate minimum stay requirement for a date range
 *
 * @param lotId - UUID of the lot
 * @param checkIn - Check-in date (YYYY-MM-DD)
 * @param checkOut - Check-out date (YYYY-MM-DD)
 * @returns { valid: boolean, required_nights?: number, message?: string }
 */
export async function validateMinimumStay(
  lotId: string,
  checkIn: string,
  checkOut: string
): Promise<{
  valid: boolean;
  required_nights?: number;
  message?: string;
}> {
  try {
    const nights = calculateNights(checkIn, checkOut);
    const supabase = await createClient();

    // Check for minimum stay rules
    const { data: minStayRules, error } = await supabase
      .from('availability_rules')
      .select('min_nights')
      .eq('lot_id', lotId)
      .eq('rule_type', 'min_stay')
      .or(`start_date.lte.${checkOut},end_date.gte.${checkIn}`)
      .not('min_nights', 'is', null);

    if (error) {
      console.error('Error checking minimum stay:', error);
      return { valid: true };
    }

    if (minStayRules && minStayRules.length > 0) {
      // Find the highest minimum stay requirement
      const maxMinNights = Math.max(
        ...minStayRules.map((r) => r.min_nights).filter((n): n is number => n !== null)
      );

      if (nights < maxMinNights) {
        return {
          valid: false,
          required_nights: maxMinNights,
          message: `Minimum stay of ${maxMinNights} nights required`,
        };
      }
    }

    return { valid: true };
  } catch (error) {
    console.error('Error validating minimum stay:', error);
    return { valid: true };
  }
}
