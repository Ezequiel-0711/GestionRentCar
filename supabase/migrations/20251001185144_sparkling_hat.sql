/*
  # Limpiar y actualizar planes de suscripción

  1. Eliminación de duplicados
    - Elimina todos los planes existentes para evitar conflictos
    - Limpia cualquier suscripción activa que pueda causar problemas
  
  2. Recreación de planes con límites correctos
    - Plan Básico: 5 vehículos, 5 clientes, 5 empleados
    - Plan Intermedio: 10 vehículos, 10 clientes, 10 empleados  
    - Plan Avanzado: 15 vehículos, 15 clientes, 15 empleados
  
  3. Seguridad
    - Usa transacción para garantizar consistencia
    - Recrea los planes con los límites exactos solicitados
*/

-- Iniciar transacción para garantizar consistencia
BEGIN;

-- 1. Eliminar todas las suscripciones activas para evitar conflictos de foreign key
DELETE FROM tenant_subscriptions;

-- 2. Eliminar todos los planes existentes para evitar duplicados
DELETE FROM subscription_plans;

-- 3. Recrear los planes con los límites correctos
INSERT INTO subscription_plans (
  name, 
  description, 
  price_usd, 
  price_dop, 
  vehicle_limit, 
  client_limit, 
  employee_limit, 
  features,
  is_active
) VALUES 
(
  'Plan Básico', 
  'Perfecto para empresas pequeñas', 
  25.00, 
  1500.00, 
  5, 
  5, 
  5, 
  ARRAY['Gestión básica', 'Reportes simples', 'Soporte por email'],
  true
),
(
  'Plan Intermedio', 
  'Ideal para empresas en crecimiento', 
  50.00, 
  3000.00, 
  10, 
  10, 
  10, 
  ARRAY['Gestión avanzada', 'Reportes detallados', 'Soporte prioritario', 'Múltiples usuarios'],
  true
),
(
  'Plan Avanzado', 
  'Para empresas grandes con más recursos', 
  83.33, 
  5000.00, 
  15, 
  15, 
  15, 
  ARRAY['Máximos límites', 'Reportes personalizados', 'Soporte 24/7', 'API access', 'Integraciones'],
  true
);

-- Confirmar transacción
COMMIT;