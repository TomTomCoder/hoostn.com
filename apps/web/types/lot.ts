/**
 * Lot Type Definitions
 * TypeScript interfaces for lot (unit) management
 */

/**
 * Base lot interface from database
 */
export interface Lot {
  id: string;
  property_id: string;
  org_id: string;
  title: string;
  description: string | null;
  bedrooms: number;
  bathrooms: number;
  max_guests: number;
  base_price: number | null;
  cleaning_fee: number;
  tourist_tax: number;
  pets_allowed: boolean;
  status: 'active' | 'inactive' | 'maintenance';
  created_at: string;
  updated_at: string;
}

/**
 * Lot image interface
 */
export interface LotImage {
  id: string;
  lot_id: string;
  org_id: string;
  storage_path: string;
  filename: string;
  file_size: number;
  mime_type: string;
  width: number | null;
  height: number | null;
  display_order: number;
  is_primary: boolean;
  created_at: string;
}

/**
 * Lot with images for display
 */
export interface LotWithImages extends Lot {
  images: LotImage[];
  primary_image_path: string | null;
  image_count: number;
}

/**
 * Lot amenity assignment
 */
export interface LotAmenityAssignment {
  id: string;
  lot_id: string;
  amenity_id: string;
  quantity: number;
  notes: string | null;
}

/**
 * Availability rule for blocking dates
 */
export interface AvailabilityRule {
  id: string;
  lot_id: string;
  org_id: string;
  start_date: string;
  end_date: string;
  rule_type: 'blocked' | 'price_override' | 'min_stay';
  price_per_night: number | null;
  min_nights: number | null;
  reason: string | null;
  created_at: string;
}

/**
 * Pricing season for seasonal pricing
 */
export interface PricingSeason {
  id: string;
  lot_id: string;
  org_id: string;
  name: string;
  start_date: string;
  end_date: string;
  price_per_night: number;
  min_nights: number;
  created_at: string;
}

/**
 * Complete lot details with all related data
 */
export interface LotWithDetails extends Lot {
  images: LotImage[];
  amenities: LotAmenityAssignment[];
  availability_rules: AvailabilityRule[];
  pricing_seasons: PricingSeason[];
  primary_image_path: string | null;
  image_count: number;
}

/**
 * Lot form data for creation/updates
 */
export interface LotFormData {
  // Basic info
  title: string;
  description?: string | null;
  bedrooms: number;
  bathrooms: number;
  max_guests: number;
  pets_allowed: boolean;
  status: 'active' | 'inactive' | 'maintenance';

  // Pricing
  base_price?: number | null;
  cleaning_fee: number;
  tourist_tax: number;

  // Amenities
  amenity_ids?: string[];

  // Images
  images?: File[];
}

/**
 * Lot list item for property lot listing
 */
export interface LotListItem {
  id: string;
  property_id: string;
  title: string;
  bedrooms: number;
  bathrooms: number;
  max_guests: number;
  base_price: number | null;
  status: 'active' | 'inactive' | 'maintenance';
  primary_image_path: string | null;
  image_count: number;
}

/**
 * Lot filters for list queries
 */
export interface LotFilters {
  property_id?: string;
  status?: 'active' | 'inactive' | 'maintenance';
  min_bedrooms?: number;
  max_bedrooms?: number;
  min_bathrooms?: number;
  max_bathrooms?: number;
  min_guests?: number;
  max_guests?: number;
  pets_allowed?: boolean;
  min_price?: number;
  max_price?: number;
  search?: string;
  limit?: number;
  offset?: number;
  sort_by?: 'created_at' | 'updated_at' | 'title' | 'base_price';
  sort_order?: 'asc' | 'desc';
}
