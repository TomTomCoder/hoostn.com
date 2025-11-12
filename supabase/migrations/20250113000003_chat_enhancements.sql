-- Chat System Enhancements
-- Indexes, RLS policies, triggers, and full-text search

-- =======================
-- INDEXES FOR PERFORMANCE
-- =======================

-- Threads indexes
CREATE INDEX IF NOT EXISTS idx_threads_status ON threads(status);
CREATE INDEX IF NOT EXISTS idx_threads_reservation ON threads(reservation_id);
CREATE INDEX IF NOT EXISTS idx_threads_last_message ON threads(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_threads_org_status ON threads(org_id, status);

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_messages_thread_created ON messages(thread_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_author_type ON messages(author_type);

-- AI traces indexes
CREATE INDEX IF NOT EXISTS idx_ai_traces_thread ON ai_traces(thread_id);
CREATE INDEX IF NOT EXISTS idx_ai_traces_created ON ai_traces(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_traces_confidence ON ai_traces(confidence);

-- Handoffs indexes
CREATE INDEX IF NOT EXISTS idx_handoffs_thread ON handoffs(thread_id);
CREATE INDEX IF NOT EXISTS idx_handoffs_assigned ON handoffs(assigned_to);
CREATE INDEX IF NOT EXISTS idx_handoffs_resolved ON handoffs(resolved_at);
CREATE INDEX IF NOT EXISTS idx_handoffs_status ON handoffs(resolved_at) WHERE resolved_at IS NULL;

-- Full-text search on message bodies
CREATE INDEX IF NOT EXISTS idx_messages_body_search ON messages USING gin(to_tsvector('english', body));

-- =======================
-- UPDATED_AT TRIGGER
-- =======================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_thread_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at column to threads if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'threads' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE threads ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_threads_updated_at ON threads;
CREATE TRIGGER trigger_threads_updated_at
  BEFORE UPDATE ON threads
  FOR EACH ROW
  EXECUTE FUNCTION update_thread_updated_at();

-- =======================
-- AUTO-GREETING TRIGGER
-- =======================

-- Function to send auto-greeting when thread is created
CREATE OR REPLACE FUNCTION send_auto_greeting()
RETURNS TRIGGER AS $$
BEGIN
  -- Only send greeting for guest-initiated threads
  IF NEW.opened_by = 'guest' THEN
    INSERT INTO messages (thread_id, author_type, body, meta)
    VALUES (
      NEW.id,
      'ai',
      'Hello! I''m here to help answer your questions about the property. How can I assist you today?',
      '{"auto_greeting": true, "confidence": 1.0}'::jsonb
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_auto_greeting ON threads;
CREATE TRIGGER trigger_auto_greeting
  AFTER INSERT ON threads
  FOR EACH ROW
  EXECUTE FUNCTION send_auto_greeting();

-- =======================
-- UPDATE LAST_MESSAGE_AT
-- =======================

-- Function to update thread's last_message_at when message is added
CREATE OR REPLACE FUNCTION update_thread_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE threads
  SET last_message_at = NEW.created_at
  WHERE id = NEW.thread_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_last_message ON messages;
CREATE TRIGGER trigger_update_last_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_thread_last_message();

-- =======================
-- RLS POLICIES FOR CHAT
-- =======================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their org threads" ON threads;
DROP POLICY IF EXISTS "Users can create threads" ON threads;
DROP POLICY IF EXISTS "Users can update their org threads" ON threads;

DROP POLICY IF EXISTS "Users can view their org messages" ON messages;
DROP POLICY IF EXISTS "Users can create messages" ON messages;

DROP POLICY IF EXISTS "Users can view their org ai_traces" ON ai_traces;
DROP POLICY IF EXISTS "System can create ai_traces" ON ai_traces;

DROP POLICY IF EXISTS "Users can view their org handoffs" ON handoffs;
DROP POLICY IF EXISTS "Users can create handoffs" ON handoffs;
DROP POLICY IF EXISTS "Users can update handoffs" ON handoffs;

-- Threads policies
CREATE POLICY "Users can view their org threads" ON threads
  FOR SELECT
  USING (
    org_id IN (SELECT org_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Users can create threads" ON threads
  FOR INSERT
  WITH CHECK (
    org_id IN (SELECT org_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Users can update their org threads" ON threads
  FOR UPDATE
  USING (
    org_id IN (SELECT org_id FROM users WHERE id = auth.uid())
  );

-- Messages policies
CREATE POLICY "Users can view their org messages" ON messages
  FOR SELECT
  USING (
    thread_id IN (
      SELECT id FROM threads WHERE org_id IN (
        SELECT org_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create messages" ON messages
  FOR INSERT
  WITH CHECK (
    thread_id IN (
      SELECT id FROM threads WHERE org_id IN (
        SELECT org_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- AI traces policies (read-only for users, system creates)
CREATE POLICY "Users can view their org ai_traces" ON ai_traces
  FOR SELECT
  USING (
    thread_id IN (
      SELECT id FROM threads WHERE org_id IN (
        SELECT org_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- Allow service role to create AI traces (bypass RLS)
CREATE POLICY "Service role can manage ai_traces" ON ai_traces
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Handoffs policies
CREATE POLICY "Users can view their org handoffs" ON handoffs
  FOR SELECT
  USING (
    thread_id IN (
      SELECT id FROM threads WHERE org_id IN (
        SELECT org_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create handoffs" ON handoffs
  FOR INSERT
  WITH CHECK (
    thread_id IN (
      SELECT id FROM threads WHERE org_id IN (
        SELECT org_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update handoffs" ON handoffs
  FOR UPDATE
  USING (
    thread_id IN (
      SELECT id FROM threads WHERE org_id IN (
        SELECT org_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- =======================
-- HELPER VIEWS
-- =======================

-- View for thread statistics
CREATE OR REPLACE VIEW thread_stats AS
SELECT
  t.org_id,
  COUNT(*) FILTER (WHERE t.status = 'open') as open_threads,
  COUNT(*) FILTER (WHERE t.status = 'escalated') as escalated_threads,
  COUNT(*) FILTER (WHERE t.status = 'closed') as closed_threads,
  AVG(EXTRACT(EPOCH FROM (t.closed_at - t.opened_at))/3600) FILTER (WHERE t.closed_at IS NOT NULL) as avg_resolution_hours,
  COUNT(DISTINCT t.id) as total_threads
FROM threads t
GROUP BY t.org_id;

-- View for AI performance metrics
CREATE OR REPLACE VIEW ai_performance AS
SELECT
  t.org_id,
  COUNT(*) as total_ai_responses,
  AVG(ai.confidence) as avg_confidence,
  AVG(ai.latency_ms) as avg_latency_ms,
  SUM(ai.prompt_tokens + ai.completion_tokens) as total_tokens,
  COUNT(*) FILTER (WHERE ai.confidence < 0.7) as low_confidence_count
FROM ai_traces ai
JOIN threads t ON ai.thread_id = t.id
GROUP BY t.org_id;

-- Grant access to views
GRANT SELECT ON thread_stats TO authenticated;
GRANT SELECT ON ai_performance TO authenticated;

-- =======================
-- RATE LIMITING
-- =======================

-- Add rate limiting columns to threads if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'threads' AND column_name = 'message_count'
  ) THEN
    ALTER TABLE threads ADD COLUMN message_count INT DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'threads' AND column_name = 'last_rate_limit_reset'
  ) THEN
    ALTER TABLE threads ADD COLUMN last_rate_limit_reset TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Function to check rate limit (10 messages per minute per thread)
CREATE OR REPLACE FUNCTION check_rate_limit(p_thread_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_count INT;
  v_last_reset TIMESTAMPTZ;
BEGIN
  SELECT message_count, last_rate_limit_reset
  INTO v_count, v_last_reset
  FROM threads
  WHERE id = p_thread_id;

  -- Reset counter if more than 1 minute has passed
  IF v_last_reset < NOW() - INTERVAL '1 minute' THEN
    UPDATE threads
    SET message_count = 0, last_rate_limit_reset = NOW()
    WHERE id = p_thread_id;
    RETURN TRUE;
  END IF;

  -- Check if under limit
  IF v_count >= 10 THEN
    RETURN FALSE;
  END IF;

  -- Increment counter
  UPDATE threads
  SET message_count = message_count + 1
  WHERE id = p_thread_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_rate_limit IS 'Rate limit: 10 messages per minute per thread';
