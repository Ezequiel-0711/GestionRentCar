import React from 'react';
import { UserPlus } from 'lucide-react';
import { Button } from '../ui/Button';

interface TenantUser {
  id: string;
  user_id: string;
  tenant_id: string;
  role: string;
  is_active: boolean;
  user_email?: string;
  tenants?: {
    name: string;
  };
}

interface UsersTabProps {
  tenantUsers: TenantUser[];
  onOpenModal: () => void;
  onRemoveUser: (tenantUserId: string) => void;
}

export function UsersTab({ tenantUsers, onOpenModal, onRemoveUser }: UsersTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Asignación de Usuarios</h3>
        <Button onClick={onOpenModal}>
          <UserPlus className="w-4 h-4 mr-2" />
          Asignar Usuario
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Empresa</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tenantUsers.map((tenantUser) => (
              <tr key={tenantUser.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    Usuario ID: {tenantUser.user_id.substring(0, 8)}...
                  </div>
                  <div className="text-xs text-gray-500">
                    {tenantUser.user_id}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {tenantUser.tenants?.name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    tenantUser.role === 'admin' 
                      ? 'bg-blue-100 text-blue-800' 
                      : tenantUser.role === 'empleado'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {tenantUser.role === 'admin' ? 'Administrador' : 
                     tenantUser.role === 'empleado' ? 'Empleado' : 
                     tenantUser.role === 'solo_lectura' ? 'Solo Lectura' : tenantUser.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => onRemoveUser(tenantUser.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Remover
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {tenantUsers.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No hay usuarios asignados</p>
        </div>
      )}
    </div>
  );
}