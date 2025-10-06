import React, { useState, useEffect } from 'react'
import { Plus, CreditCard as Edit, Trash2, Search, UserCheck } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useUserRole } from '../../hooks/useUserRole'
import { useTenantLimits } from '../../hooks/useTenantLimits'
import { validateDominicanCedula, formatCedula, getValidationMessage } from '../../utils/validators'
import { PermissionGuard } from '../ui/PermissionGuard'
import { LimitWarning } from '../ui/LimitWarning'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Modal } from '../ui/Modal'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import { Empleado } from '../../types/database'

export function Empleados() {
  const { isAdmin, tenantId, isSuperAdmin } = useUserRole()
  const { canAddEmployee, getEmployeeUsage } = useTenantLimits()
  const [empleados, setEmpleados] = useState<Empleado[]>([])
  const [filteredEmpleados, setFilteredEmpleados] = useState<Empleado[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEmpleado, setEditingEmpleado] = useState<Empleado | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({})
  const [formData, setFormData] = useState({
    nombre: '',
    cedula: '',
    tanda_labor: 'Matutina' as 'Matutina' | 'Vespertina' | 'Nocturna',
    porciento_comision: '',
    fecha_ingreso: '',
    telefono: '',
    direccion: ''
  })

  useEffect(() => {
    loadEmpleados()
  }, [])

  useEffect(() => {
    filterEmpleados()
  }, [empleados, searchTerm])

  async function loadEmpleados() {
    try {
      let query = supabase
        .from('empleados')
        .select('*')
        .eq('estado', true)
        .order('nombre')
      
      if (!isSuperAdmin && tenantId) {
        query = query.eq('tenant_id', tenantId)
      }
      
      const { data } = await query
      
      setEmpleados(data || [])
    } catch (error) {
      console.error('Error loading empleados:', error)
    } finally {
      setLoading(false)
    }
  }

  function filterEmpleados() {
    if (!searchTerm) {
      setFilteredEmpleados(empleados)
    } else {
      const filtered = empleados.filter(empleado =>
        empleado.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        empleado.cedula.includes(searchTerm) ||
        empleado.telefono?.includes(searchTerm)
      )
      setFilteredEmpleados(filtered)
    }
  }

  function openModal(empleado?: Empleado) {
    if (!empleado && !canAddEmployee()) {
      alert('Has alcanzado el límite de empleados para tu plan actual. Actualiza tu plan para agregar más empleados.')
      return
    }
    
    if (empleado) {
      setEditingEmpleado(empleado)
      setFormData({
        nombre: empleado.nombre,
        cedula: empleado.cedula,
        tanda_labor: empleado.tanda_labor,
        porciento_comision: empleado.porciento_comision.toString(),
        fecha_ingreso: empleado.fecha_ingreso,
        telefono: empleado.telefono || '',
        direccion: empleado.direccion || ''
      })
    } else {
      setEditingEmpleado(null)
      setFormData({
        nombre: '',
        cedula: '',
        tanda_labor: 'Matutina',
        porciento_comision: '0',
        fecha_ingreso: new Date().toISOString().split('T')[0],
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
    
    if (formData.telefono && formData.telefono.length > 0) {
      if (!/^\d{10}$/.test(formData.telefono.replace(/[-\s()]/g, ''))) {
        errors.telefono = 'Teléfono debe tener 10 dígitos'
      }
    }
    
    const comision = parseFloat(formData.porciento_comision)
    if (isNaN(comision) || comision < 0 || comision > 100) {
      errors.porciento_comision = 'Comisión debe estar entre 0 y 100'
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    if (!editingEmpleado && !canAddEmployee()) {
      alert('Has alcanzado el límite de empleados para tu plan actual.')
      return
    }
    
    try {
      const empleadoData = {
        ...formData,
        porciento_comision: parseFloat(formData.porciento_comision) || 0,
        tenant_id: tenantId
      }

      if (editingEmpleado) {
        await supabase
          .from('empleados')
          .update(empleadoData)
          .eq('id', editingEmpleado.id)
      } else {
        await supabase
          .from('empleados')
          .insert([empleadoData])
      }

      setIsModalOpen(false)
      await loadEmpleados()
    } catch (error) {
      console.error('Error saving empleado:', error)
    }
  }

  async function deleteEmpleado(id: string) {
    if (confirm('¿Está seguro de eliminar este empleado?')) {
      try {
        await supabase
          .from('empleados')
          .update({ estado: false })
          .eq('id', id)
        
        await loadEmpleados()
      } catch (error) {
        console.error('Error deleting empleado:', error)
      }
    }
  }

  const employeeUsage = getEmployeeUsage()

  if (loading) {
    return <LoadingSpinner className="h-64" />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Empleados</h1>
        <PermissionGuard requireAdmin>
          <Button onClick={() => openModal()}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Empleado
          </Button>
        </PermissionGuard>
      </div>

      <div className="flex items-center space-x-4">
        {!isSuperAdmin && employeeUsage.max > 0 && employeeUsage.percentage >= 80 && (
          <LimitWarning
            type="employee"
            current={employeeUsage.current}
            max={employeeUsage.max}
          />
        )}
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

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Empleado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cédula
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tanda
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Comisión
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha Ingreso
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
              {filteredEmpleados.map((empleado) => (
                <tr key={empleado.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{empleado.nombre}</div>
                    {empleado.direccion && (
                      <div className="text-sm text-gray-500">{empleado.direccion}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {empleado.cedula}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      empleado.tanda_labor === 'Matutina' 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : empleado.tanda_labor === 'Vespertina'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {empleado.tanda_labor}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {empleado.porciento_comision}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(empleado.fecha_ingreso).toLocaleDateString('es-DO')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {empleado.telefono || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <PermissionGuard requireAdmin>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => openModal(empleado)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => deleteEmpleado(empleado.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </PermissionGuard>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredEmpleados.length === 0 && (
        <div className="text-center py-12">
          <UserCheck className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500">No se encontraron empleados</p>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingEmpleado ? 'Editar Empleado' : 'Nuevo Empleado'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nombre Completo"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              error={formErrors.nombre}
              required
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
              label="Tanda Laboral"
              value={formData.tanda_labor}
              onChange={(e) => setFormData({ ...formData, tanda_labor: e.target.value as 'Matutina' | 'Vespertina' | 'Nocturna' })}
              options={[
                { value: 'Matutina', label: 'Matutina' },
                { value: 'Vespertina', label: 'Vespertina' },
                { value: 'Nocturna', label: 'Nocturna' }
              ]}
              required
            />
            <Input
              label="Porcentaje de Comisión (%)"
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={formData.porciento_comision}
              onChange={(e) => setFormData({ ...formData, porciento_comision: e.target.value })}
              error={formErrors.porciento_comision}
              required
            />
            <Input
              label="Fecha de Ingreso"
              type="date"
              value={formData.fecha_ingreso}
              onChange={(e) => setFormData({ ...formData, fecha_ingreso: e.target.value })}
              required
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
              {editingEmpleado ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}