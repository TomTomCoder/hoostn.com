/**
 * Property Validation Schemas
 *
 * NOTE: This file is created by Agent 4 for form validation.
 * Agent 2 should review and enhance these schemas as needed for backend validation.
 */

import { z } from 'zod';

// Property type enum
export const propertyTypeEnum = z.enum([
  'house',
  'apartment',
  'villa',
  'cabin',
  'cottage',
  'bungalow',
  'chalet',
  'other',
]);

// Basic Info Step Schema
export const basicInfoSchema = z.object({
  name: z
    .string()
    .min(3, 'Property name must be at least 3 characters')
    .max(255, 'Property name must be less than 255 characters'),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description must be less than 2000 characters')
    .optional()
    .nullable(),
  propertyType: propertyTypeEnum,
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
  maxGuests: z
    .number()
    .int('Max guests must be a whole number')
    .min(1, 'Property must accommodate at least 1 guest')
    .max(100, 'Max guests must be less than 100'),
});

// Address Step Schema
export const addressSchema = z.object({
  street: z
    .string()
    .min(3, 'Street address must be at least 3 characters')
    .max(500, 'Street address must be less than 500 characters'),
  city: z
    .string()
    .min(2, 'City must be at least 2 characters')
    .max(100, 'City must be less than 100 characters'),
  state: z
    .string()
    .max(100, 'State/Province must be less than 100 characters')
    .optional()
    .nullable(),
  postalCode: z
    .string()
    .max(20, 'Postal code must be less than 20 characters')
    .optional()
    .nullable(),
  country: z
    .string()
    .length(2, 'Country code must be 2 characters (ISO 3166-1 alpha-2)')
    .default('FR'),
  latitude: z
    .number()
    .min(-90, 'Latitude must be between -90 and 90')
    .max(90, 'Latitude must be between -90 and 90')
    .optional()
    .nullable(),
  longitude: z
    .number()
    .min(-180, 'Longitude must be between -180 and 180')
    .max(180, 'Longitude must be between -180 and 180')
    .optional()
    .nullable(),
});

// Currency enum
export const currencyEnum = z.enum(['USD', 'EUR', 'GBP', 'CAD', 'AUD']);

// Contact Settings Step Schema
export const contactSettingsSchema = z.object({
  contactEmail: z
    .string()
    .email('Must be a valid email address')
    .max(255, 'Email must be less than 255 characters'),
  contactPhone: z
    .string()
    .min(5, 'Phone number must be at least 5 characters')
    .max(20, 'Phone number must be less than 20 characters')
    .regex(/^[\d\s\-\+\(\)]+$/, 'Phone number contains invalid characters')
    .optional()
    .nullable(),
  checkInTime: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Check-in time must be in HH:MM format')
    .default('15:00'),
  checkOutTime: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Check-out time must be in HH:MM format')
    .default('11:00'),
  currency: currencyEnum.default('EUR'),
  instantBooking: z.boolean().default(false),
});

// Complete Property Form Schema (all steps combined)
export const propertyFormSchema = basicInfoSchema
  .merge(addressSchema)
  .merge(contactSettingsSchema);

// Type exports
export type BasicInfoFormData = z.infer<typeof basicInfoSchema>;
export type AddressFormData = z.infer<typeof addressSchema>;
export type ContactSettingsFormData = z.infer<typeof contactSettingsSchema>;
export type PropertyFormData = z.infer<typeof propertyFormSchema>;

// Property creation/update input schema (for server actions)
export const createPropertySchema = propertyFormSchema.extend({
  images: z
    .array(
      z.object({
        file: z.instanceof(File),
        preview: z.string().url(),
      })
    )
    .min(1, 'At least one image is required')
    .max(10, 'Maximum 10 images allowed'),
});

export const updatePropertySchema = propertyFormSchema.partial();

export type CreatePropertyInput = z.infer<typeof createPropertySchema>;
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;
