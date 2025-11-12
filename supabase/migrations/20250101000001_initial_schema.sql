-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Organizations table (multi-tenant)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  plan VARCHAR(50) DEFAULT 'free',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'owner',
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Properties table
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  postal_code VARCHAR(20),
  country VARCHAR(2) DEFAULT 'FR',
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lots/Units table
CREATE TABLE lots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  bedrooms INT DEFAULT 0,
  bathrooms INT DEFAULT 0,
  max_guests INT DEFAULT 2,
  base_price DECIMAL(10, 2),
  cleaning_fee DECIMAL(10, 2) DEFAULT 0,
  tourist_tax DECIMAL(10, 2) DEFAULT 0,
  pets_allowed BOOLEAN DEFAULT false,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reservations table
CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lot_id UUID REFERENCES lots(id) ON DELETE CASCADE NOT NULL,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  guest_name VARCHAR(255) NOT NULL,
  guest_email VARCHAR(255) NOT NULL,
  guest_phone VARCHAR(50),
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  guests_count INT NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  channel VARCHAR(50) DEFAULT 'direct',
  external_id VARCHAR(255),
  payment_status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages/Chat threads
CREATE TABLE threads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
  channel VARCHAR(50) DEFAULT 'direct',
  status VARCHAR(50) DEFAULT 'open',
  opened_by VARCHAR(50),
  language VARCHAR(5) DEFAULT 'fr',
  last_message_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id UUID REFERENCES threads(id) ON DELETE CASCADE NOT NULL,
  author_type VARCHAR(20) NOT NULL, -- 'in', 'out', 'agent', 'ia'
  author_id UUID,
  body TEXT NOT NULL,
  meta JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI traces for monitoring
CREATE TABLE ai_traces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id UUID REFERENCES threads(id) ON DELETE CASCADE,
  model VARCHAR(100),
  prompt_tokens INT,
  completion_tokens INT,
  latency_ms INT,
  confidence DECIMAL(3, 2),
  safety_flags JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Handoffs (HITL escalations)
CREATE TABLE handoffs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id UUID REFERENCES threads(id) ON DELETE CASCADE NOT NULL,
  reason VARCHAR(255),
  snapshot JSONB,
  assigned_to UUID REFERENCES users(id),
  resolved_at TIMESTAMPTZ,
  outcome VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_traces ENABLE ROW LEVEL SECURITY;
ALTER TABLE handoffs ENABLE ROW LEVEL SECURITY;

-- RLS Policies (basic - to be refined)
CREATE POLICY "Users can view their org" ON organizations
  FOR SELECT USING (id IN (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can view their profile" ON users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can view their org properties" ON properties
  FOR SELECT USING (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can manage their org lots" ON lots
  FOR ALL USING (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can view their org reservations" ON reservations
  FOR SELECT USING (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

-- Indexes for performance
CREATE INDEX idx_lots_property ON lots(property_id);
CREATE INDEX idx_lots_org ON lots(org_id);
CREATE INDEX idx_reservations_lot ON reservations(lot_id);
CREATE INDEX idx_reservations_org ON reservations(org_id);
CREATE INDEX idx_reservations_dates ON reservations(check_in, check_out);
CREATE INDEX idx_messages_thread ON messages(thread_id);
CREATE INDEX idx_threads_org ON threads(org_id);
