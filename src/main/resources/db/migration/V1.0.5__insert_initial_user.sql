-- Insert an initial test user: mickey / mickey@mickey.com
-- Password is hashed with BCrypt (cost 10).
-- To generate a new hash: BcryptUtil.bcryptHash("password")
INSERT INTO users (id, name, email, password_hash, theme_color, superuser, created_at, updated_at)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  'mickey',
  'mickey@mickey.com',
  '$2a$10$FT2HlEtEenTiyl3sQpbGQOh2oL8uONt7WEySy93OTBjdkFfI2NoEO',  -- hash of 'mickey'
  'blue',
  false,
  NOW(),
  NOW()
);
