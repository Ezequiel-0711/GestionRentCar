import React from 'react'
import { LogOut } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Button } from '../ui/Button'

interface HeaderProps {
  user: any
  userRole: string
}

export function Header({ user, userRole }: HeaderProps) {
  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'superadmin':
        return 'Superadmin'
      case 'admin':
        return 'Administrador'
      case 'empleado':
        return 'Empleado'
      default:
        return 'Usuario'
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'superadmin':
        return 'bg-purple-100 text-purple-800'
      case 'admin':
        return 'bg-blue-100 text-blue-800'
      case 'empleado':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 p-4 flex justify-between items-center">
      <div className="text-sm text-gray-600">
        {userRole === 'superadmin' ? 'Panel de Superadmin' : 'Sistema RentCar'}
        <span className={`ml-2 px-2 py-1 rounded-full text-xs ${getRoleColor(userRole)}`}>
          {getRoleLabel(userRole)}
        </span>
      </div>
      <div className="flex items-center space-x-4">
        <span className="text-sm text-gray-600">{user.email}</span>
        <Button size="sm" variant="secondary" onClick={handleLogout}>
          <LogOut className="w-4 h-4 mr-2" />
          Cerrar Sesión
        </Button>
      </div>
    </header>
  )
}