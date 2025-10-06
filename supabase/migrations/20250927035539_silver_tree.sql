/*
  # Esquema completo del Sistema RentCar

  1. Nuevas Tablas
    - `tipos_vehiculos` - Tipos de vehículos (automóvil, camioneta, etc.)
    - `marcas` - Marcas de vehículos (Toyota, Honda, etc.)
    - `modelos` - Modelos específicos por marca
    - `tipos_combustible` - Tipos de combustible
    - `vehiculos` - Información completa de vehículos
    - `clientes` - Información de clientes
    - `empleados` - Información de empleados
    - `inspecciones` - Inspecciones pre-renta
    - `rentas` - Registro de rentas y devoluciones

  2. Seguridad
    - RLS habilitado en todas las tablas
    - Políticas para usuarios autenticados
*/

-- Tabla tipos de vehículos
CREATE TABLE IF NOT EXISTS tipos_vehiculos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  descripcion text NOT NULL,
  estado boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE tipos_vehiculos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios pueden ver tipos de vehículos"
  ON tipos_vehiculos
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuarios pueden crear tipos de vehículos"
  ON tipos_vehiculos
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuarios pueden actualizar tipos de vehículos"
  ON tipos_vehiculos
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Tabla marcas
CREATE TABLE IF NOT EXISTS marcas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  descripcion text NOT NULL,
  estado boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE marcas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios pueden ver marcas"
  ON marcas
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuarios pueden crear marcas"
  ON marcas
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuarios pueden actualizar marcas"
  ON marcas
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Tabla modelos
CREATE TABLE IF NOT EXISTS modelos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  marca_id uuid REFERENCES marcas(id) ON DELETE CASCADE,
  descripcion text NOT NULL,
  estado boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE modelos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios pueden ver modelos"
  ON modelos
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuarios pueden crear modelos"
  ON modelos
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuarios pueden actualizar modelos"
  ON modelos
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Tabla tipos de combustible
CREATE TABLE IF NOT EXISTS tipos_combustible (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  descripcion text NOT NULL,
  estado boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE tipos_combustible ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios pueden ver tipos combustible"
  ON tipos_combustible
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuarios pueden crear tipos combustible"
  ON tipos_combustible
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuarios pueden actualizar tipos combustible"
  ON tipos_combustible
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Tabla vehículos
CREATE TABLE IF NOT EXISTS vehiculos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  descripcion text NOT NULL,
  numero_chasis text NOT NULL UNIQUE,
  numero_motor text NOT NULL UNIQUE,
  numero_placa text NOT NULL UNIQUE,
  tipo_vehiculo_id uuid REFERENCES tipos_vehiculos(id),
  marca_id uuid REFERENCES marcas(id),
  modelo_id uuid REFERENCES modelos(id),
  tipo_combustible_id uuid REFERENCES tipos_combustible(id),
  precio_por_dia decimal(10,2) DEFAULT 0,
  imagen_url text,
  estado boolean DEFAULT true,
  disponible boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE vehiculos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios pueden ver vehículos"
  ON vehiculos
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuarios pueden crear vehículos"
  ON vehiculos
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuarios pueden actualizar vehículos"
  ON vehiculos
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Tabla clientes
CREATE TABLE IF NOT EXISTS clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  cedula text NOT NULL UNIQUE,
  numero_tarjeta_credito text,
  limite_credito decimal(10,2) DEFAULT 0,
  tipo_persona text CHECK (tipo_persona IN ('Física', 'Jurídica')) DEFAULT 'Física',
  telefono text,
  direccion text,
  estado boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios pueden ver clientes"
  ON clientes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuarios pueden crear clientes"
  ON clientes
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuarios pueden actualizar clientes"
  ON clientes
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Tabla empleados
CREATE TABLE IF NOT EXISTS empleados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  cedula text NOT NULL UNIQUE,
  tanda_labor text CHECK (tanda_labor IN ('Matutina', 'Vespertina', 'Nocturna')) DEFAULT 'Matutina',
  porciento_comision decimal(5,2) DEFAULT 0,
  fecha_ingreso date DEFAULT CURRENT_DATE,
  telefono text,
  direccion text,
  estado boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE empleados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios pueden ver empleados"
  ON empleados
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuarios pueden crear empleados"
  ON empleados
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuarios pueden actualizar empleados"
  ON empleados
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Tabla inspecciones
CREATE TABLE IF NOT EXISTS inspecciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehiculo_id uuid REFERENCES vehiculos(id),
  cliente_id uuid REFERENCES clientes(id),
  empleado_id uuid REFERENCES empleados(id),
  tiene_ralladuras boolean DEFAULT false,
  cantidad_combustible text CHECK (cantidad_combustible IN ('1/4', '1/2', '3/4', 'Lleno')) DEFAULT 'Lleno',
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

ALTER TABLE inspecciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios pueden ver inspecciones"
  ON inspecciones
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuarios pueden crear inspecciones"
  ON inspecciones
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuarios pueden actualizar inspecciones"
  ON inspecciones
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Tabla rentas
CREATE TABLE IF NOT EXISTS rentas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_renta text NOT NULL UNIQUE,
  empleado_id uuid REFERENCES empleados(id),
  vehiculo_id uuid REFERENCES vehiculos(id),
  cliente_id uuid REFERENCES clientes(id),
  inspeccion_id uuid REFERENCES inspecciones(id),
  fecha_renta date NOT NULL,
  fecha_devolucion_programada date NOT NULL,
  fecha_devolucion_real date,
  monto_por_dia decimal(10,2) NOT NULL,
  cantidad_dias integer NOT NULL,
  monto_total decimal(10,2) NOT NULL,
  comentario text,
  estado_renta text CHECK (estado_renta IN ('Activa', 'Devuelta', 'Vencida')) DEFAULT 'Activa',
  estado boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE rentas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios pueden ver rentas"
  ON rentas
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuarios pueden crear rentas"
  ON rentas
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuarios pueden actualizar rentas"
  ON rentas
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Insertar datos de ejemplo
INSERT INTO tipos_vehiculos (descripcion) VALUES 
  ('Automóvil'),
  ('Camioneta'),
  ('Furgoneta'),
  ('SUV'),
  ('Camión');

INSERT INTO marcas (descripcion) VALUES 
  ('Toyota'),
  ('Honda'),
  ('Kia'),
  ('Hyundai'),
  ('Nissan'),
  ('Ford');

INSERT INTO tipos_combustible (descripcion) VALUES 
  ('Gasolina'),
  ('Gasoil'),
  ('Gas Natural'),
  ('Eléctrico'),
  ('Híbrido');

-- Insertar modelos de ejemplo
DO $$
DECLARE
  toyota_id uuid;
  honda_id uuid;
  kia_id uuid;
BEGIN
  SELECT id INTO toyota_id FROM marcas WHERE descripcion = 'Toyota';
  SELECT id INTO honda_id FROM marcas WHERE descripcion = 'Honda';
  SELECT id INTO kia_id FROM marcas WHERE descripcion = 'Kia';
  
  INSERT INTO modelos (marca_id, descripcion) VALUES 
    (toyota_id, 'Corolla'),
    (toyota_id, 'Camry'),
    (toyota_id, 'RAV4'),
    (honda_id, 'Civic'),
    (honda_id, 'Accord'),
    (honda_id, 'CR-V'),
    (kia_id, 'Rio'),
    (kia_id, 'Forte'),
    (kia_id, 'Sportage');
END $$;

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_vehiculos_disponible ON vehiculos(disponible);
CREATE INDEX IF NOT EXISTS idx_rentas_estado ON rentas(estado_renta);
CREATE INDEX IF NOT EXISTS idx_rentas_fecha ON rentas(fecha_renta);
CREATE INDEX IF NOT EXISTS idx_inspecciones_fecha ON inspecciones(fecha_inspeccion);