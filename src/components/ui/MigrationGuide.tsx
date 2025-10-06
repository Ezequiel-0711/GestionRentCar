import React, { useState } from 'react'
import { Database, Copy, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react'
import { Button } from './Button'

export function MigrationGuide() {
  const [copiedStep, setCopiedStep] = useState<number | null>(null)

  const migrationSQL = `-- RentCar SaaS - Migraciones Completas
-- Ejecutar en el SQL Editor de Supabase

-- 1. Crear tabla de planes de suscripción
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

-- 2. Crear tabla de empresas (tenants)
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

-- 3. Crear tabla de suscripciones
CREATE TABLE IF NOT EXISTS tenant_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  plan_id uuid REFERENCES subscription_plans(id),
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'cancelled', 'expired')),
  starts_at timestamptz DEFAULT now(),
  ends_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- 4. Crear tabla de usuarios por tenant
CREATE TABLE IF NOT EXISTS tenant_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text DEFAULT 'empleado' CHECK (role IN ('admin', 'empleado', 'solo_lectura')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, user_id)
);

-- 5. Crear tabla de límites por tenant
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

-- 6. Agregar tenant_id a tablas existentes
ALTER TABLE vehiculos ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
ALTER TABLE empleados ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
ALTER TABLE rentas ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
ALTER TABLE inspecciones ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
ALTER TABLE tipos_vehiculos ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
ALTER TABLE marcas ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
ALTER TABLE modelos ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
ALTER TABLE tipos_combustible ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);

-- 7. Insertar planes de suscripción
INSERT INTO subscription_plans (name, description, price_usd, price_dop, vehicle_limit, client_limit, employee_limit, features)
VALUES 
  ('Plan Básico', 'Perfecto para empresas pequeñas', 25.00, 1500.00, 30, 30, 10, ARRAY['Gestión básica', 'Reportes simples', 'Soporte por email']),
  ('Plan Intermedio', 'Ideal para empresas en crecimiento', 50.00, 3000.00, 100, 100, 25, ARRAY['Gestión avanzada', 'Reportes detallados', 'Soporte prioritario', 'Múltiples usuarios']),
  ('Plan Avanzado', 'Para empresas grandes sin límites', 83.33, 5000.00, NULL, NULL, NULL, ARRAY['Sin límites', 'Reportes personalizados', 'Soporte 24/7', 'API access', 'Integraciones'])
ON CONFLICT DO NOTHING;

-- 8. Crear empresa demo
INSERT INTO tenants (name, slug, email, phone, address)
VALUES ('RentCar Demo', 'demo', 'demo@rentcar.com', '809-555-0123', 'Av. Principal #123, Santo Domingo')
ON CONFLICT (slug) DO NOTHING;`

  const copyToClipboard = (text: string, step: number) => {
    navigator.clipboard.writeText(text)
    setCopiedStep(step)
    setTimeout(() => setCopiedStep(null), 2000)
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 max-w-4xl mx-auto">
      <div className="flex items-center mb-6">
        <Database className="w-8 h-8 text-blue-600 mr-3" />
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Guía de Migraciones</h2>
          <p className="text-gray-600">Aplica las migraciones para activar el sistema SaaS</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Método Automático */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
            <h3 className="font-semibold text-green-900">Método 1: Automático (Recomendado)</h3>
          </div>
          <p className="text-green-800 mb-3">
            Las migraciones se aplicarán automáticamente cuando inicies sesión. Solo necesitas:
          </p>
          <ol className="list-decimal list-inside text-green-800 space-y-1">
            <li>Conectar Supabase (⚙️ → Supabase)</li>
            <li>Iniciar sesión en la aplicación</li>
            <li>Esperar 2-3 segundos para que se apliquen las migraciones</li>
            <li>La página se recargará automáticamente</li>
          </ol>
        </div>

        {/* Método Manual */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="font-semibold text-blue-900">Método 2: Manual (Si el automático falla)</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-blue-900 mb-2">Pasos:</h4>
              <ol className="list-decimal list-inside text-blue-800 space-y-2">
                <li>Ve a tu proyecto en <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center">Supabase <ExternalLink className="w-3 h-3 ml-1" /></a></li>
                <li>Haz clic en "SQL Editor" en el menú lateral</li>
                <li>Copia el SQL de abajo y pégalo en el editor</li>
                <li>Haz clic en "Run" para ejecutar</li>
                <li>Recarga la aplicación</li>
              </ol>
            </div>

            <div className="bg-white border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">SQL para Ejecutar:</h4>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => copyToClipboard(migrationSQL, 1)}
                  className="flex items-center"
                >
                  {copiedStep === 1 ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                      ¡Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copiar SQL
                    </>
                  )}
                </Button>
              </div>
              
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                <pre className="text-sm whitespace-pre-wrap">{migrationSQL}</pre>
              </div>
            </div>
          </div>
        </div>

        {/* Verificación */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
            <h3 className="font-semibold text-yellow-900">Verificar que Funcionó</h3>
          </div>
          <p className="text-yellow-800 mb-2">Después de aplicar las migraciones, deberías ver:</p>
          <ul className="list-disc list-inside text-yellow-800 space-y-1">
            <li>Indicador de conexión en verde ✅</li>
            <li>Panel de Superadmin con estadísticas</li>
            <li>Opciones para crear empresas y planes</li>
            <li>Sin errores en la consola del navegador</li>
          </ul>
        </div>
      </div>
    </div>
  )
}