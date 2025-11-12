/**
 * Lot Validation Schemas
 * Zod schemas for lot (unit) validation
 */

import { z } from 'zod';

/**
 * Lot status enum
 */
export const lotStatusEnum = z.enum(['active', 'inactive', 'maintenance']);

/**
 * Basic Info Step Schema
 * Validates core lot information
 */
export const basicInfoSchema = z.object({
  title: z
    .string()
    .min(3, 'Lot title must be at least 3 characters')
    .max(255, 'Lot title must be less than 255 characters'),
  description: z
    .string()
    .min(20, 'Description must be at least 20 characters')
    .max(2000, 'Description must be less than 2000 characters')
    .optional()
    .nullable(),
  bedrooms: z
    .number()
    .int('Bedrooms must be a whole number')
    .min(0, 'Bedrooms cannot be negative')
    .max(50, 'Bedrooms must be less than 50'),
  bathrooms: z
    .number()
    .int('Bathrooms must be a whole number')
    .min(0, 'Bathrooms cannot be negative')
    .max(50, 'Bathrooms must be less than 50'),
  max_guests: z
    .number()
    .int('Max guests must be a whole number')
    .min(1, 'Lot must accommodate at least 1 guest')
    .max(100, 'Max guests must be less than 100'),
  pets_allowed: z.boolean().default(false),
  status: lotStatusEnum.default('active'),
});

/**
 * Amenities & Pricing Step Schema
 * Validates amenities, base pricing, fees
 */
export const amenitiesPricingSchema = z.object({
  amenity_ids: z
    .array(z.string().uuid('Invalid amenity ID'))
    .optional()
    .default([]),
  base_price: z
    .number()
    .positive('Base price must be positive')
    .max(100000, 'Base price must be less than 100,000')
    .optional()
    .nullable(),
  cleaning_fee: z
    .number()
    .min(0, 'Cleaning fee cannot be negative')
    .max(10000, 'Cleaning fee must be less than 10,000')
    .default(0),
  tourist_tax: z
    .number()
    .min(0, 'Tourist tax cannot be negative')
    .max(1000, 'Tourist tax must be less than 1,000')
    .default(0),
});

/**
 * Images & Availability Step Schema
 * Validates images and availability rules
 */
export const imagesAvailabilitySchema = z.object({
  images: z
    .array(
      z.object({
        file: z.instanceof(File, { message: 'Invalid file type' }),
        preview: z.string().url('Invalid preview URL'),
      })
    )
    .min(1, 'At least one image is required')
    .max(20, 'Maximum 20 images allowed')
    .optional(),
});

/**
 * Complete Lot Form Schema
 * Combines all step schemas for full validation
 */
export const lotSchema = basicInfoSchema
  .merge(amenitiesPricingSchema)
  .merge(imagesAvailabilitySchema);

/**
 * Lot creation schema (requires property_id)
 */
export const createLotSchema = lotSchema.extend({
  property_id: z.string().uuid('Invalid property ID'),
});

/**
 * Lot update schema (all fields optional except ID)
 */
export const updateLotSchema = lotSchema.partial().extend({
  id: z.string().uuid('Invalid lot ID'),
});

/**
 * Availability rule schema
 */
export const availabilityRuleSchema = z.object({
  lot_id: z.string().uuid('Invalid lot ID'),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  rule_type: z.enum(['blocked', 'price_override', 'min_stay']),
  price_per_night: z
    .number()
    .positive('Price must be positive')
    .max(100000, 'Price must be less than 100,000')
    .optional()
    .nullable(),
  min_nights: z
    .number()
    .int('Minimum nights must be a whole number')
    .min(1, 'Minimum nights must be at least 1')
    .max(365, 'Minimum nights must be less than 365')
    .optional()
    .nullable(),
  reason: z
    .string()
    .max(500, 'Reason must be less than 500 characters')
    .optional()
    .nullable(),
});

/**
 * Pricing season schema
 */
export const pricingSeasonSchema = z.object({
  lot_id: z.string().uuid('Invalid lot ID'),
  name: z
    .string()
    .min(3, 'Season name must be at least 3 characters')
    .max(100, 'Season name must be less than 100 characters'),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  price_per_night: z
    .number()
    .positive('Price must be positive')
    .max(100000, 'Price must be less than 100,000'),
  min_nights: z
    .number()
    .int('Minimum nights must be a whole number')
    .min(1, 'Minimum nights must be at least 1')
    .max(365, 'Minimum nights must be less than 365')
    .default(1),
});

/**
 * Amenity assignment schema
 */
export const amenityAssignmentSchema = z.object({
  lot_id: z.string().uuid('Invalid lot ID'),
  amenity_id: z.string().uuid('Invalid amenity ID'),
  quantity: z
    .number()
    .int('Quantity must be a whole number')
    .min(1, 'Quantity must be at least 1')
    .max(100, 'Quantity must be less than 100')
    .default(1),
  notes: z
    .string()
    .max(500, 'Notes must be less than 500 characters')
    .optional()
    .nullable(),
});

/**
 * Bulk amenity update schema
 */
export const bulkAmenityUpdateSchema = z.object({
  lot_id: z.string().uuid('Invalid lot ID'),
  amenities: z.array(
    z.object({
      amenity_id: z.string().uuid('Invalid amenity ID'),
      quantity: z.number().int().min(1).max(100).default(1),
      notes: z.string().max(500).optional().nullable(),
    })
  ),
});

/**
 * Date range validation schema
 */
export const dateRangeSchema = z
  .object({
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid start date format'),
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid end date format'),
  })
  .refine((data) => new Date(data.start_date) < new Date(data.end_date), {
    message: 'End date must be after start date',
    path: ['end_date'],
  });

/**
 * Availability check schema
 */
export const availabilityCheckSchema = z.object({
  lot_id: z.string().uuid('Invalid lot ID'),
  check_in: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid check-in date format'),
  check_out: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid check-out date format'),
});

// Type exports
export type BasicInfoFormData = z.infer<typeof basicInfoSchema>;
export type AmenitiesPricingFormData = z.infer<typeof amenitiesPricingSchema>;
export type ImagesAvailabilityFormData = z.infer<typeof imagesAvailabilitySchema>;
export type LotFormData = z.infer<typeof lotSchema>;
export type CreateLotInput = z.infer<typeof createLotSchema>;
export type UpdateLotInput = z.infer<typeof updateLotSchema>;
export type AvailabilityRuleInput = z.infer<typeof availabilityRuleSchema>;
export type PricingSeasonInput = z.infer<typeof pricingSeasonSchema>;
export type AmenityAssignmentInput = z.infer<typeof amenityAssignmentSchema>;
export type BulkAmenityUpdateInput = z.infer<typeof bulkAmenityUpdateSchema>;
export type DateRangeInput = z.infer<typeof dateRangeSchema>;
export type AvailabilityCheckInput = z.infer<typeof availabilityCheckSchema>;
