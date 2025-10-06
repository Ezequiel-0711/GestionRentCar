/*
  # Crear Sistema SaaS Multi-Tenant

  1. Nuevas Tablas
    - `subscription_plans` - Planes de suscripción disponibles
    - `tenants` - Empresas clientes del sistema
    - `tenant_subscriptions` - Suscripciones activas de cada empresa
    - `tenant_users` - Usuarios asignados a cada empresa
    - `tenant_limits` - Límites de uso por empresa

  2. Modificaciones a Tablas Existentes
    - Agregar `tenant_id` a todas las tablas existentes
    - Actualizar políticas RLS para multi-tenancy

  3. Funciones de Seguridad
    - Funciones para verificar roles y permisos
    - Políticas RLS actualizadas

  4. Datos Iniciales
    - Planes de suscripción predefinidos
    - Configuración inicial
*/

-- Crear tabla de planes de suscripción
CREATE TABLE IF NOT EXISTS subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price_usd numeric(10,2) NOT NULL,
  price_dop numeric(10,2) NOT NULL,
  vehicle_limit integer,
  client_limit integer,
  employee_limit integer,
  features text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Crear tabla de empresas (tenants)
CREATE TABLE IF NOT EXISTS tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  email text NOT NULL,
  phone text,
  address text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Crear tabla de suscripciones de empresas
CREATE TABLE IF NOT EXISTS tenant_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  plan_id uuid REFERENCES subscription_plans(id),
  status text CHECK (status IN ('active', 'inactive', 'cancelled', 'expired')) DEFAULT 'active',
  starts_at timestamptz DEFAULT now(),
  ends_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Crear tabla de usuarios por empresa
CREATE TABLE IF NOT EXISTS tenant_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text CHECK (role IN ('admin', 'empleado', 'solo_lectura')) DEFAULT 'empleado',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, user_id)
);

-- Crear tabla de límites por empresa
CREATE TABLE IF NOT EXISTS tenant_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE UNIQUE,
  max_vehicles integer DEFAULT 30,
  max_clients integer DEFAULT 30,
  max_employees integer DEFAULT 10,
  current_vehicles integer DEFAULT 0,
  current_clients integer DEFAULT 0,
  current_employees integer DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

-- Agregar tenant_id a tablas existentes si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'marcas' AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE marcas ADD COLUMN tenant_id uuid REFERENCES tenants(id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'modelos' AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE modelos ADD COLUMN tenant_id uuid REFERENCES tenants(id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tipos_vehiculos' AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE tipos_vehiculos ADD COLUMN tenant_id uuid REFERENCES tenants(id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tipos_combustible' AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE tipos_combustible ADD COLUMN tenant_id uuid REFERENCES tenants(id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vehiculos' AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE vehiculos ADD COLUMN tenant_id uuid REFERENCES tenants(id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clientes' AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE clientes ADD COLUMN tenant_id uuid REFERENCES tenants(id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'empleados' AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE empleados ADD COLUMN tenant_id uuid REFERENCES tenants(id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'inspecciones' AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE inspecciones ADD COLUMN tenant_id uuid REFERENCES tenants(id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rentas' AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE rentas ADD COLUMN tenant_id uuid REFERENCES tenants(id);
  END IF;
END $$;

-- Funciones de seguridad
CREATE OR REPLACE FUNCTION get_user_tenant_id()
RETURNS uuid AS $$
BEGIN
  RETURN (
    SELECT tenant_id 
    FROM tenant_users 
    WHERE user_id = auth.uid() AND is_active = true
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_superadmin()
RETURNS boolean AS $$
BEGIN
  RETURN (
    SELECT email IN ('admin@rentcar.com', 'superadmin@rentcar.com')
    FROM auth.users 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (
    is_superadmin() OR 
    EXISTS (
      SELECT 1 FROM tenant_users 
      WHERE user_id = auth.uid() 
      AND role = 'admin' 
      AND is_active = true
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION can_edit()
RETURNS boolean AS $$
BEGIN
  RETURN (
    is_superadmin() OR 
    EXISTS (
      SELECT 1 FROM tenant_users 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'empleado') 
      AND is_active = true
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Habilitar RLS en nuevas tablas
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_limits ENABLE ROW LEVEL SECURITY;

-- Políticas para subscription_plans
CREATE POLICY "Superadmin can manage subscription plans"
  ON subscription_plans
  FOR ALL
  TO authenticated
  USING (is_superadmin())
  WITH CHECK (is_superadmin());

CREATE POLICY "Users can view active subscription plans"
  ON subscription_plans
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Políticas para tenants
CREATE POLICY "Superadmin can manage tenants"
  ON tenants
  FOR ALL
  TO authenticated
  USING (is_superadmin())
  WITH CHECK (is_superadmin());

CREATE POLICY "Users can view their own tenant"
  ON tenants
  FOR SELECT
  TO authenticated
  USING (id = get_user_tenant_id());

-- Políticas para tenant_subscriptions
CREATE POLICY "Superadmin can manage all subscriptions"
  ON tenant_subscriptions
  FOR ALL
  TO authenticated
  USING (is_superadmin())
  WITH CHECK (is_superadmin());

CREATE POLICY "Users can view their tenant subscription"
  ON tenant_subscriptions
  FOR SELECT
  TO authenticated
  USING (tenant_id = get_user_tenant_id());

-- Políticas para tenant_users
CREATE POLICY "Superadmin can manage all tenant users"
  ON tenant_users
  FOR ALL
  TO authenticated
  USING (is_superadmin())
  WITH CHECK (is_superadmin());

CREATE POLICY "Admins can manage users in their tenant"
  ON tenant_users
  FOR ALL
  TO authenticated
  USING (tenant_id = get_user_tenant_id() AND is_admin())
  WITH CHECK (tenant_id = get_user_tenant_id() AND is_admin());

CREATE POLICY "Users can view their own record"
  ON tenant_users
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Políticas para tenant_limits
CREATE POLICY "Superadmin can manage all limits"
  ON tenant_limits
  FOR ALL
  TO authenticated
  USING (is_superadmin())
  WITH CHECK (is_superadmin());

CREATE POLICY "Users can view their tenant limits"
  ON tenant_limits
  FOR SELECT
  TO authenticated
  USING (tenant_id = get_user_tenant_id());

-- Actualizar políticas existentes para incluir tenant_id
DROP POLICY IF EXISTS "Usuarios pueden ver marcas" ON marcas;
CREATE POLICY "Users can view their tenant brands"
  ON marcas
  FOR SELECT
  TO authenticated
  USING (tenant_id = get_user_tenant_id() OR is_superadmin());

DROP POLICY IF EXISTS "Solo admins y empleados pueden crear marcas" ON marcas;
CREATE POLICY "Admins and employees can create brands"
  ON marcas
  FOR INSERT
  TO authenticated
  WITH CHECK ((tenant_id = get_user_tenant_id() AND can_edit()) OR is_superadmin());

DROP POLICY IF EXISTS "Solo admins y empleados pueden actualizar marcas" ON marcas;
CREATE POLICY "Admins and employees can update brands"
  ON marcas
  FOR UPDATE
  TO authenticated
  USING ((tenant_id = get_user_tenant_id() AND can_edit()) OR is_superadmin())
  WITH CHECK ((tenant_id = get_user_tenant_id() AND can_edit()) OR is_superadmin());

-- Insertar planes de suscripción predefinidos
INSERT INTO subscription_plans (name, description, price_usd, price_dop, vehicle_limit, client_limit, employee_limit, features)
VALUES 
  (
    'Plan Básico',
    'Perfecto para empresas pequeñas que están comenzando',
    25.00,
    1500.00,
    30,
    30,
    10,
    ARRAY['Gestión básica de vehículos', 'Gestión de clientes', 'Reportes básicos', 'Soporte por email']
  ),
  (
    'Plan Intermedio',
    'Ideal para empresas en crecimiento con necesidades moderadas',
    50.00,
    3000.00,
    100,
    100,
    25,
    ARRAY['Gestión avanzada de vehículos', 'Gestión completa de clientes', 'Reportes avanzados', 'Inspecciones detalladas', 'Soporte prioritario']
  ),
  (
    'Plan Avanzado',
    'Para empresas grandes sin límites de crecimiento',
    83.00,
    5000.00,
    NULL,
    NULL,
    NULL,
    ARRAY['Vehículos ilimitados', 'Clientes ilimitados', 'Empleados ilimitados', 'Reportes premium', 'API access', 'Soporte 24/7', 'Personalización avanzada']
  )
ON CONFLICT DO NOTHING;

-- Crear empresa de demostración
INSERT INTO tenants (name, slug, email, phone, address)
VALUES (
  'RentCar Demo',
  'demo',
  'demo@rentcar.com',
  '809-555-0123',
  'Av. 27 de Febrero, Santo Domingo, República Dominicana'
)
ON CONFLICT (slug) DO NOTHING;

-- Crear límites para la empresa demo
INSERT INTO tenant_limits (tenant_id, max_vehicles, max_clients, max_employees)
SELECT id, 30, 30, 10
FROM tenants 
WHERE slug = 'demo'
ON CONFLICT (tenant_id) DO NOTHING;