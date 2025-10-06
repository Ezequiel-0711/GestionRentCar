import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export type UserRole = 'superadmin' | 'admin' | 'empleado' | 'solo_lectura'

export function useUserRole() {
  const [userRole, setUserRole] = useState<UserRole>('solo_lectura')
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function getUserRole() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          setUserRole('solo_lectura')
          setIsSuperAdmin(false)
          setLoading(false)
          return
        }

        // Verificar si es superadmin
        if (user.email === 'superadmin@rentcar.com') {
          setUserRole('superadmin')
          setIsSuperAdmin(true)
          setLoading(false)
          return
        }

        // Obtener rol y tenant del usuario
        const { data, error } = await supabase
          .from('tenant_users')
          .select('role, tenant_id, tenants(name)')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .single()

        if (error || !data) {
          // Si la tabla no existe o no hay datos, usar rol por defecto
          if (error?.message?.includes('Could not find the table')) {
            console.warn('Sistema en modo de compatibilidad: tablas multi-tenant no configuradas')
            setUserRole('admin') // Rol por defecto para compatibilidad
            setTenantId(null)
            setIsSuperAdmin(false)
          } else {
            console.warn('Usuario no asignado a ninguna empresa:', error?.message)
            setUserRole('empleado') // Rol por defecto si no está asignado
            setTenantId(null)
            setIsSuperAdmin(false)
          }
        } else {
          setUserRole(data.role as UserRole)
          setTenantId(data.tenant_id)
          setIsSuperAdmin(false)
        }
      } catch (error) {
        console.error('Error getting user role:', error)
        setUserRole('empleado')
        setTenantId(null)
        setIsSuperAdmin(false)
      } finally {
        setLoading(false)
      }
    }

    getUserRole()
  }, [])

  const isAdmin = userRole === 'admin' || isSuperAdmin
  const canEdit = userRole === 'admin' || userRole === 'empleado' || isSuperAdmin
  const isReadOnly = userRole === 'solo_lectura'

  return {
    userRole,
    tenantId,
    loading,
    isSuperAdmin,
    isAdmin,
    canEdit,
    isReadOnly
  }
}