import { z } from 'zod';

/**
 * Search form validation schema
 */
export const searchFormSchema = z
  .object({
    // Location
    city: z.string().optional(),

    // Dates
    checkIn: z.string().optional(),
    checkOut: z.string().optional(),

    // Guests
    guests: z.coerce.number().int().min(1).max(50).optional(),

    // Price range
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional(),

    // Property features
    bedrooms: z.coerce.number().int().min(0).max(20).optional(),
    bathrooms: z.coerce.number().int().min(0).max(10).optional(),

    // Amenities (comma-separated string, will be split into array)
    amenities: z.string().optional(),

    // Pets
    petsAllowed: z.coerce.boolean().optional(),

    // Pagination
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(50).optional(),

    // Sorting
    sortBy: z
      .enum(['price_low', 'price_high', 'bedrooms', 'guests', 'newest'])
      .optional(),
  })
  .refine(
    (data) => {
      // If checkIn is provided, checkOut must also be provided
      if (data.checkIn && !data.checkOut) return false;
      if (data.checkOut && !data.checkIn) return false;
      return true;
    },
    {
      message: 'Both check-in and check-out dates are required',
      path: ['checkOut'],
    }
  )
  .refine(
    (data) => {
      // Check-in must be today or later
      if (data.checkIn) {
        const checkInDate = new Date(data.checkIn);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return checkInDate >= today;
      }
      return true;
    },
    {
      message: 'Check-in date must be today or later',
      path: ['checkIn'],
    }
  )
  .refine(
    (data) => {
      // Check-out must be after check-in
      if (data.checkIn && data.checkOut) {
        return new Date(data.checkOut) > new Date(data.checkIn);
      }
      return true;
    },
    {
      message: 'Check-out date must be after check-in date',
      path: ['checkOut'],
    }
  )
  .refine(
    (data) => {
      // If maxPrice is set, it must be >= minPrice
      if (data.minPrice !== undefined && data.maxPrice !== undefined) {
        return data.maxPrice >= data.minPrice;
      }
      return true;
    },
    {
      message: 'Maximum price must be greater than or equal to minimum price',
      path: ['maxPrice'],
    }
  );

export type SearchFormInput = z.infer<typeof searchFormSchema>;
