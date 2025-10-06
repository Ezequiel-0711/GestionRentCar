import React from 'react';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';

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

interface PlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingPlan: SubscriptionPlan | null;
  formData: {
    name: string;
    description: string;
    price_usd: string;
    price_dop: string;
    vehicle_limit: string;
    client_limit: string;
    employee_limit: string;
    features: string;
  };
  onFormChange: (data: any) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function PlanModal({ 
  isOpen, 
  onClose, 
  editingPlan, 
  formData, 
  onFormChange, 
  onSubmit 
}: PlanModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingPlan ? 'Editar Plan' : 'Nuevo Plan'}
      size="lg"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Nombre del Plan"
            value={formData.name}
            onChange={(e) => onFormChange({ ...formData, name: e.target.value })}
            required
          />
          <Input
            label="Precio USD"
            type="number"
            step="0.01"
            value={formData.price_usd}
            onChange={(e) => onFormChange({ ...formData, price_usd: e.target.value })}
            required
          />
          <Input
            label="Precio DOP"
            type="number"
            step="0.01"
            value={formData.price_dop}
            onChange={(e) => onFormChange({ ...formData, price_dop: e.target.value })}
            required
          />
          <Input
            label="Límite Vehículos"
            type="number"
            value={formData.vehicle_limit}
            onChange={(e) => onFormChange({ ...formData, vehicle_limit: e.target.value })}
            placeholder="Vacío = Ilimitado"
          />
          <Input
            label="Límite Clientes"
            type="number"
            value={formData.client_limit}
            onChange={(e) => onFormChange({ ...formData, client_limit: e.target.value })}
            placeholder="Vacío = Ilimitado"
          />
          <Input
            label="Límite Empleados"
            type="number"
            value={formData.employee_limit}
            onChange={(e) => onFormChange({ ...formData, employee_limit: e.target.value })}
            placeholder="Vacío = Ilimitado"
          />
        </div>
        <Input
          label="Descripción"
          value={formData.description}
          onChange={(e) => onFormChange({ ...formData, description: e.target.value })}
        />
        <Input
          label="Características (separadas por comas)"
          value={formData.features}
          onChange={(e) => onFormChange({ ...formData, features: e.target.value })}
          placeholder="Gestión básica, Reportes, Soporte"
        />

        <div className="flex space-x-4 pt-6">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button type="submit" className="flex-1">
            {editingPlan ? 'Actualizar' : 'Crear'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}