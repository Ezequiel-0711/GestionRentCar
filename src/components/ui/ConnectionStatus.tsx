import React, { useState, useEffect } from 'react'
import { CheckCircle, XCircle, AlertCircle, Wifi, WifiOff } from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface ConnectionStatusProps {
  className?: string
}

export function ConnectionStatus({ className = "" }: ConnectionStatusProps) {
  const [status, setStatus] = useState<'checking' | 'connected' | 'disconnected' | 'error'>('checking')
  const [details, setDetails] = useState<string>('')

  useEffect(() => {
    checkConnection()
  }, [])

  async function checkConnection() {
    try {
      // Verificar si las variables de entorno están configuradas
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseKey) {
        setStatus('disconnected')
        setDetails('Variables de entorno no configuradas')
        return
      }

      // Intentar hacer una consulta simple
      const { data, error } = await supabase
        .from('tenants')
        .select('count')
        .limit(1)

      if (error) {
        if (error.message.includes('Could not find the table')) {
          setStatus('connected')
          setDetails('Conectado - Tablas SaaS pendientes de migración')
        } else {
          setStatus('error')
          setDetails(`Error: ${error.message}`)
        }
      } else {
        setStatus('connected')
        setDetails('Conectado - Sistema SaaS completamente funcional')
      }
    } catch (error: any) {
      setStatus('error')
      setDetails(`Error de conexión: ${error.message}`)
    }
  }

  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          text: 'Conectado'
        }
      case 'disconnected':
        return {
          icon: WifiOff,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          text: 'Desconectado'
        }
      case 'error':
        return {
          icon: XCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          text: 'Error'
        }
      default:
        return {
          icon: AlertCircle,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          text: 'Verificando...'
        }
    }
  }

  const config = getStatusConfig()
  const Icon = config.icon

  return (
    <div className={`${config.bgColor} ${config.borderColor} border rounded-lg p-3 ${className}`}>
      <div className="flex items-center">
        <Icon className={`w-5 h-5 ${config.color} mr-2`} />
        <div>
          <p className={`font-medium ${config.color}`}>
            Supabase: {config.text}
          </p>
          <p className="text-sm text-gray-600">{details}</p>
        </div>
        <button
          onClick={checkConnection}
          className="ml-auto text-sm text-blue-600 hover:text-blue-700"
        >
          Verificar
        </button>
      </div>
    </div>
  )
}