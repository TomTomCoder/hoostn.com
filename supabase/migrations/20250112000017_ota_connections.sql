-- OTA Connections Table
-- Stores connection configurations for OTA platforms (Airbnb, Booking.com, etc.)

CREATE TABLE ota_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  lot_id UUID REFERENCES lots(id) ON DELETE CASCADE NOT NULL,
  platform VARCHAR(50) NOT NULL, -- 'airbnb_ical', 'booking_api', 'vrbo_ical', etc.
  status VARCHAR(50) DEFAULT 'active' NOT NULL, -- 'active', 'paused', 'error', 'deleted'
  config JSONB DEFAULT '{}'::jsonb NOT NULL, -- Platform-specific configuration
  last_sync_at TIMESTAMPTZ,
  next_sync_at TIMESTAMPTZ,
  sync_frequency_minutes INT DEFAULT 30 NOT NULL, -- Default 30 minutes
  last_error TEXT,
  error_count INT DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint: one connection per lot per platform
  CONSTRAINT unique_lot_platform UNIQUE (lot_id, platform)
);

-- Indexes for performance
CREATE INDEX idx_ota_connections_org_id ON ota_connections(org_id);
CREATE INDEX idx_ota_connections_lot_id ON ota_connections(lot_id);
CREATE INDEX idx_ota_connections_platform ON ota_connections(platform);
CREATE INDEX idx_ota_connections_status ON ota_connections(status);
CREATE INDEX idx_ota_connections_next_sync ON ota_connections(next_sync_at) WHERE status = 'active';

-- RLS Policies
ALTER TABLE ota_connections ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access connections in their organization
CREATE POLICY ota_connections_org_isolation ON ota_connections
  FOR ALL
  USING (
    org_id IN (
      SELECT org_id FROM users WHERE id = auth.uid()
    )
  );

-- Trigger to update updated_at timestamp
CREATE TRIGGER ota_connections_updated_at
  BEFORE UPDATE ON ota_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE ota_connections IS 'OTA platform connections for importing/exporting reservations';
COMMENT ON COLUMN ota_connections.config IS 'Platform-specific configuration: {import_url: string, export_enabled: boolean, etc}';
COMMENT ON COLUMN ota_connections.sync_frequency_minutes IS 'How often to sync (in minutes). Common values: 30, 60, 120';
COMMENT ON COLUMN ota_connections.error_count IS 'Consecutive error count. Auto-pause after 5 errors';
