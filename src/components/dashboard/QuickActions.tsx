import React from 'react';
import { Car, Users, FileText, TrendingUp } from 'lucide-react';

export function QuickActions() {
  const actions = [
    {
      title: 'Nuevo Vehículo',
      description: 'Agregar vehículo',
      icon: Car,
      color: 'bg-blue-50 hover:bg-blue-100 text-blue-700',
      section: 'vehiculos'
    },
    {
      title: 'Nuevo Cliente',
      description: 'Registrar cliente',
      icon: Users,
      color: 'bg-green-50 hover:bg-green-100 text-green-700',
      section: 'clientes'
    },
    {
      title: 'Nueva Renta',
      description: 'Crear renta',
      icon: FileText,
      color: 'bg-purple-50 hover:bg-purple-100 text-purple-700',
      section: 'rentas'
    },
    {
      title: 'Reportes',
      description: 'Ver reportes',
      icon: TrendingUp,
      color: 'bg-yellow-50 hover:bg-yellow-100 text-yellow-700',
      section: 'reportes'
    }
  ];

  const handleActionClick = (section: string) => {
    window.dispatchEvent(new CustomEvent('changeSection', { detail: section }));
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.section}
              onClick={() => handleActionClick(action.section)}
              className={`${action.color} p-4 rounded-lg text-left transition-colors`}
            >
              <Icon className="h-6 w-6 mb-2" />
              <div className="font-medium">{action.title}</div>
              <div className="text-sm">{action.description}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}