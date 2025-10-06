import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useUserRole } from './useUserRole'
import { TenantLimits } from '../types/database'

export function useTenantLimits() {
  const { tenantId, isSuperAdmin } = useUserRole()
  const [limits, setLimits] = useState<TenantLimits | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tenantId || isSuperAdmin) {
      setLoading(false)
      return
    }

    loadLimits()
  }, [tenantId, isSuperAdmin])

  async function loadLimits() {
    try {
      const { data, error } = await supabase
        .from('tenant_limits')
        .select('*')
        .eq('tenant_id', tenantId)
        .maybeSingle()

      if (error) {
        console.error('Error loading tenant limits:', error)
        setLimits(null)
        return
      }

      setLimits(data)
    } catch (error) {
      console.error('Error loading tenant limits:', error)
      setLimits(null)
    } finally {
      setLoading(false)
    }
  }

  const canAddVehicle = () => {
    if (isSuperAdmin || !limits) return true
    if (limits.max_vehicles === null) return true
    return limits.current_vehicles < limits.max_vehicles
  }

  const canAddClient = () => {
    if (isSuperAdmin || !limits) return true
    if (limits.max_clients === null) return true
    return limits.current_clients < limits.max_clients
  }

  const canAddEmployee = () => {
    if (isSuperAdmin || !limits) return true
    if (limits.max_employees === null) return true
    return limits.current_employees < limits.max_employees
  }

  const getVehicleUsage = () => {
    if (!limits) return { current: 0, max: 0, percentage: 0 }
    const max = limits.max_vehicles || 0
    const percentage = max > 0 ? (limits.current_vehicles / max) * 100 : 0
    return { current: limits.current_vehicles, max, percentage }
  }

  const getClientUsage = () => {
    if (!limits) return { current: 0, max: 0, percentage: 0 }
    const max = limits.max_clients || 0
    const percentage = max > 0 ? (limits.current_clients / max) * 100 : 0
    return { current: limits.current_clients, max, percentage }
  }

  const getEmployeeUsage = () => {
    if (!limits) return { current: 0, max: 0, percentage: 0 }
    const max = limits.max_employees || 0
    const percentage = max > 0 ? (limits.current_employees / max) * 100 : 0
    return { current: limits.current_employees, max, percentage }
  }

  return {
    limits,
    loading,
    canAddVehicle,
    canAddClient,
    canAddEmployee,
    getVehicleUsage,
    getClientUsage,
    getEmployeeUsage,
    refreshLimits: loadLimits
  }
}