'use server';

/**
 * Availability Rules Server Actions
 * Server-side actions for managing lot availability, date blocking, and pricing overrides
 */

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { AvailabilityRule } from '@/types/lot';
import { availabilityRuleSchema, dateRangeSchema, availabilityCheckSchema } from '@/lib/validations/lot';

/**
 * Action result type for consistent error handling
 */
export type ActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

/**
 * Get current user and organization ID
 */
async function getUserAndOrg(): Promise<{
  userId: string;
  orgId: string;
} | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Get org_id from users table
  const { data: userData, error } = await supabase
    .from('users')
    .select('org_id')
    .eq('id', user.id)
    .single();

  if (error || !userData?.org_id) {
    console.error('Failed to get user org_id:', error);
    return null;
  }

  return {
    userId: user.id,
    orgId: userData.org_id,
  };
}

/**
 * Create an availability rule
 *
 * @param lotId - UUID of the lot
 * @param data - Availability rule data
 * @returns Created availability rule or error
 */
export async function createAvailabilityRule(
  lotId: string,
  data: z.infer<typeof availabilityRuleSchema>
): Promise<ActionResult<AvailabilityRule>> {
  try {
    // Get authenticated user and org
    const auth = await getUserAndOrg();
    if (!auth) {
      return { success: false, error: 'You must be logged in to manage availability' };
    }

    // Validate input
    const validation = availabilityRuleSchema.safeParse({ ...data, lot_id: lotId });
    if (!validation.success) {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: validation.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const supabase = await createClient();

    // Verify lot exists and belongs to user's org
    const { data: lot, error: lotError } = await supabase
      .from('lots')
      .select('id, org_id, property_id')
      .eq('id', lotId)
      .eq('org_id', auth.orgId)
      .single();

    if (lotError || !lot) {
      return { success: false, error: 'Lot not found' };
    }

    // Check for overlapping rules of the same type
    const { data: overlapping, error: overlapError } = await supabase
      .from('availability_rules')
      .select('id')
      .eq('lot_id', lotId)
      .eq('rule_type', data.rule_type)
      .or(`start_date.lte.${data.end_date},end_date.gte.${data.start_date}`)
      .limit(1);

    if (overlapError) {
      console.error('Failed to check for overlapping rules:', overlapError);
    } else if (overlapping && overlapping.length > 0) {
      return {
        success: false,
        error: 'An overlapping rule already exists for these dates',
      };
    }

    // Create availability rule
    const { data: rule, error } = await supabase
      .from('availability_rules')
      .insert({
        lot_id: lotId,
        org_id: auth.orgId,
        start_date: data.start_date,
        end_date: data.end_date,
        rule_type: data.rule_type,
        price_per_night: data.price_per_night || null,
        min_nights: data.min_nights || null,
        reason: data.reason || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create availability rule:', error);
      return {
        success: false,
        error: 'Failed to create availability rule. Please try again.',
      };
    }

    // Revalidate lot page
    revalidatePath(`/dashboard/properties/${lot.property_id}/lots/${lotId}`);
    revalidatePath(`/lots/${lotId}`);

    return { success: true, data: rule as AvailabilityRule };
  } catch (error) {
    console.error('Unexpected error creating availability rule:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}

/**
 * Update an availability rule
 *
 * @param ruleId - UUID of the rule to update
 * @param data - Partial availability rule data
 * @returns Updated availability rule or error
 */
export async function updateAvailabilityRule(
  ruleId: string,
  data: Partial<z.infer<typeof availabilityRuleSchema>>
): Promise<ActionResult<AvailabilityRule>> {
  try {
    // Validate rule ID
    const idSchema = z.string().uuid();
    if (!idSchema.safeParse(ruleId).success) {
      return { success: false, error: 'Invalid rule ID' };
    }

    // Get authenticated user and org
    const auth = await getUserAndOrg();
    if (!auth) {
      return { success: false, error: 'You must be logged in to manage availability' };
    }

    const supabase = await createClient();

    // Check rule exists and belongs to user's org
    const { data: existingRule, error: fetchError } = await supabase
      .from('availability_rules')
      .select('id, lot_id, org_id')
      .eq('id', ruleId)
      .eq('org_id', auth.orgId)
      .single();

    if (fetchError || !existingRule) {
      return { success: false, error: 'Availability rule not found' };
    }

    // Get lot info for revalidation
    const { data: lot } = await supabase
      .from('lots')
      .select('property_id')
      .eq('id', existingRule.lot_id)
      .single();

    // Prepare update data
    const updateData: Record<string, unknown> = {};

    if (data.start_date !== undefined) updateData.start_date = data.start_date;
    if (data.end_date !== undefined) updateData.end_date = data.end_date;
    if (data.rule_type !== undefined) updateData.rule_type = data.rule_type;
    if (data.price_per_night !== undefined) updateData.price_per_night = data.price_per_night;
    if (data.min_nights !== undefined) updateData.min_nights = data.min_nights;
    if (data.reason !== undefined) updateData.reason = data.reason;

    // Update rule
    const { data: updatedRule, error } = await supabase
      .from('availability_rules')
      .update(updateData)
      .eq('id', ruleId)
      .eq('org_id', auth.orgId)
      .select()
      .single();

    if (error) {
      console.error('Failed to update availability rule:', error);
      return {
        success: false,
        error: 'Failed to update availability rule. Please try again.',
      };
    }

    // Revalidate lot page
    if (lot?.property_id) {
      revalidatePath(`/dashboard/properties/${lot.property_id}/lots/${existingRule.lot_id}`);
      revalidatePath(`/lots/${existingRule.lot_id}`);
    }

    return { success: true, data: updatedRule as AvailabilityRule };
  } catch (error) {
    console.error('Unexpected error updating availability rule:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}

/**
 * Delete an availability rule
 *
 * @param ruleId - UUID of the rule to delete
 * @returns Success or error
 */
export async function deleteAvailabilityRule(ruleId: string): Promise<ActionResult<void>> {
  try {
    // Validate rule ID
    const idSchema = z.string().uuid();
    if (!idSchema.safeParse(ruleId).success) {
      return { success: false, error: 'Invalid rule ID' };
    }

    // Get authenticated user and org
    const auth = await getUserAndOrg();
    if (!auth) {
      return { success: false, error: 'You must be logged in to manage availability' };
    }

    const supabase = await createClient();

    // Get rule info for revalidation
    const { data: rule, error: fetchError } = await supabase
      .from('availability_rules')
      .select('lot_id')
      .eq('id', ruleId)
      .eq('org_id', auth.orgId)
      .single();

    if (fetchError || !rule) {
      return { success: false, error: 'Availability rule not found' };
    }

    // Get lot info for revalidation
    const { data: lot } = await supabase
      .from('lots')
      .select('property_id')
      .eq('id', rule.lot_id)
      .single();

    // Delete rule
    const { error } = await supabase
      .from('availability_rules')
      .delete()
      .eq('id', ruleId)
      .eq('org_id', auth.orgId);

    if (error) {
      console.error('Failed to delete availability rule:', error);
      return {
        success: false,
        error: 'Failed to delete availability rule. Please try again.',
      };
    }

    // Revalidate lot page
    if (lot?.property_id) {
      revalidatePath(`/dashboard/properties/${lot.property_id}/lots/${rule.lot_id}`);
      revalidatePath(`/lots/${rule.lot_id}`);
    }

    return { success: true, data: undefined };
  } catch (error) {
    console.error('Unexpected error deleting availability rule:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}

/**
 * List availability rules for a lot
 *
 * @param lotId - UUID of the lot
 * @param dateRange - Optional date range to filter rules
 * @returns List of availability rules or error
 */
export async function listAvailabilityRules(
  lotId: string,
  dateRange?: { start_date: string; end_date: string }
): Promise<ActionResult<AvailabilityRule[]>> {
  try {
    // Validate lot ID
    const idSchema = z.string().uuid();
    if (!idSchema.safeParse(lotId).success) {
      return { success: false, error: 'Invalid lot ID' };
    }

    // Validate date range if provided
    if (dateRange) {
      const validation = dateRangeSchema.safeParse(dateRange);
      if (!validation.success) {
        return {
          success: false,
          error: 'Invalid date range',
        };
      }
    }

    // Get authenticated user and org
    const auth = await getUserAndOrg();
    if (!auth) {
      return { success: false, error: 'You must be logged in to view availability rules' };
    }

    const supabase = await createClient();

    // Build query
    let query = supabase
      .from('availability_rules')
      .select('*')
      .eq('lot_id', lotId)
      .eq('org_id', auth.orgId)
      .order('start_date', { ascending: true });

    // Apply date range filter if provided
    if (dateRange) {
      query = query.or(
        `start_date.lte.${dateRange.end_date},end_date.gte.${dateRange.start_date}`
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to fetch availability rules:', error);
      return {
        success: false,
        error: 'Failed to fetch availability rules. Please try again.',
      };
    }

    return { success: true, data: (data as AvailabilityRule[]) || [] };
  } catch (error) {
    console.error('Unexpected error fetching availability rules:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}

/**
 * Check if a date range is available for a lot
 * Checks for blocking rules and existing reservations
 *
 * @param lotId - UUID of the lot
 * @param checkIn - Check-in date (YYYY-MM-DD)
 * @param checkOut - Check-out date (YYYY-MM-DD)
 * @returns Availability status or error
 */
export async function checkDateAvailability(
  lotId: string,
  checkIn: string,
  checkOut: string
): Promise<
  ActionResult<{
    available: boolean;
    reason?: string;
    blocked_rules?: AvailabilityRule[];
  }>
> {
  try {
    // Validate input
    const validation = availabilityCheckSchema.safeParse({
      lot_id: lotId,
      check_in: checkIn,
      check_out: checkOut,
    });

    if (!validation.success) {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: validation.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    // Get authenticated user and org
    const auth = await getUserAndOrg();
    if (!auth) {
      return { success: false, error: 'You must be logged in to check availability' };
    }

    const supabase = await createClient();

    // Check for blocking rules
    const { data: blockingRules, error: rulesError } = await supabase
      .from('availability_rules')
      .select('*')
      .eq('lot_id', lotId)
      .eq('rule_type', 'blocked')
      .or(`start_date.lte.${checkOut},end_date.gte.${checkIn}`);

    if (rulesError) {
      console.error('Failed to check availability rules:', rulesError);
      return {
        success: false,
        error: 'Failed to check availability. Please try again.',
      };
    }

    if (blockingRules && blockingRules.length > 0) {
      return {
        success: true,
        data: {
          available: false,
          reason: 'Dates are blocked',
          blocked_rules: blockingRules as AvailabilityRule[],
        },
      };
    }

    // Check for existing reservations
    const { data: reservations, error: reservationsError } = await supabase
      .from('reservations')
      .select('id')
      .eq('lot_id', lotId)
      .neq('status', 'cancelled')
      .or(`check_in.lte.${checkOut},check_out.gte.${checkIn}`)
      .limit(1);

    if (reservationsError) {
      console.error('Failed to check reservations:', reservationsError);
      return {
        success: false,
        error: 'Failed to check availability. Please try again.',
      };
    }

    if (reservations && reservations.length > 0) {
      return {
        success: true,
        data: {
          available: false,
          reason: 'Dates are already reserved',
        },
      };
    }

    // Check minimum stay requirements
    const { data: minStayRules, error: minStayError } = await supabase
      .from('availability_rules')
      .select('*')
      .eq('lot_id', lotId)
      .eq('rule_type', 'min_stay')
      .or(`start_date.lte.${checkOut},end_date.gte.${checkIn}`);

    if (!minStayError && minStayRules && minStayRules.length > 0) {
      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);
      const nights = Math.ceil(
        (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      for (const rule of minStayRules as AvailabilityRule[]) {
        if (rule.min_nights && nights < rule.min_nights) {
          return {
            success: true,
            data: {
              available: false,
              reason: `Minimum stay of ${rule.min_nights} nights required`,
            },
          };
        }
      }
    }

    // Dates are available
    return {
      success: true,
      data: {
        available: true,
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
 * Get all blocked dates for a lot within a date range
 * Useful for calendar displays
 *
 * @param lotId - UUID of the lot
 * @param startDate - Start of date range (YYYY-MM-DD)
 * @param endDate - End of date range (YYYY-MM-DD)
 * @returns Array of blocked date ranges or error
 */
export async function getBlockedDates(
  lotId: string,
  startDate: string,
  endDate: string
): Promise<
  ActionResult<
    Array<{
      start_date: string;
      end_date: string;
      reason: string;
      type: 'blocked' | 'reserved';
    }>
  >
> {
  try {
    // Validate inputs
    const idSchema = z.string().uuid();
    const dateRangeValidation = dateRangeSchema.safeParse({
      start_date: startDate,
      end_date: endDate,
    });

    if (!idSchema.safeParse(lotId).success || !dateRangeValidation.success) {
      return { success: false, error: 'Invalid lot ID or date range' };
    }

    // Get authenticated user and org (optional for public view)
    const auth = await getUserAndOrg();

    const supabase = await createClient();

    const blockedDates: Array<{
      start_date: string;
      end_date: string;
      reason: string;
      type: 'blocked' | 'reserved';
    }> = [];

    // Get blocked rules
    const { data: blockingRules } = await supabase
      .from('availability_rules')
      .select('start_date, end_date, reason')
      .eq('lot_id', lotId)
      .eq('rule_type', 'blocked')
      .or(`start_date.lte.${endDate},end_date.gte.${startDate}`);

    if (blockingRules) {
      blockedDates.push(
        ...blockingRules.map((rule) => ({
          start_date: rule.start_date,
          end_date: rule.end_date,
          reason: rule.reason || 'Unavailable',
          type: 'blocked' as const,
        }))
      );
    }

    // Get reservations (if authenticated and same org)
    if (auth) {
      const { data: reservations } = await supabase
        .from('reservations')
        .select('check_in, check_out')
        .eq('lot_id', lotId)
        .neq('status', 'cancelled')
        .or(`check_in.lte.${endDate},check_out.gte.${startDate}`);

      if (reservations) {
        blockedDates.push(
          ...reservations.map((reservation) => ({
            start_date: reservation.check_in,
            end_date: reservation.check_out,
            reason: 'Reserved',
            type: 'reserved' as const,
          }))
        );
      }
    }

    return { success: true, data: blockedDates };
  } catch (error) {
    console.error('Unexpected error getting blocked dates:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}
