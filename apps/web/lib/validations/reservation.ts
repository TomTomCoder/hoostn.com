/**
 * Reservation Validation Schemas
 * Zod schemas for reservation creation and management
 */

import { z } from 'zod';

/**
 * Phone number regex - supports international formats
 * Examples: +1234567890, +33 6 12 34 56 78, +44 20 7123 4567
 */
const phoneRegex = /^\+?[1-9]\d{1,14}$/;

/**
 * Guest information schema
 */
export const guestInfoSchema = z.object({
  guest_name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes'),
  guest_email: z
    .string()
    .email('Please enter a valid email address')
    .min(5, 'Email must be at least 5 characters')
    .max(255, 'Email must be less than 255 characters')
    .toLowerCase(),
  guest_phone: z
    .string()
    .min(10, 'Phone number must be at least 10 characters')
    .max(20, 'Phone number must be less than 20 characters')
    .regex(phoneRegex, 'Please enter a valid international phone number (e.g., +1234567890)'),
  special_requests: z
    .string()
    .max(1000, 'Special requests must be less than 1000 characters')
    .optional()
    .nullable(),
});

/**
 * Booking dates schema with validation
 */
export const bookingDatesSchema = z
  .object({
    check_in: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid check-in date format (must be YYYY-MM-DD)'),
    check_out: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid check-out date format (must be YYYY-MM-DD)'),
  })
  .refine(
    (data) => {
      const checkIn = new Date(data.check_in);
      const checkOut = new Date(data.check_out);
      return checkOut > checkIn;
    },
    {
      message: 'Check-out date must be after check-in date',
      path: ['check_out'],
    }
  )
  .refine(
    (data) => {
      const checkIn = new Date(data.check_in);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return checkIn >= today;
    },
    {
      message: 'Check-in date must be today or in the future',
      path: ['check_in'],
    }
  );

/**
 * Create reservation schema
 * Validates all required fields for creating a reservation
 */
export const createReservationSchema = z
  .object({
    lot_id: z.string().uuid('Invalid lot ID'),
    guests_count: z
      .number()
      .int('Number of guests must be a whole number')
      .min(1, 'At least 1 guest is required')
      .max(100, 'Number of guests cannot exceed 100'),
  })
  .merge(guestInfoSchema)
  .merge(bookingDatesSchema);

/**
 * Update reservation status schema
 */
export const updateReservationStatusSchema = z.object({
  reservation_id: z.string().uuid('Invalid reservation ID'),
  status: z.enum(['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled'], {
    errorMap: () => ({ message: 'Invalid reservation status' }),
  }),
});

/**
 * Cancel reservation schema
 */
export const cancelReservationSchema = z.object({
  reservation_id: z.string().uuid('Invalid reservation ID'),
  reason: z
    .string()
    .max(500, 'Cancellation reason must be less than 500 characters')
    .optional()
    .nullable(),
});

/**
 * Get reservations filters schema
 */
export const getReservationsFiltersSchema = z.object({
  org_id: z.string().uuid('Invalid organization ID'),
  status: z
    .enum(['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled'])
    .optional(),
  lot_id: z.string().uuid('Invalid lot ID').optional(),
  start_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid start date format')
    .optional(),
  end_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid end date format')
    .optional(),
  limit: z.number().int().min(1).max(100).default(20).optional(),
  offset: z.number().int().min(0).default(0).optional(),
});

/**
 * Availability check for reservation
 */
export const checkAvailabilitySchema = z
  .object({
    lot_id: z.string().uuid('Invalid lot ID'),
  })
  .merge(bookingDatesSchema)
  .extend({
    guests_count: z
      .number()
      .int('Number of guests must be a whole number')
      .min(1, 'At least 1 guest is required'),
  });

// Type exports
export type GuestInfoInput = z.infer<typeof guestInfoSchema>;
export type BookingDatesInput = z.infer<typeof bookingDatesSchema>;
export type CreateReservationInput = z.infer<typeof createReservationSchema>;
export type UpdateReservationStatusInput = z.infer<typeof updateReservationStatusSchema>;
export type CancelReservationInput = z.infer<typeof cancelReservationSchema>;
export type GetReservationsFiltersInput = z.infer<typeof getReservationsFiltersSchema>;
export type CheckAvailabilityInput = z.infer<typeof checkAvailabilitySchema>;
