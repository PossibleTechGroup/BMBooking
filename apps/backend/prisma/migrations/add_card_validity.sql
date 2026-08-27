-- Add configurable card/package validity + activation tracking
-- CardTemplate: configurable validity period (7/15/30/60/90/custom days)
ALTER TABLE card_templates ADD COLUMN IF NOT EXISTS validity_days INTEGER;

-- Card: snapshot of validity + activation time (set when payment is confirmed)
ALTER TABLE cards ADD COLUMN IF NOT EXISTS validity_days INTEGER;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS activated_at TIMESTAMP(3);
