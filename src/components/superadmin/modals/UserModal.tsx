import React from 'react';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Select } from '../../ui/Select';

interface Tenant {
  id: string;
  name: string;
}

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenants: Tenant[];
  formData: {
    email: string;
    tenant_id: string;
    role: string;
  };
  onFormChange: (data: any) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function UserModal({ 
  isOpen, 
  onClose, 
  tenants, 
  formData, 
  onFormChange, 
  onSubmit 
}: UserModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Asignar Usuario a Empresa"
      size="lg"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Input
          label="Email del Usuario"
          type="email"
          value={formData.email}
          onChange={(e) => onFormChange({ ...formData, email: e.target.value })}
          placeholder="usuario@empresa.com"
          required
        />
        <Select
          label="Empresa"
          value={formData.tenant_id}
          onChange={(e) => onFormChange({ ...formData, tenant_id: e.target.value })}
          options={tenants.map(tenant => ({ value: tenant.id, label: tenant.name }))}
          required
        />
        <Select
          label="Rol"
          value={formData.role}
          onChange={(e) => onFormChange({ ...formData, role: e.target.value })}
          options={[
            { value: 'admin', label: 'Administrador' },
            { value: 'empleado', label: 'Empleado' },
            { value: 'solo_lectura', label: 'Solo Lectura' }
          ]}
          required
        />

        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Nota:</strong> El usuario debe haberse registrado previamente. Ingresa su User ID.
            <br />
            <strong>Proceso:</strong> 1) Usuario se registra → 2) Obtienes su User ID → 3) Lo asignas aquí.
            <br />
            <strong>Tip:</strong> El User ID es un UUID que puedes encontrar en la base de datos de usuarios.
          </p>
        </div>

        <div className="flex space-x-4 pt-6">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button type="submit" className="flex-1">
            Asignar Usuario
          </Button>
        </div>
      </form>
    </Modal>
  );
}