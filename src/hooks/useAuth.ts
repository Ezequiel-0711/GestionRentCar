import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useAuth() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string>('empleado')

  useEffect(() => {
    // Verificar sesión existente
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        checkUserRole(session.user)
      }
      setLoading(false)
    })

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        checkUserRole(session.user)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  async function checkUserRole(user: any) {
    try {
      // Verificar si es superadmin
      if (user.email === 'superadmin@rentcar.com') {
        setUserRole('superadmin')
        return
      }

      // Para otros usuarios, asignar rol admin por defecto
      setUserRole('admin')
    } catch (error) {
      console.error('Error checking user role:', error)
      setUserRole('empleado')
    }
  }

  return {
    user,
    userRole,
    loading,
    setUserRole
  }
}