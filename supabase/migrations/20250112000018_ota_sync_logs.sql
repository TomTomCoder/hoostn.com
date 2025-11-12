-- OTA Sync Logs Table
-- Stores detailed logs of each sync operation for monitoring and debugging

CREATE TABLE ota_sync_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  connection_id UUID REFERENCES ota_connections(id) ON DELETE CASCADE NOT NULL,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  sync_type VARCHAR(50) NOT NULL, -- 'import', 'export', 'manual', 'scheduled'
  direction VARCHAR(50) NOT NULL, -- 'inbound', 'outbound'
  status VARCHAR(50) NOT NULL, -- 'success', 'error', 'partial_success'
  started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMPTZ,
  items_processed INT DEFAULT 0,
  items_created INT DEFAULT 0,
  items_updated INT DEFAULT 0,
  items_failed INT DEFAULT 0,
  error_message TEXT,
  triggered_by VARCHAR(50) DEFAULT 'system', -- 'system', 'user', 'cron'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for querying and reporting
CREATE INDEX idx_ota_sync_logs_connection_id ON ota_sync_logs(connection_id);
CREATE INDEX idx_ota_sync_logs_org_id ON ota_sync_logs(org_id);
CREATE INDEX idx_ota_sync_logs_status ON ota_sync_logs(status);
CREATE INDEX idx_ota_sync_logs_started_at ON ota_sync_logs(started_at DESC);
CREATE INDEX idx_ota_sync_logs_sync_type ON ota_sync_logs(sync_type);

-- RLS Policies
ALTER TABLE ota_sync_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access sync logs in their organization
CREATE POLICY ota_sync_logs_org_isolation ON ota_sync_logs
  FOR ALL
  USING (
    org_id IN (
      SELECT org_id FROM users WHERE id = auth.uid()
    )
  );

-- Comments
COMMENT ON TABLE ota_sync_logs IS 'Audit trail of all OTA sync operations';
COMMENT ON COLUMN ota_sync_logs.sync_type IS 'Type of sync: import (fetch from OTA), export (publish to OTA), manual, scheduled';
COMMENT ON COLUMN ota_sync_logs.direction IS 'Data flow direction: inbound (import), outbound (export)';
COMMENT ON COLUMN ota_sync_logs.items_processed IS 'Total number of items (events/bookings) processed';
COMMENT ON COLUMN ota_sync_logs.items_created IS 'Number of new reservations created';
COMMENT ON COLUMN ota_sync_logs.items_updated IS 'Number of existing reservations updated';
COMMENT ON COLUMN ota_sync_logs.items_failed IS 'Number of items that failed to process';
