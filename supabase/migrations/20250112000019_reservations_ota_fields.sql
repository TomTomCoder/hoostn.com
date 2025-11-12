-- Add OTA-related fields to reservations table
-- Tracks which reservations came from OTA platforms and their sync status

ALTER TABLE reservations
  ADD COLUMN ota_connection_id UUID REFERENCES ota_connections(id) ON DELETE SET NULL,
  ADD COLUMN ota_booking_id VARCHAR(255), -- Unique booking ID from OTA platform (e.g., iCal UID)
  ADD COLUMN ota_sync_status VARCHAR(50) DEFAULT 'synced', -- 'synced', 'pending', 'conflict', 'error'
  ADD COLUMN ota_last_synced_at TIMESTAMPTZ,
  ADD COLUMN ota_metadata JSONB DEFAULT '{}'::jsonb; -- Additional OTA-specific data

-- Index for finding reservations by OTA booking ID (for deduplication)
CREATE INDEX idx_reservations_ota_booking_id ON reservations(ota_booking_id) WHERE ota_booking_id IS NOT NULL;
CREATE INDEX idx_reservations_ota_connection_id ON reservations(ota_connection_id) WHERE ota_connection_id IS NOT NULL;
CREATE INDEX idx_reservations_ota_sync_status ON reservations(ota_sync_status);

-- Unique constraint to prevent duplicate imports of the same OTA booking
CREATE UNIQUE INDEX unique_ota_booking_per_connection
  ON reservations(ota_connection_id, ota_booking_id)
  WHERE ota_booking_id IS NOT NULL AND ota_connection_id IS NOT NULL;

-- Comments
COMMENT ON COLUMN reservations.ota_connection_id IS 'Link to OTA connection if this reservation was imported from an OTA';
COMMENT ON COLUMN reservations.ota_booking_id IS 'Unique booking identifier from OTA platform (e.g., iCal VEVENT UID)';
COMMENT ON COLUMN reservations.ota_sync_status IS 'Sync status: synced (up to date), pending (needs sync), conflict (booking conflict), error';
COMMENT ON COLUMN reservations.ota_metadata IS 'Additional OTA platform data: {platform: string, listing_id: string, imported_at: timestamp, etc}';
