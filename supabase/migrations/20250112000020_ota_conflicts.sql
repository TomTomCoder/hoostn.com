-- OTA Conflicts Table
-- Stores booking conflicts detected during sync (e.g., double bookings, overlapping dates)

CREATE TABLE ota_conflicts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  lot_id UUID REFERENCES lots(id) ON DELETE CASCADE NOT NULL,
  connection_id UUID REFERENCES ota_connections(id) ON DELETE CASCADE NOT NULL,
  conflict_type VARCHAR(50) NOT NULL, -- 'double_booking', 'date_overlap', 'cancellation_sync', 'price_mismatch'
  status VARCHAR(50) DEFAULT 'unresolved' NOT NULL, -- 'unresolved', 'resolved', 'ignored'
  severity VARCHAR(50) DEFAULT 'high' NOT NULL, -- 'low', 'medium', 'high', 'critical'
  local_reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL, -- Existing local reservation
  remote_booking_id VARCHAR(255), -- Remote OTA booking ID
  conflict_data JSONB NOT NULL DEFAULT '{}'::jsonb, -- Detailed conflict information
  resolution_action VARCHAR(50), -- 'keep_local', 'keep_remote', 'manual_merge', 'cancelled_both'
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  detected_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  resolved_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for querying conflicts
CREATE INDEX idx_ota_conflicts_org_id ON ota_conflicts(org_id);
CREATE INDEX idx_ota_conflicts_lot_id ON ota_conflicts(lot_id);
CREATE INDEX idx_ota_conflicts_connection_id ON ota_conflicts(connection_id);
CREATE INDEX idx_ota_conflicts_status ON ota_conflicts(status);
CREATE INDEX idx_ota_conflicts_severity ON ota_conflicts(severity);
CREATE INDEX idx_ota_conflicts_detected_at ON ota_conflicts(detected_at DESC);
CREATE INDEX idx_ota_conflicts_unresolved ON ota_conflicts(status, detected_at) WHERE status = 'unresolved';

-- RLS Policies
ALTER TABLE ota_conflicts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access conflicts in their organization
CREATE POLICY ota_conflicts_org_isolation ON ota_conflicts
  FOR ALL
  USING (
    org_id IN (
      SELECT org_id FROM users WHERE id = auth.uid()
    )
  );

-- Trigger to update updated_at timestamp
CREATE TRIGGER ota_conflicts_updated_at
  BEFORE UPDATE ON ota_conflicts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE ota_conflicts IS 'Booking conflicts detected during OTA synchronization';
COMMENT ON COLUMN ota_conflicts.conflict_type IS 'Type of conflict: double_booking (same dates), date_overlap (partial), cancellation_sync, price_mismatch';
COMMENT ON COLUMN ota_conflicts.severity IS 'Conflict severity for prioritization: low, medium, high, critical';
COMMENT ON COLUMN ota_conflicts.conflict_data IS 'Detailed conflict info: {local_dates: {}, remote_dates: {}, local_price: number, remote_price: number, etc}';
COMMENT ON COLUMN ota_conflicts.resolution_action IS 'How the conflict was resolved: keep_local, keep_remote, manual_merge, cancelled_both';
COMMENT ON COLUMN ota_conflicts.local_reservation_id IS 'Existing local reservation that conflicts with remote booking';
COMMENT ON COLUMN ota_conflicts.remote_booking_id IS 'Remote OTA booking ID that conflicts';
