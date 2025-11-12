/**
 * Booking Type Definitions
 * TypeScript interfaces for booking and availability management
 */

/**
 * Booking parameters for creating a reservation
 */
export interface BookingParams {
  lotId: string;
  checkIn: string; // ISO date string (YYYY-MM-DD)
  checkOut: string; // ISO date string (YYYY-MM-DD)
  guests: number;
}

/**
 * Price breakdown for a booking
 */
export interface PriceBreakdown {
  nights: number;
  nightlyRate: number;
  accommodationTotal: number; // nights × nightlyRate
  cleaningFee: number;
  touristTax: number; // per guest per night
  totalBeforeTax: number;
  total: number;
}

/**
 * Availability check result
 */
export interface AvailabilityCheck {
  available: boolean;
  reason?: string; // Reason if not available
  blockedDates?: string[]; // List of blocked date strings
  minNights?: number; // Minimum nights requirement
}

/**
 * Date range for availability
 */
export interface DateRange {
  start: string; // ISO date string
  end: string; // ISO date string
}

/**
 * Blocked date information
 */
export interface BlockedDate {
  date: string; // ISO date string
  reason: string;
  ruleType: 'blocked' | 'reserved';
}

/**
 * Reservation status
 */
export type ReservationStatus =
  | 'pending'
  | 'confirmed'
  | 'checked_in'
  | 'checked_out'
  | 'cancelled';

/**
 * Payment status
 */
export type PaymentStatus = 'pending' | 'paid' | 'refunded';

/**
 * Guest reservation data (from database)
 */
export interface Reservation {
  id: string;
  lot_id: string;
  org_id: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string | null;
  check_in: string; // DATE from database
  check_out: string; // DATE from database
  guests_count: number;
  total_price: number;
  status: ReservationStatus;
  channel: string;
  external_id: string | null;
  payment_status: PaymentStatus;
  created_at: string;
  updated_at: string;
}

/**
 * Reservation with lot details for display
 */
export interface ReservationWithLot extends Reservation {
  lot: {
    id: string;
    title: string;
    property_id: string;
    primary_image_path: string | null;
  };
}

/**
 * Reservation with full lot and property details
 */
export interface ReservationWithDetails extends Reservation {
  lot: {
    id: string;
    title: string;
    bedrooms: number;
    bathrooms: number;
    max_guests: number;
    property_id: string;
  };
  property: {
    id: string;
    name: string;
    address: string;
    city: string;
  };
}

/**
 * Reservation filters for dashboard
 */
export interface ReservationFilters {
  status?: ReservationStatus | 'all';
  paymentStatus?: PaymentStatus | 'all';
  dateFrom?: string;
  dateTo?: string;
  propertyId?: string;
  lotId?: string;
  search?: string; // Search by guest name or email
}

/**
 * Reservation statistics for dashboard
 */
export interface ReservationStats {
  totalReservations: number;
  upcomingCheckIns: number;
  pendingPayments: number;
  pendingPaymentsAmount: number;
  monthRevenue: number;
}

/**
 * Input for creating a reservation
 */
export interface CreateReservationInput {
  lot_id: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  check_in: string; // YYYY-MM-DD
  check_out: string; // YYYY-MM-DD
  guests_count: number;
  special_requests?: string;
}

/**
 * Public lot data (for non-authenticated users)
 */
export interface PublicLot {
  id: string;
  property_id: string;
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
 * Public lot with all details for display
 */
export interface PublicLotWithDetails extends PublicLot {
  images: Array<{
    id: string;
    storage_path: string;
    filename: string;
    display_order: number;
    is_primary: boolean;
  }>;
  amenities: Array<{
    id: string;
    amenity_id: string;
    quantity: number;
    notes: string | null;
    amenity: {
      id: string;
      name: string;
      category: string;
      icon: string | null;
    };
  }>;
  property: {
    id: string;
    name: string;
    address: string;
    city: string;
    state: string;
    zip_code: string;
    country: string;
    latitude: number | null;
    longitude: number | null;
  };
  pricing_seasons: Array<{
    id: string;
    name: string;
    start_date: string;
    end_date: string;
    price_per_night: number;
    min_nights: number;
  }>;
  availability_rules: Array<{
    id: string;
    start_date: string;
    end_date: string;
    rule_type: 'blocked' | 'price_override' | 'min_stay';
    price_per_night: number | null;
    min_nights: number | null;
    reason: string | null;
  }>;
  primary_image_path: string | null;
  image_count: number;
}
