import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../ui/Button';

interface Tenant {
  id: string;
  name: string;
  subscription?: {
    id: string;
    plan: {
      name: string;
      price_usd: number;
    };
    status: string;
    ends_at: string;
  };
}

interface SubscriptionsTabProps {
  tenants: Tenant[];
  onOpenModal: () => void;
}

export function SubscriptionsTab({ tenants, onOpenModal }: SubscriptionsTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Gestión de Suscripciones</h3>
        <Button onClick={onOpenModal}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Suscripción
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {tenants.filter(t => t.subscription).map((tenant) => (
          <div key={tenant.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-semibold text-gray-900">{tenant.name}</h4>
                <p className="text-sm text-gray-600">{tenant.subscription?.plan?.name}</p>
                <p className="text-sm text-green-600">${tenant.subscription?.plan?.price_usd}/mes</p>
                <p className="text-xs text-gray-500">
                  Vence: {tenant.subscription?.ends_at ? new Date(tenant.subscription.ends_at).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                tenant.subscription?.status === 'active' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {tenant.subscription?.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}