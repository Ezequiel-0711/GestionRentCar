
import React from 'react'
import { 
  Car, 
  Users, 
  UserCheck, 
  FileText, 
  BarChart3, 
  Settings,
  Home,
  ClipboardList
} from 'lucide-react'

interface NavigationProps {
  activeSection: string
  onSectionChange: (section: string) => void
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'vehiculos', label: 'Vehículos', icon: Car },
  { id: 'clientes', label: 'Clientes', icon: Users },
  { id: 'empleados', label: 'Empleados', icon: UserCheck },
  { id: 'inspecciones', label: 'Inspecciones', icon: ClipboardList },
  { id: 'rentas', label: 'Rentas', icon: FileText },
  { id: 'reportes', label: 'Reportes', icon: BarChart3 },
  { id: 'configuracion', label: 'Configuración', icon: Settings },
]

export function Navigation({ activeSection, onSectionChange }: NavigationProps) {
  return (
    <nav className="w-64 bg-gradient-to-b from-blue-600 to-blue-800 text-white h-screen fixed left-0 top-0 overflow-y-auto">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-white mb-8">RentCar Pro</h1>
        
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <li key={item.id}>
                <button
                  onClick={() => onSectionChange(item.id)}
                  className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${
                    activeSection === item.id
                      ? 'bg-white text-blue-700 shadow-lg'
                      : 'text-blue-100 hover:bg-blue-700 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.label}
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}