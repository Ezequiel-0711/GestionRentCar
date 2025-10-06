import React from 'react'
import { Vehiculos } from '../sections/Vehiculos'
import { Clientes } from '../sections/Clientes'
import { Empleados } from '../sections/Empleados'
import { Inspecciones } from '../sections/Inspecciones'
import { Rentas } from '../sections/Rentas'
import { Reportes } from '../sections/Reportes'
import { Configuracion } from '../sections/Configuracion'
import SuperAdminDashboard from '../sections/SuperAdminDashboard'
import AdminDashboard from '../sections/AdminDashboard'
import { Dashboard } from '../sections/Dashboard'

interface SectionRendererProps {
  activeSection: string
  userRole: string
}

export function SectionRenderer({ activeSection, userRole }: SectionRendererProps) {
  if (userRole === 'superadmin') {
    switch (activeSection) {
      case 'dashboard':
        return <SuperAdminDashboard />
      case 'vehiculos':
        return <Vehiculos />
      case 'clientes':
        return <Clientes />
      case 'empleados':
        return <Empleados />
      case 'inspecciones':
        return <Inspecciones />
      case 'rentas':
        return <Rentas />
      case 'reportes':
        return <Reportes />
      case 'configuracion':
        return <Configuracion />
      default:
        return <SuperAdminDashboard />
    }
  } else {
    switch (activeSection) {
      case 'dashboard':
        return userRole === 'admin' ? <AdminDashboard /> : <Dashboard />
      case 'vehiculos':
        return <Vehiculos />
      case 'clientes':
        return <Clientes />
      case 'empleados':
        return <Empleados />
      case 'inspecciones':
        return <Inspecciones />
      case 'rentas':
        return <Rentas />
      case 'reportes':
        return <Reportes />
      case 'configuracion':
        return <Configuracion />
      default:
        return userRole === 'admin' ? <AdminDashboard /> : <Dashboard />
    }
  }
}