-- Stripe Connect Integration Schema
-- Tables for managing Stripe Connect accounts, payments, refunds, and webhooks

-- Stripe Connected Accounts
CREATE TABLE stripe_connected_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  stripe_account_id VARCHAR(255) UNIQUE NOT NULL,
  account_type VARCHAR(50) DEFAULT 'express', -- express, standard, custom
  charges_enabled BOOLEAN DEFAULT false,
  payouts_enabled BOOLEAN DEFAULT false,
  requirements_due_by TIMESTAMPTZ,
  requirements_past_due TEXT[], -- Array of requirement fields
  requirements_pending TEXT[], -- Array of pending verification fields
  capabilities JSONB DEFAULT '{}', -- Stripe capabilities object
  details_submitted BOOLEAN DEFAULT false,
  email VARCHAR(255),
  country VARCHAR(2) DEFAULT 'FR',
  default_currency VARCHAR(3) DEFAULT 'EUR',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment Intents
CREATE TABLE payment_intents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  reservation_id UUID REFERENCES reservations(id) ON DELETE CASCADE,
  stripe_payment_intent_id VARCHAR(255) UNIQUE NOT NULL,
  stripe_account_id VARCHAR(255) REFERENCES stripe_connected_accounts(stripe_account_id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL, -- Total amount in EUR
  platform_fee_amount DECIMAL(10, 2) DEFAULT 0, -- Platform commission
  application_fee_amount DECIMAL(10, 2) DEFAULT 0, -- Stripe application fee
  currency VARCHAR(3) DEFAULT 'EUR',
  status VARCHAR(50) DEFAULT 'pending', -- pending, processing, succeeded, canceled, failed
  payment_method VARCHAR(50), -- card, sepa_debit, etc.
  capture_method VARCHAR(20) DEFAULT 'automatic', -- automatic, manual
  captured_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  cancellation_reason VARCHAR(255),
  client_secret TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Refunds
CREATE TABLE refunds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  payment_intent_id UUID REFERENCES payment_intents(id) ON DELETE CASCADE NOT NULL,
  stripe_refund_id VARCHAR(255) UNIQUE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'EUR',
  status VARCHAR(50) DEFAULT 'pending', -- pending, succeeded, failed, canceled
  reason VARCHAR(100), -- duplicate, fraudulent, requested_by_customer, etc.
  failure_reason VARCHAR(255),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transfers (payouts to connected accounts)
CREATE TABLE transfers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  payment_intent_id UUID REFERENCES payment_intents(id) ON DELETE CASCADE,
  stripe_transfer_id VARCHAR(255) UNIQUE NOT NULL,
  stripe_account_id VARCHAR(255) REFERENCES stripe_connected_accounts(stripe_account_id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'EUR',
  status VARCHAR(50) DEFAULT 'pending', -- pending, paid, failed, canceled, reversed
  destination_payment VARCHAR(255), -- Stripe payout ID
  reversed BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoices (for platform fees and detailed billing)
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  reservation_id UUID REFERENCES reservations(id) ON DELETE CASCADE,
  invoice_number VARCHAR(100) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'draft', -- draft, open, paid, void, uncollectible
  subtotal DECIMAL(10, 2) NOT NULL,
  tax_amount DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,
  platform_fee DECIMAL(10, 2) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'EUR',
  due_date DATE,
  paid_at TIMESTAMPTZ,
  line_items JSONB DEFAULT '[]', -- Array of line item objects
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Security Deposits (held amounts)
CREATE TABLE security_deposits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  reservation_id UUID REFERENCES reservations(id) ON DELETE CASCADE NOT NULL,
  stripe_payment_intent_id VARCHAR(255) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'EUR',
  status VARCHAR(50) DEFAULT 'held', -- held, released, claimed
  held_at TIMESTAMPTZ DEFAULT NOW(),
  released_at TIMESTAMPTZ,
  claimed_at TIMESTAMPTZ,
  claim_amount DECIMAL(10, 2),
  claim_reason TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stripe Webhook Events (for audit and debugging)
CREATE TABLE stripe_webhook_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stripe_event_id VARCHAR(255) UNIQUE NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  object_type VARCHAR(50),
  object_id VARCHAR(255),
  data JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  retry_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_stripe_connected_accounts_org ON stripe_connected_accounts(org_id);
CREATE INDEX idx_stripe_connected_accounts_stripe_id ON stripe_connected_accounts(stripe_account_id);
CREATE INDEX idx_payment_intents_org ON payment_intents(org_id);
CREATE INDEX idx_payment_intents_reservation ON payment_intents(reservation_id);
CREATE INDEX idx_payment_intents_stripe_id ON payment_intents(stripe_payment_intent_id);
CREATE INDEX idx_payment_intents_status ON payment_intents(status);
CREATE INDEX idx_refunds_org ON refunds(org_id);
CREATE INDEX idx_refunds_payment_intent ON refunds(payment_intent_id);
CREATE INDEX idx_refunds_stripe_id ON refunds(stripe_refund_id);
CREATE INDEX idx_transfers_org ON transfers(org_id);
CREATE INDEX idx_transfers_payment_intent ON transfers(payment_intent_id);
CREATE INDEX idx_invoices_org ON invoices(org_id);
CREATE INDEX idx_invoices_reservation ON invoices(reservation_id);
CREATE INDEX idx_security_deposits_org ON security_deposits(org_id);
CREATE INDEX idx_security_deposits_reservation ON security_deposits(reservation_id);
CREATE INDEX idx_webhook_events_stripe_id ON stripe_webhook_events(stripe_event_id);
CREATE INDEX idx_webhook_events_type ON stripe_webhook_events(event_type);
CREATE INDEX idx_webhook_events_processed ON stripe_webhook_events(processed);

-- Enable Row Level Security
ALTER TABLE stripe_connected_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_webhook_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies (organization isolation)
CREATE POLICY "Users can view their org Stripe accounts" ON stripe_connected_accounts
  FOR SELECT USING (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can manage their org Stripe accounts" ON stripe_connected_accounts
  FOR ALL USING (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can view their org payment intents" ON payment_intents
  FOR SELECT USING (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can manage their org payment intents" ON payment_intents
  FOR ALL USING (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can view their org refunds" ON refunds
  FOR SELECT USING (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can manage their org refunds" ON refunds
  FOR ALL USING (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can view their org transfers" ON transfers
  FOR SELECT USING (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can view their org invoices" ON invoices
  FOR SELECT USING (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can manage their org invoices" ON invoices
  FOR ALL USING (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can view their org security deposits" ON security_deposits
  FOR SELECT USING (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can manage their org security deposits" ON security_deposits
  FOR ALL USING (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

-- Webhook events are system-level, no user access
CREATE POLICY "Service role can manage webhook events" ON stripe_webhook_events
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Add updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_stripe_connected_accounts_updated_at
  BEFORE UPDATE ON stripe_connected_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_intents_updated_at
  BEFORE UPDATE ON payment_intents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_refunds_updated_at
  BEFORE UPDATE ON refunds
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transfers_updated_at
  BEFORE UPDATE ON transfers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_security_deposits_updated_at
  BEFORE UPDATE ON security_deposits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
