/*
  # Arreglar aislamiento de datos por empresa

  1. Verificación de Datos
    - Verificar que todos los registros tengan tenant_id
    - Identificar registros huérfanos sin tenant_id

  2. Seguridad
    - Asegurar que RLS esté habilitado en todas las tablas
    - Verificar que las políticas filtren correctamente por tenant_id

  3. Limpieza
    - Actualizar registros sin tenant_id (si es necesario)
    - Fortalecer las políticas de seguridad
*/

-- Verificar registros sin tenant_id en tablas principales
DO $$
BEGIN
  -- Mostrar estadísticas de registros sin tenant_id
  RAISE NOTICE 'Verificando registros sin tenant_id...';
  
  -- Vehículos sin tenant_id
  IF EXISTS (SELECT 1 FROM vehiculos WHERE tenant_id IS NULL AND estado = true) THEN
    RAISE NOTICE 'ALERTA: Hay vehículos sin tenant_id';
  END IF;
  
  -- Clientes sin tenant_id
  IF EXISTS (SELECT 1 FROM clientes WHERE tenant_id IS NULL AND estado = true) THEN
    RAISE NOTICE 'ALERTA: Hay clientes sin tenant_id';
  END IF;
  
  -- Empleados sin tenant_id
  IF EXISTS (SELECT 1 FROM empleados WHERE tenant_id IS NULL AND estado = true) THEN
    RAISE NOTICE 'ALERTA: Hay empleados sin tenant_id';
  END IF;
  
  -- Rentas sin tenant_id
  IF EXISTS (SELECT 1 FROM rentas WHERE tenant_id IS NULL AND estado = true) THEN
    RAISE NOTICE 'ALERTA: Hay rentas sin tenant_id';
  END IF;
END $$;

-- Asignar tenant_id por defecto a registros huérfanos (empresa demo)
DO $$
DECLARE
  demo_tenant_id uuid;
BEGIN
  -- Obtener el ID de la empresa demo
  SELECT id INTO demo_tenant_id FROM tenants WHERE slug = 'demo' LIMIT 1;
  
  IF demo_tenant_id IS NOT NULL THEN
    -- Actualizar vehículos sin tenant_id
    UPDATE vehiculos 
    SET tenant_id = demo_tenant_id 
    WHERE tenant_id IS NULL AND estado = true;
    
    -- Actualizar clientes sin tenant_id
    UPDATE clientes 
    SET tenant_id = demo_tenant_id 
    WHERE tenant_id IS NULL AND estado = true;
    
    -- Actualizar empleados sin tenant_id
    UPDATE empleados 
    SET tenant_id = demo_tenant_id 
    WHERE tenant_id IS NULL AND estado = true;
    
    -- Actualizar rentas sin tenant_id
    UPDATE rentas 
    SET tenant_id = demo_tenant_id 
    WHERE tenant_id IS NULL AND estado = true;
    
    -- Actualizar inspecciones sin tenant_id
    UPDATE inspecciones 
    SET tenant_id = demo_tenant_id 
    WHERE tenant_id IS NULL AND estado = true;
    
    -- Actualizar configuraciones sin tenant_id
    UPDATE tipos_vehiculos 
    SET tenant_id = demo_tenant_id 
    WHERE tenant_id IS NULL AND estado = true;
    
    UPDATE marcas 
    SET tenant_id = demo_tenant_id 
    WHERE tenant_id IS NULL AND estado = true;
    
    UPDATE modelos 
    SET tenant_id = demo_tenant_id 
    WHERE tenant_id IS NULL AND estado = true;
    
    UPDATE tipos_combustible 
    SET tenant_id = demo_tenant_id 
    WHERE tenant_id IS NULL AND estado = true;
    
    RAISE NOTICE 'Registros huérfanos asignados a empresa demo';
  ELSE
    RAISE NOTICE 'No se encontró empresa demo para asignar registros huérfanos';
  END IF;
END $$;

-- Fortalecer políticas RLS para asegurar aislamiento total
-- Actualizar políticas de vehículos
DROP POLICY IF EXISTS "Usuarios pueden gestionar vehículos" ON vehiculos;
CREATE POLICY "Usuarios solo ven vehículos de su empresa"
  ON vehiculos
  FOR ALL
  TO authenticated
  USING (tenant_id = get_user_tenant_id() OR is_superadmin())
  WITH CHECK (tenant_id = get_user_tenant_id() OR is_superadmin());

-- Actualizar políticas de clientes
DROP POLICY IF EXISTS "Usuarios pueden gestionar clientes" ON clientes;
CREATE POLICY "Usuarios solo ven clientes de su empresa"
  ON clientes
  FOR ALL
  TO authenticated
  USING (tenant_id = get_user_tenant_id() OR is_superadmin())
  WITH CHECK (tenant_id = get_user_tenant_id() OR is_superadmin());

-- Actualizar políticas de empleados
DROP POLICY IF EXISTS "Usuarios pueden gestionar empleados" ON empleados;
CREATE POLICY "Usuarios solo ven empleados de su empresa"
  ON empleados
  FOR ALL
  TO authenticated
  USING (tenant_id = get_user_tenant_id() OR is_superadmin())
  WITH CHECK (tenant_id = get_user_tenant_id() OR is_superadmin());

-- Actualizar políticas de rentas
DROP POLICY IF EXISTS "Usuarios pueden gestionar rentas" ON rentas;
CREATE POLICY "Usuarios solo ven rentas de su empresa"
  ON rentas
  FOR ALL
  TO authenticated
  USING (tenant_id = get_user_tenant_id() OR is_superadmin())
  WITH CHECK (tenant_id = get_user_tenant_id() OR is_superadmin());

-- Actualizar políticas de inspecciones
DROP POLICY IF EXISTS "Usuarios pueden gestionar inspecciones" ON inspecciones;
CREATE POLICY "Usuarios solo ven inspecciones de su empresa"
  ON inspecciones
  FOR ALL
  TO authenticated
  USING (tenant_id = get_user_tenant_id() OR is_superadmin())
  WITH CHECK (tenant_id = get_user_tenant_id() OR is_superadmin());

-- Actualizar políticas de configuración
DROP POLICY IF EXISTS "Usuarios pueden gestionar tipos de vehículos" ON tipos_vehiculos;
CREATE POLICY "Usuarios solo ven tipos de vehículos de su empresa"
  ON tipos_vehiculos
  FOR ALL
  TO authenticated
  USING (tenant_id = get_user_tenant_id() OR is_superadmin())
  WITH CHECK (tenant_id = get_user_tenant_id() OR is_superadmin());

DROP POLICY IF EXISTS "Usuarios pueden gestionar marcas" ON marcas;
CREATE POLICY "Usuarios solo ven marcas de su empresa"
  ON marcas
  FOR ALL
  TO authenticated
  USING (tenant_id = get_user_tenant_id() OR is_superadmin())
  WITH CHECK (tenant_id = get_user_tenant_id() OR is_superadmin());

DROP POLICY IF EXISTS "Usuarios pueden gestionar modelos" ON modelos;
CREATE POLICY "Usuarios solo ven modelos de su empresa"
  ON modelos
  FOR ALL
  TO authenticated
  USING (tenant_id = get_user_tenant_id() OR is_superadmin())
  WITH CHECK (tenant_id = get_user_tenant_id() OR is_superadmin());

DROP POLICY IF EXISTS "Usuarios pueden gestionar tipos de combustible" ON tipos_combustible;
CREATE POLICY "Usuarios solo ven tipos de combustible de su empresa"
  ON tipos_combustible
  FOR ALL
  TO authenticated
  USING (tenant_id = get_user_tenant_id() OR is_superadmin())
  WITH CHECK (tenant_id = get_user_tenant_id() OR is_superadmin());