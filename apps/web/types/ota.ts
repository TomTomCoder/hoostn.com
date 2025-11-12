/**
 * OTA (Online Travel Agency) Type Definitions
 * TypeScript interfaces for OTA integration, iCal sync, and conflict management
 */

/**
 * Supported OTA platforms
 */
export type OTAPlatform =
  | 'airbnb_ical'
  | 'booking_api'
  | 'vrbo_ical'
  | 'expedia_ical';

/**
 * OTA connection status
 */
export type OTAConnectionStatus = 'active' | 'paused' | 'error' | 'deleted';

/**
 * Sync type for logging
 */
export type SyncType = 'import' | 'export' | 'manual' | 'scheduled';

/**
 * Sync direction
 */
export type SyncDirection = 'inbound' | 'outbound';

/**
 * Sync status
 */
export type SyncStatus = 'success' | 'error' | 'partial_success';

/**
 * OTA sync status for reservations
 */
export type OTASyncStatus = 'synced' | 'pending' | 'conflict' | 'error';

/**
 * Conflict types
 */
export type ConflictType =
  | 'double_booking'
  | 'date_overlap'
  | 'cancellation_sync'
  | 'price_mismatch';

/**
 * Conflict status
 */
export type ConflictStatus = 'unresolved' | 'resolved' | 'ignored';

/**
 * Conflict severity
 */
export type ConflictSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Resolution action for conflicts
 */
export type ResolutionAction =
  | 'keep_local'
  | 'keep_remote'
  | 'manual_merge'
  | 'cancelled_both';

/**
 * Triggered by source
 */
export type TriggeredBy = 'system' | 'user' | 'cron';

/**
 * OTA Connection configuration
 */
export interface OTAConnectionConfig {
  import_url?: string; // iCal feed URL for import
  export_enabled?: boolean; // Whether to publish iCal feed
  listing_id?: string; // Platform-specific listing ID
  api_key?: string; // For API-based integrations
  secret_key?: string; // For API-based integrations
  [key: string]: unknown; // Allow additional platform-specific fields
}

/**
 * OTA Connection (from database)
 */
export interface OTAConnection {
  id: string;
  org_id: string;
  lot_id: string;
  platform: OTAPlatform;
  status: OTAConnectionStatus;
  config: OTAConnectionConfig;
  last_sync_at: string | null;
  next_sync_at: string | null;
  sync_frequency_minutes: number;
  last_error: string | null;
  error_count: number;
  created_at: string;
  updated_at: string;
}

/**
 * OTA Connection with lot details
 */
export interface OTAConnectionWithLot extends OTAConnection {
  lot: {
    id: string;
    title: string;
    property_id: string;
  };
}

/**
 * OTA Sync Log (from database)
 */
export interface OTASyncLog {
  id: string;
  connection_id: string;
  org_id: string;
  sync_type: SyncType;
  direction: SyncDirection;
  status: SyncStatus;
  started_at: string;
  completed_at: string | null;
  items_processed: number;
  items_created: number;
  items_updated: number;
  items_failed: number;
  error_message: string | null;
  triggered_by: TriggeredBy;
  created_at: string;
}

/**
 * OTA Sync Log with connection details
 */
export interface OTASyncLogWithConnection extends OTASyncLog {
  connection: {
    id: string;
    platform: OTAPlatform;
    lot_id: string;
  };
}

/**
 * OTA Conflict (from database)
 */
export interface OTAConflict {
  id: string;
  org_id: string;
  lot_id: string;
  connection_id: string;
  conflict_type: ConflictType;
  status: ConflictStatus;
  severity: ConflictSeverity;
  local_reservation_id: string | null;
  remote_booking_id: string;
  conflict_data: ConflictData;
  resolution_action: ResolutionAction | null;
  resolved_by: string | null;
  detected_at: string;
  resolved_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Conflict data structure
 */
export interface ConflictData {
  local_dates?: {
    check_in: string;
    check_out: string;
  };
  remote_dates?: {
    check_in: string;
    check_out: string;
  };
  local_price?: number;
  remote_price?: number;
  local_guest_name?: string;
  remote_guest_name?: string;
  description?: string;
  [key: string]: unknown;
}

/**
 * OTA Conflict with details
 */
export interface OTAConflictWithDetails extends OTAConflict {
  lot: {
    id: string;
    title: string;
    property_id: string;
  };
  connection: {
    id: string;
    platform: OTAPlatform;
  };
  local_reservation?: {
    id: string;
    guest_name: string;
    check_in: string;
    check_out: string;
    total_price: number;
    status: string;
  };
}

/**
 * iCal Event (parsed from iCalendar format)
 */
export interface ICalEvent {
  uid: string; // Unique identifier (VEVENT UID)
  summary: string; // Event title/description
  dtstart: string; // Start date (ISO format)
  dtend: string; // End date (ISO format)
  status?: string; // Event status (CONFIRMED, CANCELLED, TENTATIVE)
  description?: string; // Additional description
  location?: string; // Location information
  created?: string; // Creation timestamp
  lastModified?: string; // Last modification timestamp
  organizer?: string; // Organizer information
  attendee?: string[]; // Attendees
  [key: string]: unknown; // Allow additional iCal properties
}

/**
 * Sync result from import/export operations
 */
export interface SyncResult {
  success: boolean;
  sync_log_id?: string;
  items_processed: number;
  items_created: number;
  items_updated: number;
  items_failed: number;
  conflicts: Array<{
    remote_booking_id: string;
    conflict_type: ConflictType;
    message: string;
  }>;
  errors: string[];
}

/**
 * Input for creating OTA connection
 */
export interface CreateOTAConnectionInput {
  lot_id: string;
  platform: OTAPlatform;
  config: OTAConnectionConfig;
  sync_frequency_minutes?: number; // Default: 30
}

/**
 * Input for updating OTA connection
 */
export interface UpdateOTAConnectionInput {
  status?: OTAConnectionStatus;
  config?: Partial<OTAConnectionConfig>;
  sync_frequency_minutes?: number;
}

/**
 * Input for resolving conflict
 */
export interface ResolveConflictInput {
  resolution_action: ResolutionAction;
  notes?: string;
}

/**
 * OTA metadata for reservations
 */
export interface OTAMetadata {
  platform: OTAPlatform;
  listing_id?: string;
  imported_at: string;
  original_summary?: string;
  original_description?: string;
  ical_uid?: string;
  last_modified?: string;
  [key: string]: unknown;
}

/**
 * Stats for OTA dashboard
 */
export interface OTAStats {
  total_connections: number;
  active_connections: number;
  error_connections: number;
  unresolved_conflicts: number;
  last_24h_syncs: number;
  last_24h_imports: number;
}
