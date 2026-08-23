CREATE TYPE public.kitten_adoption_status AS ENUM (
  'not_available',
  'available',
  'reserved',
  'adopted'
);

ALTER TABLE public.kittens
  ADD COLUMN adoption_status public.kitten_adoption_status NOT NULL DEFAULT 'not_available',
  ADD COLUMN adopter_name TEXT,
  ADD COLUMN adopter_email TEXT,
  ADD COLUMN adopter_phone TEXT,
  ADD COLUMN adoption_date DATE,
  ADD COLUMN adoption_notes TEXT,
  ADD CONSTRAINT kittens_adopter_name_length
    CHECK (adopter_name IS NULL OR char_length(adopter_name) <= 120),
  ADD CONSTRAINT kittens_adopter_email_length
    CHECK (adopter_email IS NULL OR char_length(adopter_email) <= 254),
  ADD CONSTRAINT kittens_adopter_phone_length
    CHECK (adopter_phone IS NULL OR char_length(adopter_phone) <= 50),
  ADD CONSTRAINT kittens_adoption_notes_length
    CHECK (adoption_notes IS NULL OR char_length(adoption_notes) <= 1000);

COMMENT ON COLUMN public.kittens.adoption_status IS
  'Private placement status visible only to authorised batch members.';
COMMENT ON COLUMN public.kittens.adopter_name IS
  'Private adopter information; deliberately excluded from community_batches().';
