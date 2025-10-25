/*
  # Create admin tokens table

  1. New Tables
    - `admin_tokens`
      - `id` (uuid, primary key)
      - `email` (text, admin email)
      - `token` (text, unique token for login)
      - `expires_at` (timestamptz, token expiration)
      - `used` (boolean, whether token has been used)
      - `created_at` (timestamptz, when token was created)

  2. Security
    - Enable RLS on `admin_tokens` table
    - Only service role can access this table (no public policies)
    - Tokens expire after 1 hour
    - Tokens can only be used once
*/

CREATE TABLE IF NOT EXISTS admin_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  token text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  used boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_tokens ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_admin_tokens_token ON admin_tokens(token);
CREATE INDEX IF NOT EXISTS idx_admin_tokens_expires_at ON admin_tokens(expires_at);
