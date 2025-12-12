-- Create a dedicated schema for extensions
CREATE SCHEMA IF NOT EXISTS extensions;

-- Move the uuid-ossp extension from public to extensions schema
-- First drop from public (if exists) and recreate in extensions
DROP EXTENSION IF EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA extensions;

-- Grant usage on the extensions schema to authenticated and anon roles
GRANT USAGE ON SCHEMA extensions TO authenticated, anon;