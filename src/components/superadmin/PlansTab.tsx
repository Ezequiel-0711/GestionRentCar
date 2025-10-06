import React from 'react';
import { Plus, CreditCard as Edit, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price_usd: number;
  price_dop: number;
  vehicle_limit: number | null;
  client_limit: number | null;
  employee_limit: number | null;
  features: string[];
  is_active: boolean;
}

interface PlansTabProps {
  plans: SubscriptionPlan[];
  onOpenModal: (plan?: SubscriptionPlan) => void;
  onDelete: (planId: string) => void;
}

export function PlansTab({ plans, onOpenModal, onDelete }: PlansTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Planes de Suscripción</h3>
        <Button onClick={() => onOpenModal()}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Plan
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <div key={plan.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-semibold text-gray-900">{plan.name}</h4>
              <div className="flex space-x-1">
                <button
                  onClick={() => onOpenModal(plan)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(plan.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-2">{plan.description}</p>
            <p className="text-lg font-bold text-green-600">${plan.price_usd}/mes</p>
            <div className="text-xs text-gray-500 mt-2">
              <p>Vehículos: {plan.vehicle_limit || 'Ilimitado'}</p>
              <p>Clientes: {plan.client_limit || 'Ilimitado'}</p>
              <p>Empleados: {plan.employee_limit || 'Ilimitado'}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}