import React from 'react'
import { useUserRole } from '../../hooks/useUserRole'
import { Shield, Lock } from 'lucide-react'

interface PermissionGuardProps {
  children: React.ReactNode
  requireAdmin?: boolean
  requireEdit?: boolean
  fallback?: React.ReactNode
}

export function PermissionGuard({ 
  children, 
  requireAdmin = false, 
  requireEdit = false,
  fallback 
}: PermissionGuardProps) {
  const { isAdmin, canEdit, isReadOnly, loading } = useUserRole()

  if (loading) {
    return <div className="animate-pulse bg-gray-200 h-8 rounded"></div>
  }

  // Si requiere admin y no es admin
  if (requireAdmin && !isAdmin) {
    return fallback || (
      <div className="flex items-center text-gray-500 text-sm">
        <Shield className="w-4 h-4 mr-1" />
        Solo administradores
      </div>
    )
  }

  // Si requiere edición y es solo lectura
  if (requireEdit && isReadOnly) {
    return fallback || (
      <div className="flex items-center text-gray-500 text-sm">
        <Lock className="w-4 h-4 mr-1" />
        Sin permisos de edición
      </div>
    )
  }

  return <>{children}</>
}