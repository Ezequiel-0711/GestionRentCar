import React from 'react'
import { Loader2 } from 'lucide-react'

interface LoadingSpinnerProps {
  className?: string
}

export function LoadingSpinner({ className = "" }: LoadingSpinnerProps) {
  return (
    <div className={`flex flex-col justify-center items-center ${className}`}>
      <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      <p className="mt-2 text-sm text-gray-600">Cargando...</p>
    </div>
  )
}