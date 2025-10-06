import React from 'react';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Select } from '../../ui/Select';

interface Tenant {
  id: string;
  name: string;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  price_usd: number;
}

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenants: Tenant[];
  plans: SubscriptionPlan[];
  formData: {
    tenant_id: string;
    plan_id: string;
    ends_at: string;
  };
  onFormChange: (data: any) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function SubscriptionModal({ 
  isOpen, 
  onClose, 
  tenants, 
  plans, 
  formData, 
  onFormChange, 
  onSubmit 
}: SubscriptionModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nueva Suscripción"
      size="lg"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Select
          label="Empresa"
          value={formData.tenant_id}
          onChange={(e) => onFormChange({ ...formData, tenant_id: e.target.value })}
          options={tenants.map(tenant => ({ value: tenant.id, label: tenant.name }))}
          required
        />
        <Select
          label="Plan"
          value={formData.plan_id}
          onChange={(e) => onFormChange({ ...formData, plan_id: e.target.value })}
          options={plans.map(plan => ({ value: plan.id, label: `${plan.name} - $${plan.price_usd}/mes` }))}
          required
        />
        <Input
          label="Fecha de Vencimiento"
          type="date"
          value={formData.ends_at}
          onChange={(e) => onFormChange({ ...formData, ends_at: e.target.value })}
          required
        />

        <div className="flex space-x-4 pt-6">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button type="submit" className="flex-1">
            Crear Suscripción
          </Button>
        </div>
      </form>
    </Modal>
  );
}