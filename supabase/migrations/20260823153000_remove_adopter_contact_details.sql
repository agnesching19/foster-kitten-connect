-- Avoid retaining contact details that are not needed for foster tracking.
ALTER TABLE public.kittens
  DROP COLUMN adopter_email,
  DROP COLUMN adopter_phone;
