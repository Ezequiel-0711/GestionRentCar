import React, { useState, useEffect } from 'react'
import { Car, Users, UserCheck, FileText, Calendar, TrendingUp, Crown, AlertTriangle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useUserRole } from '../../hooks/useUserRole'
import { useTenantLimits } from '../../hooks/useTenantLimits'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import { UsageCard } from '../ui/UsageCard'
import { LimitWarning } from '../ui/LimitWarning'
import { Button } from '../ui/Button'
import { TenantSubscription } from '../../types/database'

interface DashboardStats {
  totalVehiculos: number
  vehiculosDisponibles: number
  totalClientes: number
  totalEmpleados: number
  rentasActivas: number
  rentasHoy: number
}

export function TenantDashboard() {
  const { tenantId } = useUserRole()
  const { limits, loading: limitsLoading, getVehicleUsage, getClientUsage, getEmployeeUsage } = useTenantLimits()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [subscription, setSubscription] = useState<TenantSubscription | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (tenantId) {
      loadDashboardStats()
      loadSubscription()
    }
  }, [tenantId])

  async function loadDashboardStats() {
    if (!tenantId) return
    
    try {
      // Usar consultas más simples y con manejo de errores mejorado
      const today = new Date().toISOString().split('T')[0]
      
      const queries = await Promise.allSettled([
        supabase.from('vehiculos').select('disponible, estado', { count: 'exact' }).eq('tenant_id', tenantId).limit(1000),
        supabase.from('clientes').select('estado', { count: 'exact' }).eq('tenant_id', tenantId).limit(1000),
        supabase.from('empleados').select('estado', { count: 'exact' }).eq('tenant_id', tenantId).limit(1000),
        supabase.from('rentas').select('estado_renta, fecha_renta', { count: 'exact' }).eq('tenant_id', tenantId).limit(1000)
      ])

      // Procesar resultados con valores por defecto
      const vehiculos = queries[0].status === 'fulfilled' ? queries[0].value : { data: [], count: 0 }
      const clientes = queries[1].status === 'fulfilled' ? queries[1].value : { data: [], count: 0 }
      const empleados = queries[2].status === 'fulfilled' ? queries[2].value : { data: [], count: 0 }
      const rentas = queries[3].status === 'fulfilled' ? queries[3].value : { data: [], count: 0 }

      setStats({
        totalVehiculos: vehiculos.count || vehiculos.data?.length || 0,
        vehiculosDisponibles: vehiculos.data?.filter(v => v.disponible && v.estado).length || 0,
        totalClientes: clientes.count || clientes.data?.filter(c => c.estado).length || 0,
        totalEmpleados: empleados.count || empleados.data?.filter(e => e.estado).length || 0,
        rentasActivas: rentas.data?.filter(r => r.estado_renta === 'Activa').length || 0,
        rentasHoy: rentas.data?.filter(r => r.fecha_renta === today).length || 0
      })
    } catch (error) {
      console.error('Error loading dashboard stats:', error)
      // Establecer valores por defecto en caso de error
      setStats({
        totalVehiculos: 0,
        vehiculosDisponibles: 0,
        totalClientes: 0,
        totalEmpleados: 0,
        rentasActivas: 0,
        rentasHoy: 0
      })
    } finally {
      setLoading(false)
    }
  }

  async function loadSubscription() {
    if (!tenantId) return
    
    try {
      const { data } = await supabase
        .from('tenant_subscriptions')
        .select(`
          *,
          subscription_plans(*)
        `)
        .eq('tenant_id', tenantId)
        .eq('status', 'active')
        .maybeSingle()

      setSubscription(data)
    } catch (error) {
      console.error('Error loading subscription:', error)
      setSubscription(null)
    }
  }

  if (loading || limitsLoading) {
    return <LoadingSpinner className="h-64" />
  }

  const vehicleUsage = getVehicleUsage()
  const clientUsage = getClientUsage()
  const employeeUsage = getEmployeeUsage()

  const isNearVehicleLimit = vehicleUsage.max > 0 && (vehicleUsage.current / vehicleUsage.max) >= 0.8
  const isNearClientLimit = clientUsage.max > 0 && (clientUsage.current / clientUsage.max) >= 0.8
  const isNearEmployeeLimit = employeeUsage.max > 0 && (employeeUsage.current / employeeUsage.max) >= 0.8

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <div className="text-sm text-gray-500">
          Última actualización: {new Date().toLocaleString('es-DO')}
        </div>
      </div>

      {/* Información de Suscripción */}
      {subscription && (
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Crown className="w-8 h-8 mr-3" />
              <div>
                <h3 className="text-lg font-semibold">{subscription.subscription_plans?.name}</h3>
                <p className="text-blue-100">
                  ${subscription.subscription_plans?.price_usd}/mes • 
                  {subscription.ends_at && ` Vence: ${new Date(subscription.ends_at).toLocaleDateString('es-DO')}`}
                </p>
              </div>
            </div>
            <Button variant="secondary" size="sm">
              Gestionar Suscripción
            </Button>
          </div>
        </div>
      )}

      {/* Advertencias de Límites */}
      <div className="space-y-4">
        {isNearVehicleLimit && (
          <LimitWarning
            type="vehicle"
            current={vehicleUsage.current}
            max={vehicleUsage.max}
          />
        )}
        {isNearClientLimit && (
          <LimitWarning
            type="client"
            current={clientUsage.current}
            max={clientUsage.max}
          />
        )}
        {isNearEmployeeLimit && (
          <LimitWarning
            type="employee"
            current={employeeUsage.current}
            max={employeeUsage.max}
          />
        )}
      </div>

      {/* Tarjetas de Uso */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <UsageCard
          title="Vehículos"
          current={vehicleUsage.current}
          max={vehicleUsage.max}
          icon={<Car className="w-6 h-6 text-white" />}
          color="bg-blue-500"
        />
        <UsageCard
          title="Clientes"
          current={clientUsage.current}
          max={clientUsage.max}
          icon={<Users className="w-6 h-6 text-white" />}
          color="bg-green-500"
        />
        <UsageCard
          title="Empleados"
          current={employeeUsage.current}
          max={employeeUsage.max}
          icon={<UserCheck className="w-6 h-6 text-white" />}
          color="bg-purple-500"
        />
      </div>

      {/* Estadísticas Operacionales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center">
            <div className="bg-green-500 p-3 rounded-full">
              <Car className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Vehículos Disponibles</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.vehiculosDisponibles}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center">
            <div className="bg-red-500 p-3 rounded-full">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Rentas Activas</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.rentasActivas}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center">
            <div className="bg-indigo-500 p-3 rounded-full">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Rentas Hoy</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.rentasHoy}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Resumen del Sistema */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen Operacional</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Tasa de Ocupación</span>
              <span className="font-semibold text-blue-600">
                {stats?.totalVehiculos ? Math.round(((stats.totalVehiculos - stats.vehiculosDisponibles) / stats.totalVehiculos) * 100) : 0}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Vehículos en Renta</span>
              <span className="font-semibold text-red-600">
                {(stats?.totalVehiculos || 0) - (stats?.vehiculosDisponibles || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Estado del Sistema</span>
              <span className="font-semibold text-green-600">Operativo</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <h3 className="text-lg font-semibold mb-4">RentCar SaaS</h3>
          <p className="text-blue-100 mb-4">
            Sistema completo de gestión de alquiler de vehículos con tecnología de vanguardia.
          </p>
          <div className="flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            <span className="text-sm">Optimizado para máximo rendimiento</span>
          </div>
        </div>
      </div>
    </div>
  )
}