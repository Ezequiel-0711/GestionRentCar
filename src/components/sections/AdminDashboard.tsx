import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useUserRole } from '../../hooks/useUserRole';
import { Car, Users, UserCheck, DollarSign, Calendar, Crown, TrendingUp, AlertCircle } from 'lucide-react';
import { StatCard } from '../dashboard/StatCard';
import { QuickActions } from '../dashboard/QuickActions';
import { VehicleStatusOverview } from '../dashboard/VehicleStatusOverview';
import { FinancialSummary } from '../dashboard/FinancialSummary';

interface DashboardStats {
  totalVehicles: number;
  availableVehicles: number;
  totalClients: number;
  totalEmployees: number;
  activeRentals: number;
  todayRentals: number;
  todayIncome: number;
  overdueRentals: number;
  monthlyIncome: number;
  weeklyIncome: number;
}

interface TenantSubscription {
  subscription_plans: {
    name: string;
    price_usd: number;
    features: string[];
  };
  status: string;
  ends_at: string;
}

export default function AdminDashboard() {
  const { tenantId } = useUserRole();
  const [stats, setStats] = useState<DashboardStats>({
    totalVehicles: 0,
    availableVehicles: 0,
    totalClients: 0,
    totalEmployees: 0,
    activeRentals: 0,
    todayRentals: 0,
    todayIncome: 0,
    overdueRentals: 0,
    monthlyIncome: 0,
    weeklyIncome: 0
  });
  const [subscription, setSubscription] = useState<TenantSubscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tenantId) {
      fetchDashboardStats();
      fetchSubscription();
    }
  }, [tenantId]);

  const fetchDashboardStats = async () => {
    if (!tenantId) return;
    
    try {
      setLoading(true);
      
      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      // Obtener estadísticas en paralelo
      const [
        vehiclesResult,
        clientsResult,
        employeesResult,
        rentalsResult,
        todayRentalsResult,
        weeklyRentalsResult,
        monthlyRentalsResult,
        overdueRentalsResult
      ] = await Promise.all([
        // Vehículos totales y disponibles
        supabase
          .from('vehiculos')
          .select('disponible, estado')
          .eq('estado', true)
          .eq('tenant_id', tenantId),
        
        // Clientes totales
        supabase
          .from('clientes')
          .select('id', { count: 'exact' })
          .eq('estado', true)
          .eq('tenant_id', tenantId),
        
        // Empleados totales
        supabase
          .from('empleados')
          .select('id', { count: 'exact' })
          .eq('estado', true)
          .eq('tenant_id', tenantId),
        
        // Rentas activas
        supabase
          .from('rentas')
          .select('monto_total, estado_renta')
          .eq('estado', true)
          .eq('estado_renta', 'Activa')
          .eq('tenant_id', tenantId),
        
        // Rentas de hoy
        supabase
          .from('rentas')
          .select('monto_total')
          .eq('estado', true)
          .eq('fecha_renta', today)
          .eq('tenant_id', tenantId),
        
        // Rentas de la semana
        supabase
          .from('rentas')
          .select('monto_total')
          .eq('estado', true)
          .gte('fecha_renta', weekAgo)
          .eq('tenant_id', tenantId),
        
        // Rentas del mes
        supabase
          .from('rentas')
          .select('monto_total')
          .eq('estado', true)
          .gte('fecha_renta', monthAgo)
          .eq('tenant_id', tenantId),
        
        // Rentas vencidas
        supabase
          .from('rentas')
          .select('id', { count: 'exact' })
          .eq('estado', true)
          .eq('estado_renta', 'Vencida')
          .eq('tenant_id', tenantId)
      ]);

      console.log('Dashboard Debug:', {
        today,
        tenantId,
        todayRentalsData: todayRentalsResult.data,
        todayRentalsError: todayRentalsResult.error
      });

      // Procesar resultados
      const vehicles = vehiclesResult.data || [];
      const totalVehicles = vehicles.length;
      const availableVehicles = vehicles.filter(v => v.disponible).length;
      
      const totalClients = clientsResult.count || 0;
      const totalEmployees = employeesResult.count || 0;
      
      const activeRentals = rentalsResult.data?.length || 0;
      
      const todayRentalsData = todayRentalsResult.data || [];
      const todayRentals = todayRentalsData.length;
      const todayIncome = todayRentalsData.reduce((sum, rental) => 
        sum + (parseFloat(rental.monto_total) || 0), 0
      );
      
      const weeklyRentalsData = weeklyRentalsResult.data || [];
      const weeklyIncome = weeklyRentalsData.reduce((sum, rental) => 
        sum + (parseFloat(rental.monto_total) || 0), 0
      );
      
      const monthlyRentalsData = monthlyRentalsResult.data || [];
      const monthlyIncome = monthlyRentalsData.reduce((sum, rental) => 
        sum + (parseFloat(rental.monto_total) || 0), 0
      );
      
      const overdueRentals = overdueRentalsResult.count || 0;

      setStats({
        totalVehicles,
        availableVehicles,
        totalClients,
        totalEmployees,
        activeRentals,
        todayRentals,
        todayIncome,
        overdueRentals,
        weeklyIncome,
        monthlyIncome
      });

    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscription = async () => {
    if (!tenantId) return;
    
    try {
      const { data } = await supabase
        .from('tenant_subscriptions')
        .select(`
          subscription_plans (
            name,
            price_usd,
            features
          ),
          status,
          ends_at
        `)
        .eq('tenant_id', tenantId)
        .eq('status', 'active')
        .maybeSingle();

      setSubscription(data);
    } catch (error) {
      console.error('Error loading subscription:', error);
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Administrativo</h1>
          <p className="text-gray-600">Resumen general de tu empresa de renta de vehículos</p>
        </div>
        <button
          onClick={fetchDashboardStats}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <TrendingUp className="h-4 w-4" />
          Actualizar
        </button>
      </div>

      {/* Información de Suscripción */}
      {subscription && (
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Crown className="w-8 h-8 mr-3" />
              <div>
                <h3 className="text-lg font-semibold">{subscription.subscription_plans.name}</h3>
                <p className="text-blue-100">
                  ${subscription.subscription_plans.price_usd}/mes • 
                  {subscription.ends_at && ` Vence: ${new Date(subscription.ends_at).toLocaleDateString('es-DO')}`}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-blue-100">Estado</p>
              <p className="font-semibold">{subscription.status === 'active' ? 'Activa' : subscription.status}</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Vehículos Totales"
          value={stats.totalVehicles}
          icon={Car}
          color="blue"
          subtitle={`${stats.availableVehicles} disponibles`}
        />
        
        <StatCard
          title="Clientes Registrados"
          value={stats.totalClients}
          icon={Users}
          color="green"
        />
        
        <StatCard
          title="Empleados Activos"
          value={stats.totalEmployees}
          icon={UserCheck}
          color="purple"
        />
        
        <StatCard
          title="Rentas Activas"
          value={stats.activeRentals}
          icon={Calendar}
          color="indigo"
        />
      </div>

      {/* Métricas de Ingresos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Ingresos de Hoy"
          value={`$${stats.todayIncome.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`}
          icon={DollarSign}
          color="green"
          subtitle={`${stats.todayRentals} rentas nuevas`}
        />
        
        <StatCard
          title="Ingresos Semanales"
          value={`$${stats.weeklyIncome.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`}
          icon={TrendingUp}
          color="blue"
          subtitle="Últimos 7 días"
        />
        
        <StatCard
          title="Ingresos Mensuales"
          value={`$${stats.monthlyIncome.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`}
          icon={Calendar}
          color="purple"
          subtitle="Últimos 30 días"
        />
      </div>

      {/* Alertas y Estado */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard
          title="Rentas Vencidas"
          value={stats.overdueRentals}
          icon={AlertCircle}
          color="red"
          subtitle="Requieren atención inmediata"
        />
        
        <StatCard
          title="Tasa de Ocupación"
          value={`${stats.totalVehicles > 0 ? Math.round(((stats.totalVehicles - stats.availableVehicles) / stats.totalVehicles) * 100) : 0}%`}
          icon={TrendingUp}
          color="indigo"
          subtitle={`${stats.totalVehicles - stats.availableVehicles} vehículos rentados`}
        />
      </div>

      {/* Quick Actions */}
      <QuickActions />

      {/* Vehicle Status Overview */}
      <VehicleStatusOverview 
        totalVehicles={stats.totalVehicles}
        availableVehicles={stats.availableVehicles}
      />

      {/* Resumen Financiero */}
      <FinancialSummary 
        todayIncome={stats.todayIncome}
        weeklyIncome={stats.weeklyIncome}
        monthlyIncome={stats.monthlyIncome}
        activeRentals={stats.activeRentals}
        todayRentals={stats.todayRentals}
        totalVehicles={stats.totalVehicles}
        availableVehicles={stats.availableVehicles}
      />
    </div>
  );
}