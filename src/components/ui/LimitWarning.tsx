import React from 'react'
import { AlertTriangle, Crown } from 'lucide-react'
import { Button } from './Button'

interface LimitWarningProps {
  type: 'vehicle' | 'client' | 'employee'
  current: number
  max: number
  onUpgrade?: () => void
}

export function LimitWarning({ type, current, max, onUpgrade }: LimitWarningProps) {
  const percentage = (current / max) * 100
  const isNearLimit = percentage >= 80
  const isAtLimit = current >= max

  if (!isNearLimit) return null

  const typeLabels = {
    vehicle: 'vehículos',
    client: 'clientes',
    employee: 'empleados'
  }

  return (
    <div className={`p-4 rounded-lg border ${
      isAtLimit 
        ? 'bg-red-50 border-red-200 text-red-800' 
        : 'bg-yellow-50 border-yellow-200 text-yellow-800'
    }`}>
      <div className="flex items-start">
        <AlertTriangle className="w-5 h-5 mt-0.5 mr-3 flex-shrink-0" />
        <div className="flex-1">
          <h4 className="font-medium">
            {isAtLimit ? 'Límite alcanzado' : 'Cerca del límite'}
          </h4>
          <p className="text-sm mt-1">
            {isAtLimit 
              ? `Has alcanzado el límite de ${max} ${typeLabels[type]}. Actualiza tu plan para agregar más.`
              : `Estás usando ${current} de ${max} ${typeLabels[type]} disponibles (${Math.round(percentage)}%).`
            }
          </p>
          {onUpgrade && (
            <Button
              size="sm"
              onClick={onUpgrade}
              className="mt-3"
              variant={isAtLimit ? 'danger' : 'secondary'}
            >
              <Crown className="w-4 h-4 mr-2" />
              Actualizar Plan
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}