import React from 'react';
import { Plus, CreditCard as Edit, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone: string;
  address: string;
  is_active: boolean;
  created_at: string;
  subscription?: {
    id: string;
    plan: {
      name: string;
      price_usd: number;
    };
    status: string;
    ends_at: string;
  };
  limits?: {
    max_vehicles: number;
    max_clients: number;
    max_employees: number;
    current_vehicles: number;
    current_clients: number;
    current_employees: number;
  };
}

interface TenantsTabProps {
  tenants: Tenant[];
  onOpenModal: (tenant?: Tenant) => void;
  onToggleStatus: (tenantId: string, currentStatus: boolean) => void;
  onDelete: (tenantId: string) => void;
}

export function TenantsTab({ tenants, onOpenModal, onToggleStatus, onDelete }: TenantsTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Gestión de Empresas</h3>
        <Button onClick={() => onOpenModal()}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Empresa
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Empresa</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Límites</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tenants.map((tenant) => (
              <tr key={tenant.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{tenant.name}</div>
                    <div className="text-sm text-gray-500">{tenant.email}</div>
                    <div className="text-sm text-gray-500">/{tenant.slug}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {tenant.subscription?.plan?.name || 'Sin plan'}
                  </div>
                  <div className="text-sm text-gray-500">
                    ${tenant.subscription?.plan?.price_usd || 0}/mes
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {tenant.limits ? (
                    <div>
                      <div>V: {tenant.limits.current_vehicles}/{tenant.limits.max_vehicles}</div>
                      <div>C: {tenant.limits.current_clients}/{tenant.limits.max_clients}</div>
                      <div>E: {tenant.limits.current_employees}/{tenant.limits.max_employees}</div>
                    </div>
                  ) : (
                    'Sin límites'
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    tenant.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {tenant.is_active ? 'Activa' : 'Inactiva'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onOpenModal(tenant)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onToggleStatus(tenant.id, tenant.is_active)}
                      className={`${
                        tenant.is_active 
                          ? 'text-red-600 hover:text-red-900' 
                          : 'text-green-600 hover:text-green-900'
                      }`}
                    >
                      {tenant.is_active ? 'Desactivar' : 'Activar'}
                    </button>
                    <button
                      onClick={() => onDelete(tenant.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}