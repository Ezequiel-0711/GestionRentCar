import React, { useState, useEffect } from 'react'
import { Plus, CreditCard as Edit, Trash2, Settings } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useUserRole } from '../../hooks/useUserRole'
import { PermissionGuard } from '../ui/PermissionGuard'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Modal } from '../ui/Modal'
import { LoadingSpinner } from '../ui/LoadingSpinner'

interface ConfigItem {
  id: string
  descripcion: string
  estado: boolean
}

export function Configuracion() {
  const { isAdmin, tenantId, isSuperAdmin } = useUserRole()
  const [activeTab, setActiveTab] = useState('tipos')
  const [items, setItems] = useState<ConfigItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ConfigItem | null>(null)
  const [formData, setFormData] = useState({ descripcion: '' })

  const tabs = [
    { id: 'tipos', label: 'Tipos de Vehículos', table: 'tipos_vehiculos' },
    { id: 'marcas', label: 'Marcas', table: 'marcas' },
    { id: 'modelos', label: 'Modelos', table: 'modelos' },
    { id: 'combustibles', label: 'Tipos de Combustible', table: 'tipos_combustible' }
  ]

  const currentTab = tabs.find(tab => tab.id === activeTab)!

  useEffect(() => {
    loadItems()
  }, [activeTab])

  async function loadItems() {
    setLoading(true)
    try {
      let query = supabase.from(currentTab.table).select('*').eq('estado', true)
      
      if (currentTab.id === 'modelos') {
        query = query.select('*, marcas(descripcion)')
      }
      
      if (!isSuperAdmin && tenantId) {
        query = query.eq('tenant_id', tenantId)
      }
      
      const { data } = await query
      setItems(data || [])
    } catch (error) {
      console.error('Error loading items:', error)
    } finally {
      setLoading(false)
    }
  }

  function openModal(item?: ConfigItem) {
    if (item) {
      setEditingItem(item)
      setFormData({ descripcion: item.descripcion })
    } else {
      setEditingItem(null)
      setFormData({ descripcion: '' })
    }
    setIsModalOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    try {
      if (editingItem) {
        await supabase
          .from(currentTab.table)
          .update({ ...formData, tenant_id: tenantId })
          .eq('id', editingItem.id)
      } else {
        await supabase
          .from(currentTab.table)
          .insert([{ ...formData, tenant_id: tenantId }])
      }

      setIsModalOpen(false)
      await loadItems()
    } catch (error) {
      console.error('Error saving item:', error)
    }
  }

  async function deleteItem(id: string) {
    if (confirm('¿Está seguro de eliminar este elemento?')) {
      try {
        await supabase
          .from(currentTab.table)
          .update({ estado: false })
          .eq('id', id)
        
        await loadItems()
      } catch (error) {
        console.error('Error deleting item:', error)
      }
    }
  }

  if (loading) {
    return <LoadingSpinner className="h-64" />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Configuración del Sistema</h1>
        <PermissionGuard requireAdmin>
          <Button onClick={() => openModal()}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo {currentTab.label.slice(0, -1)}
          </Button>
        </PermissionGuard>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {items.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((item) => (
                <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">{item.descripcion}</h3>
                      {(item as any).marcas && (
                        <p className="text-sm text-gray-600">Marca: {(item as any).marcas.descripcion}</p>
                      )}
                    </div>
                    <PermissionGuard requireAdmin>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => openModal(item)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => deleteItem(item.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </PermissionGuard>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Settings className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">No hay elementos configurados</p>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? `Editar ${currentTab.label.slice(0, -1)}` : `Nuevo ${currentTab.label.slice(0, -1)}`}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Descripción"
            value={formData.descripcion}
            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
            required
            autoFocus
          />

          <div className="flex space-x-4 pt-6">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1">
              {editingItem ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}