export interface SubscriptionPlan {
  id: string
  name: string
  description: string
  price_usd: number
  price_dop: number
  vehicle_limit: number | null
  client_limit: number | null
  employee_limit: number | null
  features: string[]
  is_active: boolean
  created_at: string
}

export interface Tenant {
  id: string
  name: string
  slug: string
  email: string
  phone?: string
  address?: string
  logo_url?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface TenantSubscription {
  id: string
  tenant_id: string
  plan_id: string
  status: 'active' | 'inactive' | 'cancelled' | 'expired'
  starts_at: string
  ends_at?: string
  auto_renew: boolean
  created_at: string
  updated_at: string
  subscription_plans?: SubscriptionPlan
  tenants?: Tenant
}

export interface TenantUser {
  id: string
  tenant_id: string
  user_id: string
  role: 'admin' | 'empleado' | 'solo_lectura'
  is_active: boolean
  created_at: string
  user_email?: string
  tenants?: Tenant
}

export interface TenantLimits {
  id: string
  tenant_id: string
  current_vehicles: number
  current_clients: number
  current_employees: number
  max_vehicles: number | null
  max_clients: number | null
  max_employees: number | null
  updated_at: string
}

export interface TipoVehiculo {
  id: string
  tenant_id: string
  descripcion: string
  estado: boolean
  created_at: string
}

export interface Marca {
  id: string
  tenant_id: string
  descripcion: string
  estado: boolean
  created_at: string
}

export interface Modelo {
  id: string
  tenant_id: string
  marca_id: string
  descripcion: string
  estado: boolean
  created_at: string
  marcas?: Marca
}

export interface TipoCombustible {
  id: string
  tenant_id: string
  descripcion: string
  estado: boolean
  created_at: string
}

export interface Vehiculo {
  id: string
  tenant_id: string
  descripcion: string
  numero_chasis: string
  numero_motor: string
  numero_placa: string
  tipo_vehiculo_id: string
  marca_id: string
  modelo_id: string
  tipo_combustible_id: string
  precio_por_dia: number
  imagen_url?: string
  estado: boolean
  disponible: boolean
  created_at: string
  tipos_vehiculos?: TipoVehiculo
  marcas?: Marca
  modelos?: Modelo
  tipos_combustible?: TipoCombustible
}

export interface Cliente {
  id: string
  tenant_id: string
  nombre: string
  cedula: string
  numero_tarjeta_credito?: string
  limite_credito: number
  tipo_persona: 'Física' | 'Jurídica'
  telefono?: string
  direccion?: string
  estado: boolean
  created_at: string
}

export interface Empleado {
  id: string
  tenant_id: string
  nombre: string
  cedula: string
  tanda_labor: 'Matutina' | 'Vespertina' | 'Nocturna'
  porciento_comision: number
  fecha_ingreso: string
  telefono?: string
  direccion?: string
  estado: boolean
  created_at: string
}

export interface Inspeccion {
  id: string
  tenant_id: string
  vehiculo_id: string
  cliente_id: string
  empleado_id: string
  tiene_ralladuras: boolean
  cantidad_combustible: '1/4' | '1/2' | '3/4' | 'Lleno'
  tiene_goma_respuesta: boolean
  tiene_gato: boolean
  tiene_roturas_cristal: boolean
  estado_goma_delantera_izq: boolean
  estado_goma_delantera_der: boolean
  estado_goma_trasera_izq: boolean
  estado_goma_trasera_der: boolean
  estado_goma_respuesta: boolean
  observaciones?: string
  fecha_inspeccion: string
  estado: boolean
  created_at: string
  vehiculos?: Vehiculo
  clientes?: Cliente
  empleados?: Empleado
}

export interface Renta {
  id: string
  tenant_id: string
  numero_renta: string
  empleado_id: string
  vehiculo_id: string
  cliente_id: string
  inspeccion_id?: string
  fecha_renta: string
  fecha_devolucion_programada: string
  fecha_devolucion_real?: string
  monto_por_dia: number
  cantidad_dias: number
  monto_total: number
  comentario?: string
  estado_renta: 'Activa' | 'Devuelta' | 'Vencida'
  estado: boolean
  created_at: string
  vehiculos?: Vehiculo
  clientes?: Cliente
  empleados?: Empleado
  inspecciones?: Inspeccion
}