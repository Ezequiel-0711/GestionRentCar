import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { SuperAdminStats } from '../superadmin/SuperAdminStats';
import { SuperAdminTabs } from '../superadmin/SuperAdminTabs';
import { TenantsTab } from '../superadmin/TenantsTab';
import { PlansTab } from '../superadmin/PlansTab';
import { SubscriptionsTab } from '../superadmin/SubscriptionsTab';
import { UsersTab } from '../superadmin/UsersTab';
import { TenantModal } from '../superadmin/modals/TenantModal';
import { PlanModal } from '../superadmin/modals/PlanModal';
import { SubscriptionModal } from '../superadmin/modals/SubscriptionModal';
import { UserModal } from '../superadmin/modals/UserModal';

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

interface TenantUser {
  id: string;
  user_id: string;
  tenant_id: string;
  role: string;
  is_active: boolean;
  users?: {
    email: string;
  };
  tenants?: {
    name: string;
  };
}

export default function SuperAdminDashboard() {
  const [activeTab, setActiveTab] = useState('empresas');
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [tenantUsers, setTenantUsers] = useState<TenantUser[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  
  // Editing states
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  
  const [stats, setStats] = useState({
    totalTenants: 0,
    activeTenants: 0,
    totalRevenue: 0,
    totalUsers: 0
  });

  // Forms
  const [tenantForm, setTenantForm] = useState({
    name: '',
    slug: '',
    email: '',
    phone: '',
    address: ''
  });

  const [planForm, setPlanForm] = useState({
    name: '',
    description: '',
    price_usd: '',
    price_dop: '',
    vehicle_limit: '',
    client_limit: '',
    employee_limit: '',
    features: ''
  });

  const [subscriptionForm, setSubscriptionForm] = useState({
    tenant_id: '',
    plan_id: '',
    ends_at: ''
  });

  const [userForm, setUserForm] = useState({
    email: '',
    tenant_id: '',
    role: 'admin'
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchTenants(),
      fetchPlans(),
      fetchStats(),
      fetchTenantUsers()
    ]);
    setLoading(false);
  };

  const fetchTenants = async () => {
    try {
      const { data: tenantsData, error } = await supabase
        .from('tenants')
        .select(`
          *,
          tenant_subscriptions (
            id,
            status,
            ends_at,
            subscription_plans (
              name,
              price_usd
            )
          ),
          tenant_limits (
            max_vehicles,
            max_clients,
            max_employees,
            current_vehicles,
            current_clients,
            current_employees
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedTenants = tenantsData?.map(tenant => ({
        ...tenant,
        subscription: tenant.tenant_subscriptions?.[0] ? {
          id: tenant.tenant_subscriptions[0].id,
          plan: tenant.tenant_subscriptions[0].subscription_plans,
          status: tenant.tenant_subscriptions[0].status,
          ends_at: tenant.tenant_subscriptions[0].ends_at
        } : undefined,
        limits: tenant.tenant_limits?.[0]
      })) || [];

      setTenants(formattedTenants);
    } catch (error) {
      console.error('Error fetching tenants:', error);
    }
  };

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price_usd');

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  };

  const fetchTenantUsers = async () => {
    try {
      const { data: tenantUsersData, error: tenantUsersError } = await supabase
        .from('tenant_users')
        .select(`
          *,
          tenants:tenant_id (name)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (tenantUsersError) throw tenantUsersError;

      // Mostrar User ID en lugar de email
      setTenantUsers(tenantUsersData || []);
    } catch (error) {
      console.error('Error fetching tenant users:', error);
      setTenantUsers([]);
    }
  };

  const fetchStats = async () => {
    try {
      const [tenantsRes, usersRes, subscriptionsRes] = await Promise.all([
        supabase.from('tenants').select('*', { count: 'exact', head: true }),
        supabase.from('tenant_users').select('*', { count: 'exact', head: true }),
        supabase.from('tenant_subscriptions').select(`
          subscription_plans (price_usd)
        `).eq('status', 'active')
      ]);

      const totalRevenue = subscriptionsRes.data?.reduce((sum, sub) => 
        sum + (sub.subscription_plans?.price_usd || 0), 0) || 0;

      const { count: activeTenants } = await supabase
        .from('tenants')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      setStats({
        totalTenants: tenantsRes.count || 0,
        activeTenants: activeTenants || 0,
        totalRevenue,
        totalUsers: usersRes.count || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // CRUD Operations
  const toggleTenantStatus = async (tenantId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('tenants')
        .update({ is_active: !currentStatus })
        .eq('id', tenantId);

      if (error) throw error;
      await fetchAllData();
    } catch (error) {
      console.error('Error updating tenant status:', error);
      alert('Error actualizando estado de la empresa');
    }
  };

  const openTenantModal = (tenant?: Tenant) => {
    if (tenant) {
      setEditingTenant(tenant);
      setTenantForm({
        name: tenant.name,
        slug: tenant.slug,
        email: tenant.email,
        phone: tenant.phone || '',
        address: tenant.address || ''
      });
    } else {
      setEditingTenant(null);
      setTenantForm({
        name: '',
        slug: '',
        email: '',
        phone: '',
        address: ''
      });
    }
    setIsModalOpen(true);
  };

  const openPlanModal = (plan?: SubscriptionPlan) => {
    if (plan) {
      setEditingPlan(plan);
      setPlanForm({
        name: plan.name,
        description: plan.description || '',
        price_usd: plan.price_usd.toString(),
        price_dop: plan.price_dop.toString(),
        vehicle_limit: plan.vehicle_limit?.toString() || '',
        client_limit: plan.client_limit?.toString() || '',
        employee_limit: plan.employee_limit?.toString() || '',
        features: plan.features.join(', ')
      });
    } else {
      setEditingPlan(null);
      setPlanForm({
        name: '',
        description: '',
        price_usd: '',
        price_dop: '',
        vehicle_limit: '',
        client_limit: '',
        employee_limit: '',
        features: ''
      });
    }
    setIsPlanModalOpen(true);
  };

  const openSubscriptionModal = () => {
    setSubscriptionForm({
      tenant_id: '',
      plan_id: '',
      ends_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 1 año
    });
    setIsSubscriptionModalOpen(true);
  };

  const openUserModal = () => {
    setUserForm({
      email: '',
      tenant_id: '',
      role: 'admin'
    });
    setIsUserModalOpen(true);
  };

  const handleTenantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const tenantData = {
        name: tenantForm.name,
        slug: tenantForm.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        email: tenantForm.email,
        phone: tenantForm.phone || null,
        address: tenantForm.address || null
      };

      if (editingTenant) {
        const { error } = await supabase
          .from('tenants')
          .update(tenantData)
          .eq('id', editingTenant.id);

        if (error) throw error;
      } else {
        const { data: newTenant, error } = await supabase
          .from('tenants')
          .insert([tenantData])
          .select()
          .single();

        if (error) throw error;

        // Create tenant limits
        if (newTenant) {
          await supabase
            .from('tenant_limits')
            .insert([{
              tenant_id: newTenant.id,
              max_vehicles: 30,
              max_clients: 30,
              max_employees: 10
            }]);
        }
      }

      setIsModalOpen(false);
      await fetchAllData();
    } catch (error: any) {
      console.error('Error saving tenant:', error);
      alert('Error guardando empresa: ' + error.message);
    }
  };

  const handlePlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const planData = {
        name: planForm.name,
        description: planForm.description || null,
        price_usd: parseFloat(planForm.price_usd),
        price_dop: parseFloat(planForm.price_dop),
        vehicle_limit: planForm.vehicle_limit ? parseInt(planForm.vehicle_limit) : null,
        client_limit: planForm.client_limit ? parseInt(planForm.client_limit) : null,
        employee_limit: planForm.employee_limit ? parseInt(planForm.employee_limit) : null,
        features: planForm.features.split(',').map(f => f.trim()).filter(f => f)
      };

      if (editingPlan) {
        const { error } = await supabase
          .from('subscription_plans')
          .update(planData)
          .eq('id', editingPlan.id);

        if (error) throw error;
      } else {
        // Verificar si ya existe un plan activo con el mismo nombre
        const { data: existingPlan, error: checkError } = await supabase
          .from('subscription_plans')
          .select('id')
          .eq('name', planData.name)
          .eq('is_active', true)
          .maybeSingle();

        if (checkError && !checkError.message.includes('No rows')) {
          console.error('Error verificando plan existente:', checkError);
          throw checkError;
        }

        if (existingPlan) {
          alert(`❌ Ya existe un plan activo con el nombre "${planData.name}".\n\nPor favor usa un nombre diferente o edita el plan existente.`);
          return;
        }

        const { error } = await supabase
          .from('subscription_plans')
          .insert([planData]);

        if (error) throw error;
        
        console.log('✅ Plan creado exitosamente:', planData.name);
      }

      setIsPlanModalOpen(false);
      await fetchAllData();
    } catch (error: any) {
      console.error('Error saving plan:', error);
      alert('❌ Error guardando plan:\n\n' + error.message);
    }
  };

  const handleSubscriptionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from('tenant_subscriptions')
        .insert([{
          tenant_id: subscriptionForm.tenant_id,
          plan_id: subscriptionForm.plan_id,
          status: 'active',
          ends_at: subscriptionForm.ends_at
        }]);

      if (error) throw error;

      // Update tenant limits based on plan
      const selectedPlan = plans.find(p => p.id === subscriptionForm.plan_id);
      if (selectedPlan) {
        await supabase
          .from('tenant_limits')
          .update({
            max_vehicles: selectedPlan.vehicle_limit || 999999,
            max_clients: selectedPlan.client_limit || 999999,
            max_employees: selectedPlan.employee_limit || 999999
          })
          .eq('tenant_id', subscriptionForm.tenant_id);
      }

      setIsSubscriptionModalOpen(false);
      await fetchAllData();
    } catch (error: any) {
      console.error('Error creating subscription:', error);
      alert('Error creando suscripción: ' + error.message);
    }
  };

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Por ahora, el usuario debe proporcionar su user_id
      // En una implementación completa, se usaría una función RPC
      if (!userForm.email.includes('@')) {
        // Si no contiene @, asumimos que es un user_id
        const userId = userForm.email;
        
        const { error } = await supabase
          .from('tenant_users')
          .insert([{
            user_id: userId,
            tenant_id: userForm.tenant_id,
            role: userForm.role
          }]);

        if (error) throw error;
      } else {
        alert('Por ahora, ingresa el User ID del usuario en lugar del email. Puedes encontrarlo en la tabla de usuarios registrados.');
        return;
      }


      setIsUserModalOpen(false);
      await fetchAllData();
    } catch (error: any) {
      console.error('Error assigning user:', error);
      alert('Error asignando usuario: ' + error.message);
    }
  };

  const deleteTenant = async (tenantId: string) => {
    if (!confirm('¿Estás seguro de eliminar esta empresa? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('tenants')
        .delete()
        .eq('id', tenantId);

      if (error) throw error;
      await fetchAllData();
    } catch (error: any) {
      console.error('Error deleting tenant:', error);
      alert('Error eliminando empresa: ' + error.message);
    }
  };

  const deletePlan = async (planId: string) => {
    if (!confirm('¿Estás seguro de eliminar este plan?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('subscription_plans')
        .update({ is_active: false })
        .eq('id', planId);

      if (error) throw error;
      await fetchAllData();
    } catch (error: any) {
      console.error('Error deleting plan:', error);
      alert('Error eliminando plan: ' + error.message);
    }
  };

  const removeUserFromTenant = async (tenantUserId: string) => {
    if (!confirm('¿Estás seguro de remover este usuario?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('tenant_users')
        .update({ is_active: false })
        .eq('id', tenantUserId);

      if (error) throw error;
      await fetchAllData();
    } catch (error: any) {
      console.error('Error removing user:', error);
      alert('Error removiendo usuario: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SuperAdminStats stats={stats} onRefresh={fetchAllData} />

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <SuperAdminTabs activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="p-6">
          {activeTab === 'empresas' && (
            <TenantsTab 
              tenants={tenants}
              onOpenModal={openTenantModal}
              onToggleStatus={toggleTenantStatus}
              onDelete={deleteTenant}
            />
          )}

          {activeTab === 'planes' && (
            <PlansTab 
              plans={plans}
              onOpenModal={openPlanModal}
              onDelete={deletePlan}
            />
          )}

          {activeTab === 'suscripciones' && (
            <SubscriptionsTab 
              tenants={tenants}
              onOpenModal={openSubscriptionModal}
            />
          )}

          {activeTab === 'usuarios' && (
            <UsersTab 
              tenantUsers={tenantUsers}
              onOpenModal={openUserModal}
              onRemoveUser={removeUserFromTenant}
            />
          )}
        </div>
      </div>

      <TenantModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingTenant={editingTenant}
        formData={tenantForm}
        onFormChange={setTenantForm}
        onSubmit={handleTenantSubmit}
      />

      <PlanModal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        editingPlan={editingPlan}
        formData={planForm}
        onFormChange={setPlanForm}
        onSubmit={handlePlanSubmit}
      />

      <SubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
        tenants={tenants}
        plans={plans}
        formData={subscriptionForm}
        onFormChange={setSubscriptionForm}
        onSubmit={handleSubscriptionSubmit}
      />

      <UserModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        tenants={tenants}
        formData={userForm}
        onFormChange={setUserForm}
        onSubmit={handleUserSubmit}
      />
    </div>
  );
}