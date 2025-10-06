/*
  # Create RPC function to get user by email

  1. New Functions
    - `get_user_by_email_rpc(email_param text)` 
      - Safely gets user ID from auth.users by email
      - Returns user_id as text or null if not found
      - Only accessible by authenticated users with proper permissions

  2. Security
    - Function uses SECURITY DEFINER to access auth schema
    - Only superadmins can call this function
    - Returns minimal data (just user_id)
*/

-- Create function to get user by email (secure way to access auth.users from frontend)
CREATE OR REPLACE FUNCTION get_user_by_email_rpc(email_param text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  user_uuid uuid;
BEGIN
  -- Only allow superadmins to call this function
  IF NOT is_superadmin() THEN
    RAISE EXCEPTION 'Access denied. Only superadmins can call this function.';
  END IF;

  -- Get user ID from auth.users by email
  SELECT id INTO user_uuid
  FROM auth.users
  WHERE email = email_param
  LIMIT 1;

  -- Return user ID as text, or null if not found
  RETURN user_uuid::text;
END;
$$;