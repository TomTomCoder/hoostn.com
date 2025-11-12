-- Add Stripe-related columns to existing tables

-- Update organizations table for Stripe Connect
ALTER TABLE organizations
ADD COLUMN stripe_connected_account_id VARCHAR(255) REFERENCES stripe_connected_accounts(stripe_account_id) ON DELETE SET NULL,
ADD COLUMN platform_fee_percentage DECIMAL(5, 2) DEFAULT 5.00, -- Default 5% platform fee
ADD COLUMN auto_payout_enabled BOOLEAN DEFAULT true,
ADD COLUMN payout_schedule VARCHAR(20) DEFAULT 'daily'; -- daily, weekly, monthly, manual

-- Update reservations table for Stripe payments
ALTER TABLE reservations
ADD COLUMN payment_mode VARCHAR(20) DEFAULT 'full', -- 'full' (immediate) or 'hold-72h' (manual capture)
ADD COLUMN security_deposit_amount DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN platform_fee_amount DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN stripe_payment_intent_id VARCHAR(255),
ADD COLUMN payment_method VARCHAR(50), -- card, sepa_debit, etc.
ADD COLUMN payment_captured_at TIMESTAMPTZ,
ADD COLUMN refunded_amount DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN refunded_at TIMESTAMPTZ;

-- Create indexes for new columns
CREATE INDEX idx_organizations_stripe_account ON organizations(stripe_connected_account_id);
CREATE INDEX idx_reservations_stripe_payment_intent ON reservations(stripe_payment_intent_id);
CREATE INDEX idx_reservations_payment_mode ON reservations(payment_mode);

-- Add foreign key constraint for stripe_payment_intent_id
ALTER TABLE reservations
ADD CONSTRAINT fk_reservations_payment_intent
FOREIGN KEY (stripe_payment_intent_id)
REFERENCES payment_intents(stripe_payment_intent_id)
ON DELETE SET NULL;

-- Add comment for documentation
COMMENT ON COLUMN organizations.platform_fee_percentage IS 'Platform commission percentage (e.g., 5.00 = 5%)';
COMMENT ON COLUMN organizations.payout_schedule IS 'Frequency of automatic payouts to connected account';
COMMENT ON COLUMN reservations.payment_mode IS 'Payment capture mode: full (immediate) or hold-72h (manual capture)';
COMMENT ON COLUMN reservations.security_deposit_amount IS 'Security deposit amount held separately';
COMMENT ON COLUMN reservations.platform_fee_amount IS 'Platform commission amount in EUR';
