import React, { useState, useEffect } from 'react'
import { Plus, CreditCard as Edit, Trash2, Search, Car } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useUserRole } from '../../hooks/useUserRole'
import { useTenantLimits } from '../../hooks/useTenantLimits'
import { PermissionGuard } from '../ui/PermissionGuard'
import { LimitWarning } from '../ui/LimitWarning'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Modal } from '../ui/Modal'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import { Vehiculo } from '../../types/database'

const carImages = [
  'https://images.pexels.com/photos/120049/pexels-photo-120049.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/136872/pexels-photo-136872.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/1545743/pexels-photo-1545743.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/1164778/pexels-photo-1164778.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/1335077/pexels-photo-1335077.jpeg?auto=compress&cs=tinysrgb&w=800'
]

export function Vehiculos() {
  const { canEdit, tenantId, isSuperAdmin } = useUserRole()
  const { canAddVehicle, getVehicleUsage } = useTenantLimits()
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([])
  const [filteredVehiculos, setFilteredVehiculos] = useState<Vehiculo[]>([])
  const [tiposVehiculos, setTiposVehiculos] = useState<any[]>([])
  const [marcas, setMarcas] = useState<any[]>([])
  const [modelos, setModelos] = useState<any[]>([])
  const [tiposCombustible, setTiposCombustible] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingVehiculo, setEditingVehiculo] = useState<Vehiculo | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [formData, setFormData] = useState({
    descripcion: '',
    numero_chasis: '',
    numero_motor: '',
    numero_placa: '',
    tipo_vehiculo_id: '',
    marca_id: '',
    modelo_id: '',
    tipo_combustible_id: '',
    precio_por_dia: '',
    imagen_url: ''
  })

  useEffect(() => {
    loadData()
  }, [tenantId, isSuperAdmin])

  useEffect(() => {
    filterVehiculos()
  }, [vehiculos, searchTerm])

  async function loadData() {
    try {
      let vehiculosQuery = supabase
        .from('vehiculos')
        .select(`
          *,
          tipos_vehiculos(descripcion),
          marcas(descripcion),
          modelos(descripcion),
          tipos_combustible(descripcion)
        `)
        .eq('estado', true)

      // SIEMPRE filtrar por tenant_id excepto para superadmin
      if (isSuperAdmin) {
        // Superadmin ve todos los vehículos
      } else if (tenantId) {
        vehiculosQuery = vehiculosQuery.eq('tenant_id', tenantId)
      } else {
        // Si no hay tenantId, no mostrar nada
        setVehiculos([])
        setTiposVehiculos([])
        setMarcas([])
        setModelos([])
        setTiposCombustible([])
        setLoading(false)
        return
      }

      const { data: vehiculosData } = await vehiculosQuery

      // Cargar datos de configuración con manejo de errores
      let tiposQuery = supabase.from('tipos_vehiculos').select('*').eq('estado', true)
      let marcasQuery = supabase.from('marcas').select('*').eq('estado', true)
      let modelosQuery = supabase.from('modelos').select('*, marcas(descripcion)').eq('estado', true)
      let combustiblesQuery = supabase.from('tipos_combustible').select('*').eq('estado', true)

      // Filtrar datos de configuración por tenant
      if (!isSuperAdmin && tenantId) {
        tiposQuery = tiposQuery.eq('tenant_id', tenantId)
        marcasQuery = marcasQuery.eq('tenant_id', tenantId)
        modelosQuery = modelosQuery.eq('tenant_id', tenantId)
        combustiblesQuery = combustiblesQuery.eq('tenant_id', tenantId)
      }

      const queries = await Promise.allSettled([
        tiposQuery,
        marcasQuery,
        modelosQuery,
        combustiblesQuery
      ])

      setVehiculos(vehiculosData || [])
      setTiposVehiculos(queries[0].status === 'fulfilled' ? queries[0].value.data || [] : [])
      setMarcas(queries[1].status === 'fulfilled' ? queries[1].value.data || [] : [])
      setModelos(queries[2].status === 'fulfilled' ? queries[2].value.data || [] : [])
      setTiposCombustible(queries[3].status === 'fulfilled' ? queries[3].value.data || [] : [])
    } catch (error) {
      console.error('Error loading data:', error)
      setVehiculos([])
    } finally {
      setLoading(false)
    }
  }

  function filterVehiculos() {
    if (!searchTerm) {
      setFilteredVehiculos(vehiculos)
    } else {
      const filtered = vehiculos.filter(vehiculo =>
        vehiculo.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehiculo.numero_placa.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehiculo.numero_chasis.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehiculo.marcas?.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehiculo.modelos?.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredVehiculos(filtered)
    }
  }

  function openModal(vehiculo?: Vehiculo) {
    if (!vehiculo && !canAddVehicle()) {
      alert('Has alcanzado el límite de vehículos para tu plan actual. Actualiza tu plan para agregar más vehículos.')
      return
    }

    if (vehiculo) {
      setEditingVehiculo(vehiculo)
      setFormData({
        descripcion: vehiculo.descripcion,
        numero_chasis: vehiculo.numero_chasis,
        numero_motor: vehiculo.numero_motor,
        numero_placa: vehiculo.numero_placa,
        tipo_vehiculo_id: vehiculo.tipo_vehiculo_id || '',
        marca_id: vehiculo.marca_id || '',
        modelo_id: vehiculo.modelo_id || '',
        tipo_combustible_id: vehiculo.tipo_combustible_id || '',
        precio_por_dia: vehiculo.precio_por_dia.toString(),
        imagen_url: vehiculo.imagen_url || ''
      })
    } else {
      setEditingVehiculo(null)
      setFormData({
        descripcion: '',
        numero_chasis: '',
        numero_motor: '',
        numero_placa: '',
        tipo_vehiculo_id: '',
        marca_id: '',
        modelo_id: '',
        tipo_combustible_id: '',
        precio_por_dia: '',
        imagen_url: carImages[Math.floor(Math.random() * carImages.length)]
      })
    }
    setIsModalOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!editingVehiculo && !canAddVehicle()) {
      alert('Has alcanzado el límite de vehículos para tu plan actual.')
      return
    }
    
    try {
      const vehiculoData = {
        descripcion: formData.descripcion,
        numero_chasis: formData.numero_chasis,
        numero_motor: formData.numero_motor,
        numero_placa: formData.numero_placa,
        tipo_vehiculo_id: formData.tipo_vehiculo_id || null,
        marca_id: formData.marca_id || null,
        modelo_id: formData.modelo_id || null,
        tipo_combustible_id: formData.tipo_combustible_id || null,
        precio_por_dia: parseFloat(formData.precio_por_dia) || 0,
        imagen_url: formData.imagen_url || null,
        tenant_id: tenantId
      }

      if (editingVehiculo) {
        await supabase
          .from('vehiculos')
          .update(vehiculoData)
          .eq('id', editingVehiculo.id)
      } else {
        await supabase
          .from('vehiculos')
          .insert([vehiculoData])
      }

      setIsModalOpen(false)
      await loadData()
    } catch (error) {
      console.error('Error saving vehiculo:', error)
    }
  }

  async function deleteVehiculo(id: string) {
    if (confirm('¿Está seguro de eliminar este vehículo?')) {
      try {
        await supabase
          .from('vehiculos')
          .update({ estado: false })
          .eq('id', id)
        
        await loadData()
      } catch (error) {
        console.error('Error deleting vehiculo:', error)
      }
    }
  }

  const vehicleUsage = getVehicleUsage()

  if (loading) {
    return <LoadingSpinner className="h-64" />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Vehículos</h1>
        <PermissionGuard requireEdit>
          <Button onClick={() => openModal()}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Vehículo
          </Button>
        </PermissionGuard>
      </div>

      <div className="space-y-4">
        {!isSuperAdmin && vehicleUsage.max > 0 && vehicleUsage.percentage >= 80 && (
          <LimitWarning
            type="vehicle"
            current={vehicleUsage.current}
            max={vehicleUsage.max}
          />
        )}
        
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Buscar por descripción, placa, chasis, marca o modelo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVehiculos.map((vehiculo) => (
          <div key={vehiculo.id} className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
            <div className="h-48 bg-gray-200 relative">
              {vehiculo.imagen_url ? (
                <img 
                  src={vehiculo.imagen_url} 
                  alt={vehiculo.descripcion}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = carImages[0]
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Car className="w-16 h-16 text-gray-400" />
                </div>
              )}
              <div className="absolute top-4 right-4">
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  vehiculo.disponible 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {vehiculo.disponible ? 'Disponible' : 'No Disponible'}
                </span>
              </div>
            </div>
            
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{vehiculo.descripcion}</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p><span className="font-medium">Placa:</span> {vehiculo.numero_placa}</p>
                <p><span className="font-medium">Chasis:</span> {vehiculo.numero_chasis}</p>
                <p><span className="font-medium">Motor:</span> {vehiculo.numero_motor}</p>
                {vehiculo.marcas && <p><span className="font-medium">Marca:</span> {vehiculo.marcas.descripcion}</p>}
                {vehiculo.modelos && <p><span className="font-medium">Modelo:</span> {vehiculo.modelos.descripcion}</p>}
                {vehiculo.tipos_vehiculos && <p><span className="font-medium">Tipo:</span> {vehiculo.tipos_vehiculos.descripcion}</p>}
                {vehiculo.tipos_combustible && <p><span className="font-medium">Combustible:</span> {vehiculo.tipos_combustible.descripcion}</p>}
                <p><span className="font-medium">Precio/día:</span> ${vehiculo.precio_por_dia.toFixed(2)}</p>
              </div>
              
              <PermissionGuard requireEdit>
                <div className="flex space-x-2 mt-4">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => openModal(vehiculo)}
                    className="flex-1"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => deleteVehiculo(vehiculo.id)}
                    className="flex-1"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Eliminar
                  </Button>
                </div>
              </PermissionGuard>
            </div>
          </div>
        ))}
      </div>

      {filteredVehiculos.length === 0 && (
        <div className="text-center py-12">
          <Car className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500">No se encontraron vehículos</p>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingVehiculo ? 'Editar Vehículo' : 'Nuevo Vehículo'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Descripción"
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              required
            />
            <Input
              label="Precio por Día ($)"
              type="number"
              step="0.01"
              value={formData.precio_por_dia}
              onChange={(e) => setFormData({ ...formData, precio_por_dia: e.target.value })}
              required
            />
            <Input
              label="Número de Chasis"
              value={formData.numero_chasis}
              onChange={(e) => setFormData({ ...formData, numero_chasis: e.target.value })}
              required
            />
            <Input
              label="Número de Motor"
              value={formData.numero_motor}
              onChange={(e) => setFormData({ ...formData, numero_motor: e.target.value })}
              required
            />
            <Input
              label="Número de Placa"
              value={formData.numero_placa}
              onChange={(e) => setFormData({ ...formData, numero_placa: e.target.value })}
              required
            />
            <Input
              label="URL de Imagen"
              value={formData.imagen_url}
              onChange={(e) => setFormData({ ...formData, imagen_url: e.target.value })}
              placeholder="https://..."
            />
          </div>

          {tiposVehiculos.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Tipo de Vehículo"
                value={formData.tipo_vehiculo_id}
                onChange={(e) => setFormData({ ...formData, tipo_vehiculo_id: e.target.value })}
                options={tiposVehiculos.map(tipo => ({ value: tipo.id, label: tipo.descripcion }))}
              />
              <Select
                label="Tipo de Combustible"
                value={formData.tipo_combustible_id}
                onChange={(e) => setFormData({ ...formData, tipo_combustible_id: e.target.value })}
                options={tiposCombustible.map(tipo => ({ value: tipo.id, label: tipo.descripcion }))}
              />
            </div>
          )}

          {marcas.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Marca"
                value={formData.marca_id}
                onChange={(e) => setFormData({ ...formData, marca_id: e.target.value })}
                options={marcas.map(marca => ({ value: marca.id, label: marca.descripcion }))}
              />
              <Select
                label="Modelo"
                value={formData.modelo_id}
                onChange={(e) => setFormData({ ...formData, modelo_id: e.target.value })}
                options={modelos
                  .filter(modelo => !formData.marca_id || modelo.marca_id === formData.marca_id)
                  .map(modelo => ({ value: modelo.id, label: modelo.descripcion }))}
              />
            </div>
          )}

          <div className="flex space-x-4 pt-6">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1">
              {editingVehiculo ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}