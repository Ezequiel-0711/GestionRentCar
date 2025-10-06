import React from 'react'
import { Crown } from 'lucide-react'

interface UsageCardProps {
  title: string
  current: number
  max: number | null
  icon: React.ReactNode
  color: string
}

export function UsageCard({ title, current, max, icon, color }: UsageCardProps) {
  const percentage = max ? (current / max) * 100 : 0
  const isUnlimited = max === null

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div className={`${color} p-3 rounded-full`}>
          {icon}
        </div>
        {isUnlimited && (
          <div className="flex items-center text-yellow-600">
            <Crown className="w-4 h-4 mr-1" />
            <span className="text-xs font-medium">Ilimitado</span>
          </div>
        )}
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-2xl font-bold text-gray-900">{current}</span>
          {!isUnlimited && (
            <span className="text-sm text-gray-600">de {max}</span>
          )}
        </div>
        
        {!isUnlimited && (
          <>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  percentage >= 90 ? 'bg-red-500' : 
                  percentage >= 80 ? 'bg-yellow-500' : 
                  'bg-green-500'
                }`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-600">
              <span>{Math.round(percentage)}% usado</span>
              <span>{max - current} disponibles</span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}