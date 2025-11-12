/**
 * Amenity Type Definitions
 * TypeScript interfaces for amenity management
 */

/**
 * Amenity category types
 */
export type AmenityCategory =
  | 'essential'
  | 'kitchen'
  | 'bathroom'
  | 'entertainment'
  | 'outdoor';

/**
 * Base amenity interface from database
 */
export interface Amenity {
  id: string;
  name: string;
  category: AmenityCategory;
  icon: string | null;
  created_at: string;
}

/**
 * Lot amenity assignment (junction table)
 */
export interface LotAmenity {
  id: string;
  lot_id: string;
  amenity_id: string;
  quantity: number;
  notes: string | null;
}

/**
 * Amenity with assignment details for lot display
 */
export interface AmenityWithAssignment extends Amenity {
  assignment_id?: string;
  quantity: number;
  notes: string | null;
  is_assigned: boolean;
}

/**
 * Amenities grouped by category for UI
 */
export interface AmenitiesByCategory {
  essential: Amenity[];
  kitchen: Amenity[];
  bathroom: Amenity[];
  entertainment: Amenity[];
  outdoor: Amenity[];
}

/**
 * Amenity update payload
 */
export interface AmenityUpdatePayload {
  amenity_id: string;
  quantity?: number;
  notes?: string | null;
}

/**
 * Bulk amenity assignment payload
 */
export interface BulkAmenityAssignment {
  lot_id: string;
  amenities: {
    amenity_id: string;
    quantity: number;
    notes?: string | null;
  }[];
}
