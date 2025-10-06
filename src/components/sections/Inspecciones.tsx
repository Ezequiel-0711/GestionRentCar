import React, { useState, useEffect } from 'react'
import { Plus, Search, ClipboardList, CheckCircle, XCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useUserRole } from '../../hooks/useUserRole'
import { PermissionGuard } from '../ui/PermissionGuard'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Modal } from '../ui/Modal'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import { Inspeccion, Vehiculo, Cliente, Empleado } from '../../types/database'

export function Inspecciones() {
  const { canEdit, tenantId, isSuperAdmin } = useUserRole()
  const [inspecciones, setInspecciones] = useState<Inspeccion[]>([])
  const [filteredInspecciones, setFilteredInspecciones] = useState<Inspeccion[]>([])
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [empleados, setEmpleados] = useState<Empleado[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [formData, setFormData] = useState({
    vehiculo_id: '',
    cliente_id: '',
    empleado_id: '',
    tiene_ralladuras: false,
    cantidad_combustible: 'Lleno' as '1/4' | '1/2' | '3/4' | 'Lleno',
    tiene_goma_respuesta: true,
    tiene_gato: true,
    tiene_roturas_cristal: false,
    estado_goma_delantera_izq: true,
    estado_goma_delantera_der: true,
    estado_goma_trasera_izq: true,
    estado_goma_trasera_der: true,
    estado_goma_respuesta: true,
    observaciones: ''
  })

  useEffect(() => {
    loadData()
  }, [tenantId, isSuperAdmin])

  useEffect(() => {
    filterInspecciones()
  }, [inspecciones, searchTerm])

  async function loadData() {
    try {
      let inspeccionesQuery = supabase.from('inspecciones').select(`
          *,
          vehiculos(descripcion, numero_placa),
          clientes(nombre),
          empleados(nombre)
        `).eq('estado', true)
      
      let vehiculosQuery = supabase.from('vehiculos').select('*').eq('estado', true).eq('disponible', true)
      let clientesQuery = supabase.from('clientes').select('*').eq('estado', true)
      let empleadosQuery = supabase.from('empleados').select('*').eq('estado', true)

      if (!isSuperAdmin && tenantId) {
        inspeccionesQuery = inspeccionesQuery.eq('tenant_id', tenantId)
        vehiculosQuery = vehiculosQuery.eq('tenant_id', tenantId)
        clientesQuery = clientesQuery.eq('tenant_id', tenantId)
        empleadosQuery = empleadosQuery.eq('tenant_id', tenantId)
      }

      const [inspeccionesRes, vehiculosRes, clientesRes, empleadosRes] = await Promise.all([
        inspeccionesQuery,
        vehiculosQuery,
        clientesQuery,
        empleadosQuery
      ])

      setInspecciones(inspeccionesRes.data || [])
      setVehiculos(vehiculosRes.data || [])
      setClientes(clientesRes.data || [])
      setEmpleados(empleadosRes.data || [])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  function filterInspecciones() {
    if (!searchTerm) {
      setFilteredInspecciones(inspecciones)
    } else {
      const filtered = inspecciones.filter(inspeccion =>
        inspeccion.vehiculos?.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inspeccion.vehiculos?.numero_placa.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inspeccion.clientes?.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inspeccion.empleados?.nombre.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredInspecciones(filtered)
    }
  }

  function openModal() {
    setFormData({
      vehiculo_id: '',
      cliente_id: '',
      empleado_id: '',
      tiene_ralladuras: false,
      cantidad_combustible: 'Lleno',
      tiene_goma_respuesta: true,
      tiene_gato: true,
      tiene_roturas_cristal: false,
      estado_goma_delantera_izq: true,
      estado_goma_delantera_der: true,
      estado_goma_trasera_izq: true,
      estado_goma_trasera_der: true,
      estado_goma_respuesta: true,
      observaciones: ''
    })
    setIsModalOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    try {
      await supabase
        .from('inspecciones')
        .insert([formData])

      setIsModalOpen(false)
      await loadData()
    } catch (error) {
      console.error('Error saving inspeccion:', error)
    }
  }

  if (loading) {
    return <LoadingSpinner className="h-64" />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Inspecciones</h1>
       <PermissionGuard requireEdit>
         <Button onClick={openModal}>
           <Plus className="w-4 h-4 mr-2" />
           Nueva Inspección
         </Button>
       </PermissionGuard>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Buscar por vehículo, cliente o empleado..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredInspecciones.map((inspeccion) => (
          <div key={inspeccion.id} className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {inspeccion.vehiculos?.descripcion} - {inspeccion.vehiculos?.numero_placa}
                </h3>
                <p className="text-sm text-gray-600">Cliente: {inspeccion.clientes?.nombre}</p>
                <p className="text-sm text-gray-600">Inspector: {inspeccion.empleados?.nombre}</p>
              </div>
              <div className="text-sm text-gray-500">
                {new Date(inspeccion.fecha_inspeccion).toLocaleDateString('es-DO')}
              </div>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center">
                  {inspeccion.tiene_ralladuras ? (
                    <XCircle className="w-5 h-5 text-red-500 mr-2" />
                  ) : (
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                  )}
                  <span className="text-sm">Sin rayones</span>
                </div>
                
                <div className="flex items-center">
                  {inspeccion.tiene_roturas_cristal ? (
                    <XCircle className="w-5 h-5 text-red-500 mr-2" />
                  ) : (
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                  )}
                  <span className="text-sm">Cristales intactos</span>
                </div>

                <div className="flex items-center">
                  {inspeccion.tiene_goma_respuesta ? (
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500 mr-2" />
                  )}
                  <span className="text-sm">Goma de respuesta</span>
                </div>

                <div className="flex items-center">
                  {inspeccion.tiene_gato ? (
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500 mr-2" />
                  )}
                  <span className="text-sm">Gato</span>
                </div>
              </div>

              <div className="border-t pt-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Combustible:</span>
                  <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {inspeccion.cantidad_combustible}
                  </span>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm font-medium">Estado de Gomas:</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <span className={inspeccion.estado_goma_delantera_izq ? 'text-green-600' : 'text-red-600'}>
                      Del. Izq: {inspeccion.estado_goma_delantera_izq ? 'Buena' : 'Mala'}
                    </span>
                    <span className={inspeccion.estado_goma_delantera_der ? 'text-green-600' : 'text-red-600'}>
                      Del. Der: {inspeccion.estado_goma_delantera_der ? 'Buena' : 'Mala'}
                    </span>
                    <span className={inspeccion.estado_goma_trasera_izq ? 'text-green-600' : 'text-red-600'}>
                      Tra. Izq: {inspeccion.estado_goma_trasera_izq ? 'Buena' : 'Mala'}
                    </span>
                    <span className={inspeccion.estado_goma_trasera_der ? 'text-green-600' : 'text-red-600'}>
                      Tra. Der: {inspeccion.estado_goma_trasera_der ? 'Buena' : 'Mala'}
                    </span>
                  </div>
                </div>
              </div>

              {inspeccion.observaciones && (
                <div className="border-t pt-3">
                  <p className="text-sm font-medium mb-1">Observaciones:</p>
                  <p className="text-sm text-gray-600">{inspeccion.observaciones}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredInspecciones.length === 0 && (
        <div className="text-center py-12">
          <ClipboardList className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500">No se encontraron inspecciones</p>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nueva Inspección"
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Vehículo"
              value={formData.vehiculo_id}
              onChange={(e) => setFormData({ ...formData, vehiculo_id: e.target.value })}
              options={vehiculos.map(vehiculo => ({ 
                value: vehiculo.id, 
                label: `${vehiculo.descripcion} - ${vehiculo.numero_placa}` 
              }))}
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
              label="Inspector"
              value={formData.empleado_id}
              onChange={(e) => setFormData({ ...formData, empleado_id: e.target.value })}
              options={empleados.map(empleado => ({ value: empleado.id, label: empleado.nombre }))}
              required
            />
          </div>

          <div className="border rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-4">Estado General del Vehículo</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={!formData.tiene_ralladuras}
                  onChange={(e) => setFormData({ ...formData, tiene_ralladuras: !e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm">Sin rayones</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={!formData.tiene_roturas_cristal}
                  onChange={(e) => setFormData({ ...formData, tiene_roturas_cristal: !e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm">Cristales intactos</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.tiene_goma_respuesta}
                  onChange={(e) => setFormData({ ...formData, tiene_goma_respuesta: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm">Goma respuesta</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.tiene_gato}
                  onChange={(e) => setFormData({ ...formData, tiene_gato: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm">Gato</span>
              </label>
            </div>

            <div className="mt-4">
              <Select
                label="Cantidad de Combustible"
                value={formData.cantidad_combustible}
                onChange={(e) => setFormData({ ...formData, cantidad_combustible: e.target.value as '1/4' | '1/2' | '3/4' | 'Lleno' })}
                options={[
                  { value: '1/4', label: '1/4' },
                  { value: '1/2', label: '1/2' },
                  { value: '3/4', label: '3/4' },
                  { value: 'Lleno', label: 'Lleno' }
                ]}
                required
              />
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-4">Estado de las Gomas</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.estado_goma_delantera_izq}
                  onChange={(e) => setFormData({ ...formData, estado_goma_delantera_izq: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm">Delantera Izquierda</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.estado_goma_delantera_der}
                  onChange={(e) => setFormData({ ...formData, estado_goma_delantera_der: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm">Delantera Derecha</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.estado_goma_trasera_izq}
                  onChange={(e) => setFormData({ ...formData, estado_goma_trasera_izq: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm">Trasera Izquierda</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.estado_goma_trasera_der}
                  onChange={(e) => setFormData({ ...formData, estado_goma_trasera_der: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm">Trasera Derecha</span>
              </label>
            </div>

            <div className="mt-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.estado_goma_respuesta}
                  onChange={(e) => setFormData({ ...formData, estado_goma_respuesta: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm">Goma de Respuesta en buen estado</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observaciones Adicionales
            </label>
            <textarea
              value={formData.observaciones}
              onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Detalles adicionales sobre el estado del vehículo..."
            />
          </div>

          <div className="flex space-x-4 pt-6">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1">
              Crear Inspección
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}