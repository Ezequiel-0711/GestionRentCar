-- Función para obtener todos los usuarios registrados
-- Esta función permite al superadmin ver todos los usuarios para asignarles roles

CREATE OR REPLACE FUNCTION get_all_users()
RETURNS TABLE (
  id uuid,
  email text,
  created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    id,
    email,
    created_at
  FROM auth.users
  WHERE email IS NOT NULL
  ORDER BY created_at DESC;
$$;