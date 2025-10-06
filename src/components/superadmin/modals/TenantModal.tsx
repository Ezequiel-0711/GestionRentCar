import React from 'react';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone: string;
  address: string;
  is_active: boolean;
  created_at: string;
}

interface TenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingTenant: Tenant | null;
  formData: {
    name: string;
    slug: string;
    email: string;
    phone: string;
    address: string;
  };
  onFormChange: (data: any) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function TenantModal({ 
  isOpen, 
  onClose, 
  editingTenant, 
  formData, 
  onFormChange, 
  onSubmit 
}: TenantModalProps) {
  const [formErrors, setFormErrors] = React.useState<{[key: string]: string}>({});

  const validateForm = (): boolean => {
    const errors: {[key: string]: string} = {};
    
    if (!formData.name.trim()) {
      errors.name = 'El nombre es requerido';
    }
    
    if (!formData.slug.trim()) {
      errors.slug = 'El slug es requerido';
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      errors.slug = 'Solo letras minúsculas, números y guiones';
    }
    
    const emailError = getValidationMessage('email', formData.email);
    if (emailError) {
      errors.email = emailError;
    }
    
    if (formData.phone && formData.phone.length > 0) {
      if (!/^\d{10}$/.test(formData.phone.replace(/[-\s()]/g, ''))) {
        errors.phone = 'Teléfono debe tener 10 dígitos';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(e);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingTenant ? 'Editar Empresa' : 'Nueva Empresa'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Nombre de la Empresa"
            value={formData.name}
            onChange={(e) => onFormChange({ ...formData, name: e.target.value })}
            error={formErrors.name}
            required
          />
          <Input
            label="Slug (URL)"
            value={formData.slug}
            onChange={(e) => {
              const slug = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-');
              onFormChange({ ...formData, slug });
            }}
            error={formErrors.slug}
            required
            placeholder="mi-empresa"
          />
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => onFormChange({ ...formData, email: e.target.value })}
            onValidate={(value) => getValidationMessage('email', value)}
            validateOnBlur={true}
            error={formErrors.email}
            required
          />
          <Input
            label="Teléfono"
            value={formData.phone}
            onChange={(e) => {
              const value = e.target.value.replace(/[^\d\-\s()]/g, '');
              onFormChange({ ...formData, phone: value });
            }}
            error={formErrors.phone}
            placeholder="809-000-0000"
          />
        </div>
        <Input
          label="Dirección"
          value={formData.address}
          onChange={(e) => onFormChange({ ...formData, address: e.target.value })}
        />

        <div className="flex space-x-4 pt-6">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button type="submit" className="flex-1">
            {editingTenant ? 'Actualizar' : 'Crear'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}