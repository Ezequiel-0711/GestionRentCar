/*
  # Sistema de Roles de Usuario

  1. Nueva tabla para roles de usuario
    - `user_roles` tabla para asignar roles a usuarios
    - Roles: 'admin', 'empleado', 'solo_lectura'
  
  2. Seguridad
    - RLS habilitado en user_roles
    - Políticas para controlar acceso según roles
*/

-- Crear tabla de roles de usuario
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('admin', 'empleado', 'solo_lectura')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Habilitar RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios puedan ver su propio rol
CREATE POLICY "Users can view own role"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Política para que solo admins puedan gestionar roles
CREATE POLICY "Only admins can manage roles"
  ON user_roles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Función para obtener el rol del usuario actual
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT COALESCE(role, 'solo_lectura') 
  FROM user_roles 
  WHERE user_id = auth.uid();
$$;

-- Función para verificar si el usuario es admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  );
$$;

-- Función para verificar si el usuario puede editar
CREATE OR REPLACE FUNCTION can_edit()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'empleado')
  );
$$;

-- Actualizar políticas existentes para incluir verificación de roles

-- Marcas - Solo admins y empleados pueden modificar
DROP POLICY IF EXISTS "Usuarios pueden actualizar marcas" ON marcas;
DROP POLICY IF EXISTS "Usuarios pueden crear marcas" ON marcas;

CREATE POLICY "Solo admins y empleados pueden crear marcas"
  ON marcas
  FOR INSERT
  TO authenticated
  WITH CHECK (can_edit());

CREATE POLICY "Solo admins y empleados pueden actualizar marcas"
  ON marcas
  FOR UPDATE
  TO authenticated
  USING (can_edit())
  WITH CHECK (can_edit());

-- Modelos
DROP POLICY IF EXISTS "Usuarios pueden actualizar modelos" ON modelos;
DROP POLICY IF EXISTS "Usuarios pueden crear modelos" ON modelos;

CREATE POLICY "Solo admins y empleados pueden crear modelos"
  ON modelos
  FOR INSERT
  TO authenticated
  WITH CHECK (can_edit());

CREATE POLICY "Solo admins y empleados pueden actualizar modelos"
  ON modelos
  FOR UPDATE
  TO authenticated
  USING (can_edit())
  WITH CHECK (can_edit());

-- Tipos de vehículos
DROP POLICY IF EXISTS "Usuarios pueden actualizar tipos de vehículos" ON tipos_vehiculos;
DROP POLICY IF EXISTS "Usuarios pueden crear tipos de vehículos" ON tipos_vehiculos;

CREATE POLICY "Solo admins y empleados pueden crear tipos de vehículos"
  ON tipos_vehiculos
  FOR INSERT
  TO authenticated
  WITH CHECK (can_edit());

CREATE POLICY "Solo admins y empleados pueden actualizar tipos de vehículos"
  ON tipos_vehiculos
  FOR UPDATE
  TO authenticated
  USING (can_edit())
  WITH CHECK (can_edit());

-- Tipos de combustible
DROP POLICY IF EXISTS "Usuarios pueden actualizar tipos combustible" ON tipos_combustible;
DROP POLICY IF EXISTS "Usuarios pueden crear tipos combustible" ON tipos_combustible;

CREATE POLICY "Solo admins y empleados pueden crear tipos combustible"
  ON tipos_combustible
  FOR INSERT
  TO authenticated
  WITH CHECK (can_edit());

CREATE POLICY "Solo admins y empleados pueden actualizar tipos combustible"
  ON tipos_combustible
  FOR UPDATE
  TO authenticated
  USING (can_edit())
  WITH CHECK (can_edit());

-- Vehículos
DROP POLICY IF EXISTS "Usuarios pueden actualizar vehículos" ON vehiculos;
DROP POLICY IF EXISTS "Usuarios pueden crear vehículos" ON vehiculos;

CREATE POLICY "Solo admins y empleados pueden crear vehículos"
  ON vehiculos
  FOR INSERT
  TO authenticated
  WITH CHECK (can_edit());

CREATE POLICY "Solo admins y empleados pueden actualizar vehículos"
  ON vehiculos
  FOR UPDATE
  TO authenticated
  USING (can_edit())
  WITH CHECK (can_edit());

-- Clientes
DROP POLICY IF EXISTS "Usuarios pueden actualizar clientes" ON clientes;
DROP POLICY IF EXISTS "Usuarios pueden crear clientes" ON clientes;

CREATE POLICY "Solo admins y empleados pueden crear clientes"
  ON clientes
  FOR INSERT
  TO authenticated
  WITH CHECK (can_edit());

CREATE POLICY "Solo admins y empleados pueden actualizar clientes"
  ON clientes
  FOR UPDATE
  TO authenticated
  USING (can_edit())
  WITH CHECK (can_edit());

-- Empleados - Solo admins pueden gestionar
DROP POLICY IF EXISTS "Usuarios pueden actualizar empleados" ON empleados;
DROP POLICY IF EXISTS "Usuarios pueden crear empleados" ON empleados;

CREATE POLICY "Solo admins pueden crear empleados"
  ON empleados
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Solo admins pueden actualizar empleados"
  ON empleados
  FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Inspecciones
DROP POLICY IF EXISTS "Usuarios pueden actualizar inspecciones" ON inspecciones;
DROP POLICY IF EXISTS "Usuarios pueden crear inspecciones" ON inspecciones;

CREATE POLICY "Solo admins y empleados pueden crear inspecciones"
  ON inspecciones
  FOR INSERT
  TO authenticated
  WITH CHECK (can_edit());

CREATE POLICY "Solo admins y empleados pueden actualizar inspecciones"
  ON inspecciones
  FOR UPDATE
  TO authenticated
  USING (can_edit())
  WITH CHECK (can_edit());

-- Rentas
DROP POLICY IF EXISTS "Usuarios pueden actualizar rentas" ON rentas;
DROP POLICY IF EXISTS "Usuarios pueden crear rentas" ON rentas;

CREATE POLICY "Solo admins y empleados pueden crear rentas"
  ON rentas
  FOR INSERT
  TO authenticated
  WITH CHECK (can_edit());

CREATE POLICY "Solo admins y empleados pueden actualizar rentas"
  ON rentas
  FOR UPDATE
  TO authenticated
  USING (can_edit())
  WITH CHECK (can_edit());

-- Insertar usuario admin por defecto (reemplaza con tu email)
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'admin@rentcar.com'
ON CONFLICT (user_id) DO NOTHING;