import React, { useState, useEffect } from 'react'
import { Plus, Search, FileText, Calendar } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useUserRole } from '../../hooks/useUserRole'
import { PermissionGuard } from '../ui/PermissionGuard'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Modal } from '../ui/Modal'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import { Renta, Vehiculo, Cliente, Empleado, Inspeccion } from '../../types/database'

export function Rentas() {
  const { canEdit } = useUserRole()
  const { tenantId, isSuperAdmin } = useUserRole()
  const [rentas, setRentas] = useState<Renta[]>([])
  const [filteredRentas, setFilteredRentas] = useState<Renta[]>([])
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [empleados, setEmpleados] = useState<Empleado[]>([])
  const [inspecciones, setInspecciones] = useState<Inspeccion[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [formData, setFormData] = useState({
    empleado_id: '',
    vehiculo_id: '',
    cliente_id: '',
    inspeccion_id: '',
    fecha_renta: new Date().toISOString().split('T')[0],
    cantidad_dias: '1',
    comentario: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    filterRentas()
  }, [rentas, searchTerm, statusFilter])

  async function loadData() {
    try {
      let rentasQuery = supabase.from('rentas').select(`
          *,
          vehiculos(descripcion, numero_placa, precio_por_dia),
          clientes(nombre),
          empleados(nombre),
          inspecciones(id)
        `).eq('estado', true)
      
      let vehiculosQuery = supabase.from('vehiculos').select('*').eq('estado', true).eq('disponible', true)
      let clientesQuery = supabase.from('clientes').select('*').eq('estado', true)
      let empleadosQuery = supabase.from('empleados').select('*').eq('estado', true)
      let inspeccionesQuery = supabase.from('inspecciones').select('*').eq('estado', true)

      if (!isSuperAdmin && tenantId) {
        rentasQuery = rentasQuery.eq('tenant_id', tenantId)
        vehiculosQuery = vehiculosQuery.eq('tenant_id', tenantId)
        clientesQuery = clientesQuery.eq('tenant_id', tenantId)
        empleadosQuery = empleadosQuery.eq('tenant_id', tenantId)
        inspeccionesQuery = inspeccionesQuery.eq('tenant_id', tenantId)
      }

      const [rentasRes, vehiculosRes, clientesRes, empleadosRes, inspeccionesRes] = await Promise.all([
        rentasQuery,
        vehiculosQuery,
        clientesQuery,
        empleadosQuery,
        inspeccionesQuery
      ])

      setRentas(rentasRes.data || [])
      setVehiculos(vehiculosRes.data || [])
      setClientes(clientesRes.data || [])
      setEmpleados(empleadosRes.data || [])
      setInspecciones(inspeccionesRes.data || [])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  function filterRentas() {
    let filtered = rentas

    if (searchTerm) {
      filtered = filtered.filter(renta =>
        renta.numero_renta.toLowerCase().includes(searchTerm.toLowerCase()) ||
        renta.vehiculos?.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        renta.vehiculos?.numero_placa.toLowerCase().includes(searchTerm.toLowerCase()) ||
        renta.clientes?.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        renta.empleados?.nombre.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter) {
      filtered = filtered.filter(renta => renta.estado_renta === statusFilter)
    }

    setFilteredRentas(filtered)
  }

  function openModal() {
    setFormData({
      empleado_id: '',
      vehiculo_id: '',
      cliente_id: '',
      inspeccion_id: '',
      fecha_renta: new Date().toISOString().split('T')[0],
      cantidad_dias: '1',
      comentario: ''
    })
    setIsModalOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    try {
      // Obtener el precio del vehículo
      const vehiculo = vehiculos.find(v => v.id === formData.vehiculo_id)
      if (!vehiculo) return

      const cantidadDias = parseInt(formData.cantidad_dias)
      const montoPorDia = vehiculo.precio_por_dia
      const montoTotal = cantidadDias * montoPorDia

      // Calcular fecha de devolución programada
      const fechaRenta = new Date(formData.fecha_renta)
      const fechaDevolucion = new Date(fechaRenta)
      fechaDevolucion.setDate(fechaRenta.getDate() + cantidadDias)

      // Generar número de renta único
      const numeroRenta = `R${Date.now()}`

      const rentaData = {
        numero_renta: numeroRenta,
        empleado_id: formData.empleado_id,
        vehiculo_id: formData.vehiculo_id,
        cliente_id: formData.cliente_id,
        inspeccion_id: formData.inspeccion_id || null,
        fecha_renta: formData.fecha_renta,
        fecha_devolucion_programada: fechaDevolucion.toISOString().split('T')[0],
        monto_por_dia: montoPorDia,
        cantidad_dias: cantidadDias,
        monto_total: montoTotal,
        comentario: formData.comentario
      }

      await supabase.from('rentas').insert([rentaData])

      // Marcar el vehículo como no disponible
      await supabase
        .from('vehiculos')
        .update({ disponible: false })
        .eq('id', formData.vehiculo_id)

      setIsModalOpen(false)
      await loadData()
    } catch (error) {
      console.error('Error saving renta:', error)
    }
  }

  async function devolverVehiculo(rentaId: string, vehiculoId: string) {
    if (confirm('¿Confirma la devolución de este vehículo?')) {
      try {
        const fechaDevolucionReal = new Date().toISOString().split('T')[0]
        
        await Promise.all([
          supabase
            .from('rentas')
            .update({ 
              fecha_devolucion_real: fechaDevolucionReal,
              estado_renta: 'Devuelta' 
            })
            .eq('id', rentaId),
          supabase
            .from('vehiculos')
            .update({ disponible: true })
            .eq('id', vehiculoId)
        ])

        await loadData()
      } catch (error) {
        console.error('Error devolviendo vehículo:', error)
      }
    }
  }

  if (loading) {
    return <LoadingSpinner className="h-64" />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Rentas</h1>
        <PermissionGuard requireEdit>
          <Button onClick={openModal}>
            <Plus className="w-4 h-4 mr-2" />
            Nueva Renta
          </Button>
        </PermissionGuard>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Buscar por número, vehículo, cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            { value: '', label: 'Todos los estados' },
            { value: 'Activa', label: 'Activas' },
            { value: 'Devuelta', label: 'Devueltas' },
            { value: 'Vencida', label: 'Vencidas' }
          ]}
          className="w-48"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredRentas.map((renta) => (
          <div key={renta.id} className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Renta #{renta.numero_renta}
                </h3>
                <p className="text-sm text-gray-600">
                  {renta.vehiculos?.descripcion} - {renta.vehiculos?.numero_placa}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                renta.estado_renta === 'Activa' 
                  ? 'bg-green-100 text-green-800'
                  : renta.estado_renta === 'Devuelta'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {renta.estado_renta}
              </span>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Cliente:</span>
                  <p className="font-medium">{renta.clientes?.nombre}</p>
                </div>
                <div>
                  <span className="text-gray-600">Empleado:</span>
                  <p className="font-medium">{renta.empleados?.nombre}</p>
                </div>
                <div>
                  <span className="text-gray-600">Fecha Renta:</span>
                  <p className="font-medium">{new Date(renta.fecha_renta).toLocaleDateString('es-DO')}</p>
                </div>
                <div>
                  <span className="text-gray-600">Fecha Devolución:</span>
                  <p className="font-medium">
                    {new Date(renta.fecha_devolucion_programada).toLocaleDateString('es-DO')}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Días:</span>
                  <p className="font-medium">{renta.cantidad_dias}</p>
                </div>
                <div>
                  <span className="text-gray-600">Monto Total:</span>
                  <p className="font-medium text-green-600">${renta.monto_total.toFixed(2)}</p>
                </div>
              </div>

              {renta.fecha_devolucion_real && (
                <div className="border-t pt-3">
                  <span className="text-gray-600 text-sm">Devuelto el:</span>
                  <p className="font-medium text-blue-600">
                    {new Date(renta.fecha_devolucion_real).toLocaleDateString('es-DO')}
                  </p>
                </div>
              )}

              {renta.comentario && (
                <div className="border-t pt-3">
                  <span className="text-gray-600 text-sm">Comentarios:</span>
                  <p className="text-sm mt-1">{renta.comentario}</p>
                </div>
              )}

              {renta.estado_renta === 'Activa' && (
                <PermissionGuard requireEdit>
                  <div className="border-t pt-4">
                    <Button
                      size="sm"
                      variant="success"
                      onClick={() => devolverVehiculo(renta.id, renta.vehiculo_id)}
                      className="w-full"
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Devolver Vehículo
                    </Button>
                  </div>
                </PermissionGuard>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredRentas.length === 0 && (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500">No se encontraron rentas</p>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nueva Renta"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Empleado"
              value={formData.empleado_id}
              onChange={(e) => setFormData({ ...formData, empleado_id: e.target.value })}
              options={empleados.map(empleado => ({ value: empleado.id, label: empleado.nombre }))}
              required
            />
            <Select
              label="Cliente"
              value={formData.cliente_id}
              onChange={(e) => setFormData({ ...formData, cliente_id: e.target.value })}
              options={clientes.map(cliente => ({ value: cliente.id, label: cliente.nombre }))}
              required
            />
            <Select
              label="Vehículo"
              value={formData.vehiculo_id}
              onChange={(e) => setFormData({ ...formData, vehiculo_id: e.target.value })}
              options={vehiculos.map(vehiculo => ({ 
                value: vehiculo.id, 
                label: `${vehiculo.descripcion} - ${vehiculo.numero_placa} ($${vehiculo.precio_por_dia}/día)` 
              }))}
              required
            />
            <Select
              label="Inspección Previa (Opcional)"
              value={formData.inspeccion_id}
              onChange={(e) => setFormData({ ...formData, inspeccion_id: e.target.value })}
              options={inspecciones.map(insp => ({ 
                value: insp.id, 
                label: `Inspección ${new Date(insp.fecha_inspeccion).toLocaleDateString('es-DO')}` 
              }))}
            />
            <Input
              label="Fecha de Renta"
              type="date"
              value={formData.fecha_renta}
              onChange={(e) => setFormData({ ...formData, fecha_renta: e.target.value })}
              required
            />
            <Input
              label="Cantidad de Días"
              type="number"
              min="1"
              value={formData.cantidad_dias}
              onChange={(e) => setFormData({ ...formData, cantidad_dias: e.target.value })}
              required
            />
          </div>

          {formData.vehiculo_id && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Resumen de Costos</h4>
              {(() => {
                const vehiculo = vehiculos.find(v => v.id === formData.vehiculo_id)
                const dias = parseInt(formData.cantidad_dias) || 1
                const total = vehiculo ? vehiculo.precio_por_dia * dias : 0
                return (
                  <div className="text-blue-800 text-sm space-y-1">
                    <p>Precio por día: ${vehiculo?.precio_por_dia.toFixed(2)}</p>
                    <p>Cantidad de días: {dias}</p>
                    <p className="font-semibold">Total: ${total.toFixed(2)}</p>
                  </div>
                )
              })()}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comentarios
            </label>
            <textarea
              value={formData.comentario}
              onChange={(e) => setFormData({ ...formData, comentario: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Observaciones adicionales sobre la renta..."
            />
          </div>

          <div className="flex space-x-4 pt-6">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1">
              Crear Renta
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}