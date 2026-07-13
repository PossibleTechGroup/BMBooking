-- Add visit card price to hospitals (ETB)
ALTER TABLE "hospitals" ADD COLUMN IF NOT EXISTS "card_price" DECIMAL(10,2);

UPDATE "hospitals" SET "card_price" = 50.00 WHERE "card_price" IS NULL;

ALTER TABLE "hospitals" ALTER COLUMN "card_price" SET NOT NULL;
