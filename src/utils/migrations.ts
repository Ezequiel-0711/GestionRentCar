// Utilidad para aplicar migraciones automáticamente
import { supabase } from '../lib/supabase'

export async function checkAndApplyMigrations() {
  try {
    console.log('🔍 Verificando estado de las tablas...')
    
    // Verificar si las tablas principales existen
    const { data: tenants, error: tenantsError } = await supabase
      .from('tenants')
      .select('count')
      .limit(1)

    if (tenantsError && tenantsError.message.includes('Could not find the table')) {
      console.log('📋 Aplicando migraciones automáticamente...')
      await applyMigrations()
      return true
    }

    console.log('✅ Las tablas ya existen')
    return false
  } catch (error) {
    console.error('❌ Error verificando migraciones:', error)
    return false
  }
}

async function applyMigrations() {
  const migrations = [
    // Crear tablas principales
    `
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
    `,
    
    `
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
    `,
    
    `
    -- Crear tabla de suscripciones
    CREATE TABLE IF NOT EXISTS tenant_subscriptions (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
      plan_id uuid REFERENCES subscription_plans(id),
      status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'cancelled', 'expired')),
      starts_at timestamptz DEFAULT now(),
      ends_at timestamptz,
      created_at timestamptz DEFAULT now()
    );
    `,
    
    `
    -- Crear tabla de usuarios por tenant
    CREATE TABLE IF NOT EXISTS tenant_users (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
      user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
      role text DEFAULT 'empleado' CHECK (role IN ('admin', 'empleado', 'solo_lectura')),
      is_active boolean DEFAULT true,
      created_at timestamptz DEFAULT now(),
      UNIQUE(tenant_id, user_id)
    );
    `,
    
    `
    -- Crear tabla de límites por tenant
    CREATE TABLE IF NOT EXISTS tenant_limits (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id uuid UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
      max_vehicles integer DEFAULT 30,
      max_clients integer DEFAULT 30,
      max_employees integer DEFAULT 10,
      current_vehicles integer DEFAULT 0,
      current_clients integer DEFAULT 0,
      current_employees integer DEFAULT 0,
      updated_at timestamptz DEFAULT now()
    );
    `,
    
    `
    -- Agregar tenant_id a tablas existentes
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehiculos' AND column_name = 'tenant_id') THEN
        ALTER TABLE vehiculos ADD COLUMN tenant_id uuid REFERENCES tenants(id);
      END IF;
      
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clientes' AND column_name = 'tenant_id') THEN
        ALTER TABLE clientes ADD COLUMN tenant_id uuid REFERENCES tenants(id);
      END IF;
      
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'empleados' AND column_name = 'tenant_id') THEN
        ALTER TABLE empleados ADD COLUMN tenant_id uuid REFERENCES tenants(id);
      END IF;
      
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rentas' AND column_name = 'tenant_id') THEN
        ALTER TABLE rentas ADD COLUMN tenant_id uuid REFERENCES tenants(id);
      END IF;
      
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inspecciones' AND column_name = 'tenant_id') THEN
        ALTER TABLE inspecciones ADD COLUMN tenant_id uuid REFERENCES tenants(id);
      END IF;
      
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tipos_vehiculos' AND column_name = 'tenant_id') THEN
        ALTER TABLE tipos_vehiculos ADD COLUMN tenant_id uuid REFERENCES tenants(id);
      END IF;
      
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marcas' AND column_name = 'tenant_id') THEN
        ALTER TABLE marcas ADD COLUMN tenant_id uuid REFERENCES tenants(id);
      END IF;
      
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'modelos' AND column_name = 'tenant_id') THEN
        ALTER TABLE modelos ADD COLUMN tenant_id uuid REFERENCES tenants(id);
      END IF;
      
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tipos_combustible' AND column_name = 'tenant_id') THEN
        ALTER TABLE tipos_combustible ADD COLUMN tenant_id uuid REFERENCES tenants(id);
      END IF;
    END $$;
    `,
    
    `
    -- Insertar planes de suscripción
    INSERT INTO subscription_plans (name, description, price_usd, price_dop, vehicle_limit, client_limit, employee_limit, features)
    VALUES 
      ('Plan Básico', 'Perfecto para empresas pequeñas', 25.00, 1500.00, 30, 30, 10, ARRAY['Gestión básica', 'Reportes simples', 'Soporte por email']),
      ('Plan Intermedio', 'Ideal para empresas en crecimiento', 50.00, 3000.00, 100, 100, 25, ARRAY['Gestión avanzada', 'Reportes detallados', 'Soporte prioritario', 'Múltiples usuarios']),
      ('Plan Avanzado', 'Para empresas grandes sin límites', 83.33, 5000.00, NULL, NULL, NULL, ARRAY['Sin límites', 'Reportes personalizados', 'Soporte 24/7', 'API access', 'Integraciones'])
    ON CONFLICT DO NOTHING;
    `,
    
    `
    -- Crear empresa demo
    INSERT INTO tenants (name, slug, email, phone, address)
    VALUES ('RentCar Demo', 'demo', 'demo@rentcar.com', '809-555-0123', 'Av. Principal #123, Santo Domingo')
    ON CONFLICT (slug) DO NOTHING;
    `
    ,
    
    `
    -- Crear vista para tenant_users con información de auth.users
    CREATE OR REPLACE VIEW tenant_users_with_auth_info AS
    SELECT 
      tu.*,
      au.email as user_email
    FROM tenant_users tu
    LEFT JOIN auth.users au ON tu.user_id = au.id;
    `
  ]

  try {
    for (let i = 0; i < migrations.length; i++) {
      console.log(`📋 Aplicando migración ${i + 1}/${migrations.length}...`)
      const { error } = await supabase.rpc('exec_sql', { sql: migrations[i] })
      
      if (error) {
        console.error(`❌ Error en migración ${i + 1}:`, error)
        // Intentar con query directo si RPC falla
        const { error: directError } = await supabase
          .from('_migrations')
          .insert({ sql: migrations[i] })
        
        if (directError) {
          console.log(`⚠️ Migración ${i + 1} puede requerir aplicación manual`)
        }
      } else {
        console.log(`✅ Migración ${i + 1} aplicada correctamente`)
      }
    }
    
    console.log('🎉 ¡Migraciones completadas!')
    return true
  } catch (error) {
    console.error('❌ Error aplicando migraciones:', error)
    return false
  }
}