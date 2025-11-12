/**
 * Search Type Definitions
 * TypeScript interfaces for public search functionality
 */

/**
 * Search parameters for filtering lots
 */
export interface SearchParams {
  // Location
  city?: string;

  // Dates
  checkIn?: string; // ISO date string (YYYY-MM-DD)
  checkOut?: string; // ISO date string (YYYY-MM-DD)

  // Guests
  guests?: number;

  // Price range
  minPrice?: number;
  maxPrice?: number;

  // Property features
  bedrooms?: number; // Exact match or minimum
  bathrooms?: number;

  // Amenities (array of amenity IDs)
  amenities?: string[];

  // Pets
  petsAllowed?: boolean;

  // Pagination
  page?: number;
  limit?: number;

  // Sorting
  sortBy?: 'price_low' | 'price_high' | 'bedrooms' | 'guests' | 'newest';
}

/**
 * Lot image for search results
 */
export interface SearchLotImage {
  id: string;
  storage_path: string;
  is_primary: boolean;
  alt_text: string | null;
}

/**
 * Amenity for search results
 */
export interface SearchAmenity {
  id: string;
  name: string;
  category: 'essential' | 'kitchen' | 'bathroom' | 'entertainment' | 'outdoor';
  icon: string | null;
}

/**
 * Property info for search results
 */
export interface SearchProperty {
  id: string;
  name: string;
  city: string;
  country: string;
  address: string;
}

/**
 * Individual search result (lot with property and images)
 */
export interface SearchResult {
  // Lot information
  id: string;
  title: string;
  description: string | null;
  bedrooms: number;
  bathrooms: number;
  max_guests: number;
  base_price: number;
  cleaning_fee: number;
  tourist_tax: number;
  pets_allowed: boolean;

  // Related property
  property: SearchProperty;

  // Images
  images: SearchLotImage[];
  primary_image_url: string | null;

  // Amenities (limited preview, e.g., first 5)
  amenities: SearchAmenity[];
  amenity_count: number;

  // Availability (if dates provided)
  is_available?: boolean;
}

/**
 * Search response with results and pagination
 */
export interface SearchResponse {
  results: SearchResult[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  has_more: boolean;
}

/**
 * Amenity filter option for UI
 */
export interface AmenityFilterOption {
  id: string;
  name: string;
  category: 'essential' | 'kitchen' | 'bathroom' | 'entertainment' | 'outdoor';
  icon: string | null;
  count?: number; // Number of lots with this amenity
}

/**
 * Search form validation schema type
 */
export interface SearchFormData {
  city: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  amenities?: string[];
  petsAllowed?: boolean;
}

/**
 * City suggestion for autocomplete
 */
export interface CitySuggestion {
  city: string;
  country: string;
  lot_count: number;
}

/**
 * Price range statistics for a search
 */
export interface PriceRange {
  min: number;
  max: number;
  avg: number;
}

/**
 * Search filters summary
 */
export interface SearchFiltersSummary {
  available_cities: CitySuggestion[];
  price_range: PriceRange;
  max_bedrooms: number;
  max_bathrooms: number;
  max_guests: number;
  available_amenities: AmenityFilterOption[];
  total_lots: number;
}
