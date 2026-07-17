-- Seed: Sample invitation for Rad & Chin
-- Update existing invitation to add giftguide field
UPDATE invitations
SET data = jsonb_set(
  data,
  '{sections,giftguide}',
  'false'::jsonb
)
WHERE slug = 'rad-and-chin';

UPDATE invitations
SET data = jsonb_set(
  data,
  '{sectionOrder}',
  '["event-details", "gallery", "map", "rsvp", "timeline", "countdown", "dresscode", "giftguide", "footer"]'::jsonb
)
WHERE slug = 'rad-and-chin' AND NOT (data->'sectionOrder') ? 'giftguide';

-- Remove old giftAccounts field and add new giftBank/giftWallet structure
UPDATE invitations
SET data = data - 'giftAccounts'
WHERE slug = 'rad-and-chin' AND data ? 'giftAccounts';

UPDATE invitations
SET data = jsonb_set(
  data,
  '{giftBank}',
  '{"name": "Bank", "account1": {"qrCode": "", "maskedName": ""}, "account2": {"qrCode": "", "maskedName": ""}}'::jsonb
)
WHERE slug = 'rad-and-chin' AND NOT (data ? 'giftBank');

UPDATE invitations
SET data = jsonb_set(
  data,
  '{giftWallet}',
  '{"name": "Wallet", "account1": {"qrCode": "", "maskedName": ""}, "account2": {"qrCode": "", "maskedName": ""}}'::jsonb
)
WHERE slug = 'rad-and-chin' AND NOT (data ? 'giftWallet');

