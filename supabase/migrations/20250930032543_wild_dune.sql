/*
  # Crear tablas básicas para RentCar

  1. Tablas principales
    - `tipos_vehiculos` - Tipos de vehículos (Sedán, SUV, etc.)
    - `marcas` - Marcas de vehículos (Toyota, Honda, etc.)
    - `modelos` - Modelos de vehículos
    - `tipos_combustible` - Tipos de combustible (Gasolina, Diésel, etc.)
    - `vehiculos` - Vehículos disponibles
    - `clientes` - Clientes del sistema
    - `empleados` - Empleados de la empresa
    - `inspecciones` - Inspecciones de vehículos
    - `rentas` - Rentas de vehículos

  2. Seguridad
    - Habilitar RLS en todas las tablas
    - Políticas básicas de acceso
*/

-- Crear tablas de configuración
CREATE TABLE IF NOT EXISTS tipos_vehiculos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  descripcion text NOT NULL,
  estado boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS marcas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  descripcion text NOT NULL,
  estado boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS modelos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  marca_id uuid REFERENCES marcas(id) ON DELETE CASCADE,
  descripcion text NOT NULL,
  estado boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tipos_combustible (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  descripcion text NOT NULL,
  estado boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Crear tabla de vehículos
CREATE TABLE IF NOT EXISTS vehiculos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  descripcion text NOT NULL,
  numero_chasis text UNIQUE NOT NULL,
  numero_motor text UNIQUE NOT NULL,
  numero_placa text UNIQUE NOT NULL,
  tipo_vehiculo_id uuid REFERENCES tipos_vehiculos(id),
  marca_id uuid REFERENCES marcas(id),
  modelo_id uuid REFERENCES modelos(id),
  tipo_combustible_id uuid REFERENCES tipos_combustible(id),
  precio_por_dia numeric(10,2) DEFAULT 0,
  imagen_url text,
  estado boolean DEFAULT true,
  disponible boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Crear tabla de clientes
CREATE TABLE IF NOT EXISTS clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  cedula text UNIQUE NOT NULL,
  numero_tarjeta_credito text,
  limite_credito numeric(10,2) DEFAULT 0,
  tipo_persona text DEFAULT 'Física' CHECK (tipo_persona IN ('Física', 'Jurídica')),
  telefono text,
  direccion text,
  estado boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Crear tabla de empleados
CREATE TABLE IF NOT EXISTS empleados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  cedula text UNIQUE NOT NULL,
  tanda_labor text DEFAULT 'Matutina' CHECK (tanda_labor IN ('Matutina', 'Vespertina', 'Nocturna')),
  porciento_comision numeric(5,2) DEFAULT 0,
  fecha_ingreso date DEFAULT CURRENT_DATE,
  telefono text,
  direccion text,
  estado boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Crear tabla de inspecciones
CREATE TABLE IF NOT EXISTS inspecciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehiculo_id uuid REFERENCES vehiculos(id),
  cliente_id uuid REFERENCES clientes(id),
  empleado_id uuid REFERENCES empleados(id),
  tiene_ralladuras boolean DEFAULT false,
  cantidad_combustible text DEFAULT 'Lleno' CHECK (cantidad_combustible IN ('1/4', '1/2', '3/4', 'Lleno')),
  tiene_goma_respuesta boolean DEFAULT false,
  tiene_gato boolean DEFAULT false,
  tiene_roturas_cristal boolean DEFAULT false,
  estado_goma_delantera_izq boolean DEFAULT true,
  estado_goma_delantera_der boolean DEFAULT true,
  estado_goma_trasera_izq boolean DEFAULT true,
  estado_goma_trasera_der boolean DEFAULT true,
  estado_goma_respuesta boolean DEFAULT true,
  observaciones text,
  fecha_inspeccion timestamptz DEFAULT now(),
  estado boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Crear tabla de rentas
CREATE TABLE IF NOT EXISTS rentas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_renta text UNIQUE NOT NULL,
  empleado_id uuid REFERENCES empleados(id),
  vehiculo_id uuid REFERENCES vehiculos(id),
  cliente_id uuid REFERENCES clientes(id),
  inspeccion_id uuid REFERENCES inspecciones(id),
  fecha_renta date NOT NULL,
  fecha_devolucion_programada date NOT NULL,
  fecha_devolucion_real date,
  monto_por_dia numeric(10,2) NOT NULL,
  cantidad_dias integer NOT NULL,
  monto_total numeric(10,2) NOT NULL,
  comentario text,
  estado_renta text DEFAULT 'Activa' CHECK (estado_renta IN ('Activa', 'Devuelta', 'Vencida')),
  estado boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_vehiculos_disponible ON vehiculos(disponible);
CREATE INDEX IF NOT EXISTS idx_rentas_estado ON rentas(estado_renta);
CREATE INDEX IF NOT EXISTS idx_rentas_fecha ON rentas(fecha_renta);
CREATE INDEX IF NOT EXISTS idx_inspecciones_fecha ON inspecciones(fecha_inspeccion);

-- Habilitar RLS en todas las tablas
ALTER TABLE tipos_vehiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE marcas ENABLE ROW LEVEL SECURITY;
ALTER TABLE modelos ENABLE ROW LEVEL SECURITY;
ALTER TABLE tipos_combustible ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE empleados ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspecciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE rentas ENABLE ROW LEVEL SECURITY;

-- Crear políticas básicas (permitir todo para usuarios autenticados)
CREATE POLICY "Usuarios pueden gestionar tipos de vehículos" ON tipos_vehiculos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Usuarios pueden gestionar marcas" ON marcas FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Usuarios pueden gestionar modelos" ON modelos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Usuarios pueden gestionar tipos de combustible" ON tipos_combustible FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Usuarios pueden gestionar vehículos" ON vehiculos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Usuarios pueden gestionar clientes" ON clientes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Usuarios pueden gestionar empleados" ON empleados FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Usuarios pueden gestionar inspecciones" ON inspecciones FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Usuarios pueden gestionar rentas" ON rentas FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Insertar datos de ejemplo
INSERT INTO tipos_vehiculos (descripcion) VALUES 
  ('Sedán'),
  ('SUV'),
  ('Hatchback'),
  ('Pickup'),
  ('Convertible')
ON CONFLICT DO NOTHING;

INSERT INTO marcas (descripcion) VALUES 
  ('Toyota'),
  ('Honda'),
  ('Nissan'),
  ('Hyundai'),
  ('Kia'),
  ('Chevrolet'),
  ('Ford')
ON CONFLICT DO NOTHING;

INSERT INTO tipos_combustible (descripcion) VALUES 
  ('Gasolina'),
  ('Diésel'),
  ('Híbrido'),
  ('Eléctrico')
ON CONFLICT DO NOTHING;

-- Insertar algunos modelos de ejemplo
DO $$
DECLARE
  toyota_id uuid;
  honda_id uuid;
  nissan_id uuid;
BEGIN
  SELECT id INTO toyota_id FROM marcas WHERE descripcion = 'Toyota' LIMIT 1;
  SELECT id INTO honda_id FROM marcas WHERE descripcion = 'Honda' LIMIT 1;
  SELECT id INTO nissan_id FROM marcas WHERE descripcion = 'Nissan' LIMIT 1;
  
  IF toyota_id IS NOT NULL THEN
    INSERT INTO modelos (marca_id, descripcion) VALUES 
      (toyota_id, 'Corolla'),
      (toyota_id, 'Camry'),
      (toyota_id, 'RAV4'),
      (toyota_id, 'Prius')
    ON CONFLICT DO NOTHING;
  END IF;
  
  IF honda_id IS NOT NULL THEN
    INSERT INTO modelos (marca_id, descripcion) VALUES 
      (honda_id, 'Civic'),
      (honda_id, 'Accord'),
      (honda_id, 'CR-V'),
      (honda_id, 'Pilot')
    ON CONFLICT DO NOTHING;
  END IF;
  
  IF nissan_id IS NOT NULL THEN
    INSERT INTO modelos (marca_id, descripcion) VALUES 
      (nissan_id, 'Sentra'),
      (nissan_id, 'Altima'),
      (nissan_id, 'Rogue'),
      (nissan_id, 'Pathfinder')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;