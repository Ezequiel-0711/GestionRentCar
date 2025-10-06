import React, { useState, useEffect } from 'react'
import { Car, Users, UserCheck, FileText, Calendar, TrendingUp } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useUserRole } from '../../hooks/useUserRole'
import { LoadingSpinner } from '../ui/LoadingSpinner'

interface DashboardStats {
  totalVehiculos: number
  vehiculosDisponibles: number
  totalClientes: number
  totalEmpleados: number
  rentasActivas: number
  rentasHoy: number
}

export function Dashboard() {
  const { tenantId } = useUserRole()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardStats()
  }, [tenantId])

  async function loadDashboardStats() {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      let vehiculosQuery = supabase.from('vehiculos').select('disponible, estado').eq('estado', true)
      let clientesQuery = supabase.from('clientes').select('estado').eq('estado', true)
      let empleadosQuery = supabase.from('empleados').select('estado').eq('estado', true)
      let rentasQuery = supabase.from('rentas').select('estado_renta, fecha_renta, monto_total').eq('estado', true)

      // Solo el superadmin puede ver datos de todas las empresas
      if (!isSuperAdmin && tenantId) {
        vehiculosQuery = vehiculosQuery.eq('tenant_id', tenantId)
        clientesQuery = clientesQuery.eq('tenant_id', tenantId)
        empleadosQuery = empleadosQuery.eq('tenant_id', tenantId)
        rentasQuery = rentasQuery.eq('tenant_id', tenantId)
      }

      const queries = await Promise.allSettled([
        vehiculosQuery,
        clientesQuery,
        empleadosQuery,
        rentasQuery
      ])

      console.log('Dashboard Debug:', {
        today,
        tenantId,
        isSuperAdmin,
        rentasData: queries[3].status === 'fulfilled' ? queries[3].value.data : null
      });

      // Procesar resultados con valores por defecto
      const vehiculos = queries[0].status === 'fulfilled' ? queries[0].value.data || [] : []
      const clientes = queries[1].status === 'fulfilled' ? queries[1].value.data || [] : []
      const empleados = queries[2].status === 'fulfilled' ? queries[2].value.data || [] : []
      const rentas = queries[3].status === 'fulfilled' ? queries[3].value.data || [] : []

      // Calcular ingresos de hoy
      const rentasHoy = rentas.filter(r => r.fecha_renta === today)
      const ingresosHoy = rentasHoy.reduce((sum, r) => sum + (parseFloat(r.monto_total) || 0), 0)

      setStats({
        totalVehiculos: vehiculos.length,
        vehiculosDisponibles: vehiculos.filter(v => v.disponible && v.estado).length,
        totalClientes: clientes.filter(c => c.estado).length,
        totalEmpleados: empleados.filter(e => e.estado).length,
        rentasActivas: rentas.filter(r => r.estado_renta === 'Activa').length,
        rentasHoy: rentasHoy.length
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

  if (loading) {
    return <LoadingSpinner className="h-64" />
  }

  const statCards = [
    {
      title: 'Total Vehículos',
      value: stats?.totalVehiculos || 0,
      icon: Car,
      color: 'bg-blue-500'
    },
    {
      title: 'Vehículos Disponibles',
      value: stats?.vehiculosDisponibles || 0,
      icon: Car,
      color: 'bg-green-500'
    },
    {
      title: 'Total Clientes',
      value: stats?.totalClientes || 0,
      icon: Users,
      color: 'bg-purple-500'
    },
    {
      title: 'Total Empleados',
      value: stats?.totalEmpleados || 0,
      icon: UserCheck,
      color: 'bg-orange-500'
    },
    {
      title: 'Rentas Activas',
      value: stats?.rentasActivas || 0,
      icon: FileText,
      color: 'bg-red-500'
    },
    {
      title: 'Rentas Hoy',
      value: stats?.rentasHoy || 0,
      icon: Calendar,
      color: 'bg-indigo-500'
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <div className="text-sm text-gray-500">
          Última actualización: {new Date().toLocaleString('es-DO')}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon
          return (
            <div key={index} className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center">
                <div className={`${card.color} p-3 rounded-full`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen del Sistema</h3>
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
          <h3 className="text-lg font-semibold mb-4">Bienvenido al Sistema RentCar</h3>
          <p className="text-blue-100 mb-4">
            Sistema completo de gestión de alquiler de vehículos desarrollado con tecnologías open source.
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