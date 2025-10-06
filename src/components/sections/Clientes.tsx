import React, { useState, useEffect } from 'react'
import { Plus, CreditCard as Edit, Trash2, Search, Users } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { formatCedula, getValidationMessage } from '../../utils/validators'
import { useUserRole } from '../../hooks/useUserRole'
import { useTenantLimits } from '../../hooks/useTenantLimits'
import { PermissionGuard } from '../ui/PermissionGuard'
import { LimitWarning } from '../ui/LimitWarning'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Modal } from '../ui/Modal'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import { Cliente } from '../../types/database'

export function Clientes() {
  const { canEdit, tenantId, isSuperAdmin } = useUserRole()
  const { canAddClient, getClientUsage } = useTenantLimits()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [filteredClientes, setFilteredClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({})
  const [formData, setFormData] = useState({
    nombre: '',
    cedula: '',
    numero_tarjeta_credito: '',
    limite_credito: '',
    tipo_persona: 'Física' as 'Física' | 'Jurídica',
    telefono: '',
    direccion: ''
  })

  useEffect(() => {
    loadClientes()
  }, [tenantId, isSuperAdmin])

  useEffect(() => {
    filterClientes()
  }, [clientes, searchTerm])

  async function loadClientes() {
    try {
      let query = supabase
        .from('clientes')
  .select('*')
  .eq('estado', true)
  .order('nombre')
      
      // Solo filtrar por tenant_id si no es superadmin Y si tenantId existe
      if (!isSuperAdmin && tenantId) {
        query = query.eq('tenant_id', tenantId)
      }
      
      const { data } = await query
      
      console.log('Clientes cargados:', data?.length || 0, 'tenantId:', tenantId, 'isSuperAdmin:', isSuperAdmin)
      console.log('Query aplicada:', !isSuperAdmin && tenantId ? 'CON filtro tenant_id' : 'SIN filtro tenant_id')
      console.log('Datos de clientes:', data)
      setClientes(data || [])
    } catch (error) {
      console.error('Error loading clientes:', error)
      // En caso de error, establecer array vacío para evitar problemas
      setClientes([])
    } finally {
      setLoading(false)
    }
  }

  function filterClientes() {
    if (!searchTerm) {
      setFilteredClientes(clientes)
    } else {
      const filtered = clientes.filter(cliente =>
        cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cliente.cedula.includes(searchTerm) ||
        cliente.telefono?.includes(searchTerm)
      )
      setFilteredClientes(filtered)
    }
  }

  function openModal(cliente?: Cliente) {
    if (!cliente && !canAddClient()) {
      alert('Has alcanzado el límite de clientes para tu plan actual. Actualiza tu plan para agregar más clientes.')
      return
    }
    
    if (cliente) {
      setEditingCliente(cliente)
      setFormData({
        nombre: cliente.nombre,
        cedula: cliente.cedula,
        numero_tarjeta_credito: cliente.numero_tarjeta_credito || '',
        limite_credito: cliente.limite_credito.toString(),
        tipo_persona: cliente.tipo_persona,
        telefono: cliente.telefono || '',
        direccion: cliente.direccion || ''
      })
    } else {
      setEditingCliente(null)
      setFormData({
        nombre: '',
        cedula: '',
        numero_tarjeta_credito: '',
        limite_credito: '0',
        tipo_persona: 'Física',
        telefono: '',
        direccion: ''
      })
    }
    setIsModalOpen(true)
  }

  function validateForm(): boolean {
    const errors: {[key: string]: string} = {}
    
    if (!formData.nombre.trim()) {
      errors.nombre = 'El nombre es requerido'
    }
    
    const cedulaError = getValidationMessage('cedula', formData.cedula)
    if (cedulaError) {
      errors.cedula = cedulaError
    }
    
    if (formData.numero_tarjeta_credito && formData.numero_tarjeta_credito.length > 0) {
      if (formData.numero_tarjeta_credito.length < 13 || formData.numero_tarjeta_credito.length > 19) {
        errors.numero_tarjeta_credito = 'Número de tarjeta inválido (13-19 dígitos)'
      }
    }
    
    if (formData.telefono && formData.telefono.length > 0) {
      if (!/^\d{10}$/.test(formData.telefono.replace(/[-\s()]/g, ''))) {
        errors.telefono = 'Teléfono debe tener 10 dígitos'
      }
    }
    
    const limiteError = getValidationMessage('limite_credito', formData.limite_credito)
    if (limiteError) {
      errors.limite_credito = limiteError
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    if (!editingCliente && !canAddClient()) {
      alert('Has alcanzado el límite de clientes para tu plan actual.')
      return
    }
    
    try {
      // Check for duplicate cedula
      const { data: existingCliente } = await supabase
        .from('clientes')
        .select('id')
        .eq('cedula', formData.cedula)
      
      if (existingCliente && existingCliente.length > 0) {
        // If editing, check if the cedula belongs to a different client
        if (editingCliente && existingCliente[0].id !== editingCliente.id) {
          alert('Ya existe un cliente con esta cédula.')
          return
        }
        // If creating new client, cedula already exists
        if (!editingCliente) {
          alert('Ya existe un cliente con esta cédula.')
          return
        }
      }
      
      const clienteData = {
        nombre: formData.nombre,
        cedula: formData.cedula,
        numero_tarjeta_credito: formData.numero_tarjeta_credito || null,
        limite_credito: parseFloat(formData.limite_credito) || 0,
        tipo_persona: formData.tipo_persona,
        telefono: formData.telefono || null,
        direccion: formData.direccion || null,
        tenant_id: tenantId || null
      }

      console.log('Guardando cliente con datos:', clienteData)

      if (editingCliente) {
        const { error } = await supabase
          .from('clientes')
          .update(clienteData)
          .eq('id', editingCliente.id)
        
        if (error) {
          console.error('Error updating cliente:', error)
          throw error
        }
        console.log('Cliente actualizado exitosamente')
      } else {
        const { data, error } = await supabase
          .from('clientes')
          .insert([clienteData])
          .select()
        
        if (error) {
          console.error('Error creating cliente:', error)
          throw error
        }
        
        console.log('Cliente creado exitosamente:', data)
      }

      setIsModalOpen(false)
      setFormErrors({})
      
      // Forzar recarga después de un pequeño delay para asegurar que la DB se actualice
      setTimeout(() => {
        loadClientes()
      }, 100)
      
      await loadClientes()
    } catch (error) {
      console.error('Error saving cliente:', error)
      if (error.message?.includes('duplicate key')) {
        alert('Ya existe un cliente con esta cédula.')
      } else {
        alert('Error al guardar el cliente: ' + error.message)
      }
    }
  }

  async function deleteCliente(id: string) {
    if (confirm('¿Está seguro de eliminar este cliente?')) {
      try {
        await supabase
          .from('clientes')
          .update({ estado: false })
          .eq('id', id)
        
        await loadClientes()
      } catch (error) {
        console.error('Error deleting cliente:', error)
      }
    }
  }

  async function restoreCliente(id: string) {
    if (confirm('¿Está seguro de restaurar este cliente?')) {
      try {
        await supabase
          .from('clientes')
          .update({ estado: true })
          .eq('id', id)
        
        await loadClientes()
      } catch (error) {
        console.error('Error restoring cliente:', error)
      }
    }
  }
  const clientUsage = getClientUsage()

  if (loading) {
    return <LoadingSpinner className="h-64" />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Clientes</h1>
        <PermissionGuard requireEdit>
          <Button onClick={() => openModal()}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Cliente
          </Button>
        </PermissionGuard>
      </div>

      <div className="space-y-4">
        {!isSuperAdmin && clientUsage.max > 0 && clientUsage.percentage >= 80 && (
          <LimitWarning
            type="client"
            current={clientUsage.current}
            max={clientUsage.max}
          />
        )}
        
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Buscar por nombre, cédula o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cédula
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Límite Crédito
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Teléfono
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredClientes.map((cliente) => (
                <tr key={cliente.id} className={`hover:bg-gray-50 ${!cliente.estado ? 'opacity-50 bg-red-50' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {cliente.nombre}
                      {!cliente.estado && <span className="ml-2 text-xs text-red-600 font-semibold">(ELIMINADO)</span>}
                    </div>
                    {cliente.direccion && (
                      <div className="text-sm text-gray-500">{cliente.direccion}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {cliente.cedula}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      cliente.tipo_persona === 'Física' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {cliente.tipo_persona}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${cliente.limite_credito.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {cliente.telefono || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <PermissionGuard requireEdit>
                      <div className="flex space-x-2">
                        {cliente.estado ? (
                          <>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => openModal(cliente)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => deleteCliente(cliente.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            variant="success"
                            onClick={() => restoreCliente(cliente.id)}
                          >
                            Restaurar
                          </Button>
                        )}
                      </div>
                    </PermissionGuard>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredClientes.length === 0 && (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500">No se encontraron clientes</p>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCliente ? 'Editar Cliente' : 'Nuevo Cliente'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nombre Completo"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              required
              error={formErrors.nombre}
            />
            <Input
              label="Cédula"
              value={formData.cedula}
              onChange={(e) => {
                const formatted = formatCedula(e.target.value)
                setFormData({ ...formData, cedula: formatted })
              }}
              onValidate={(value) => getValidationMessage('cedula', value)}
              validateOnBlur={true}
              error={formErrors.cedula}
              placeholder="000-0000000-0"
              maxLength={13}
              required
            />
            <Select
              label="Tipo de Persona"
              value={formData.tipo_persona}
              onChange={(e) => setFormData({ ...formData, tipo_persona: e.target.value as 'Física' | 'Jurídica' })}
              options={[
                { value: 'Física', label: 'Física' },
                { value: 'Jurídica', label: 'Jurídica' }
              ]}
              required
            />
            <Input
              label="Límite de Crédito ($)"
              type="number"
              step="0.01"
             min="0"
              value={formData.limite_credito}
              onChange={(e) => setFormData({ ...formData, limite_credito: e.target.value })}
              error={formErrors.limite_credito}
              required
            />
            <Input
              label="Número de Tarjeta de Crédito"
              value={formData.numero_tarjeta_credito}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '')
                setFormData({ ...formData, numero_tarjeta_credito: value })
              }}
              error={formErrors.numero_tarjeta_credito}
              placeholder="Solo números"
              maxLength={19}
            />
            <Input
              label="Teléfono"
              value={formData.telefono}
              onChange={(e) => {
                const value = e.target.value.replace(/[^\d\-\s()]/g, '')
                setFormData({ ...formData, telefono: value })
              }}
              error={formErrors.telefono}
              placeholder="809-000-0000"
            />
          </div>
          <Input
            label="Dirección"
            value={formData.direccion}
            onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
          />

          <div className="flex space-x-4 pt-6">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1">
              {editingCliente ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}