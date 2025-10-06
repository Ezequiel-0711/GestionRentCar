import React, { useState } from 'react'
import { User, LogIn } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { getValidationMessage } from '../../utils/validators'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

interface LoginFormProps {
  onAuthSuccess: () => void
}

export function LoginForm({ onAuthSuccess }: LoginFormProps) {
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')
  const [authData, setAuthData] = useState({ email: '', password: '' })
  const [authLoading, setAuthLoading] = useState(false)
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({})

  const validateForm = (): boolean => {
    const errors: {[key: string]: string} = {}
    
    const emailError = getValidationMessage('email', authData.email)
    if (emailError) {
      errors.email = emailError
    }
    
    if (!authData.password) {
      errors.password = 'La contraseña es requerida'
    } else if (authMode === 'signup' && authData.password.length < 6) {
      errors.password = 'La contraseña debe tener al menos 6 caracteres'
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setAuthLoading(true)

    try {
      if (authMode === 'login') {
        const { error } = await supabase.auth.signInWithPassword(authData)
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signUp({
          email: authData.email,
          password: authData.password,
          options: {
            emailRedirectTo: undefined
          }
        })
        if (error) throw error
        alert('Usuario registrado exitosamente. Contacta al administrador para que te asigne a una empresa.')
        setAuthMode('login')
      }
      onAuthSuccess()
    } catch (error: any) {
      if (error.message === 'User already registered' && authMode === 'signup') {
        alert('Este email ya está registrado. Cambiando a modo de inicio de sesión.')
        setAuthMode('login')
      } else if (error.message === 'Invalid login credentials' && authMode === 'login') {
        alert('Credenciales incorrectas. Verifica tu email y contraseña.')
      } else {
        alert(error.message)
      }
    } finally {
      setAuthLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">RentCar Pro</h1>
          <p className="text-gray-600">Sistema de Gestión de Alquiler</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <Input
            label="Correo Electrónico"
            type="email"
            value={authData.email}
            onChange={(e) => setAuthData({ ...authData, email: e.target.value })}
            onValidate={(value) => getValidationMessage('email', value)}
            validateOnBlur={true}
            error={formErrors.email}
            required
          />
          <Input
            label="Contraseña"
            type="password"
            value={authData.password}
            onChange={(e) => setAuthData({ ...authData, password: e.target.value })}
            error={formErrors.password}
            required
          />

          <Button type="submit" disabled={authLoading} className="w-full">
            <LogIn className="w-4 h-4 mr-2" />
            {authLoading ? 'Procesando...' : (authMode === 'login' ? 'Iniciar Sesión' : 'Registrarse')}
          </Button>
        </form>

        <div className="text-center mt-6">
          <button
            onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
            className="text-blue-600 hover:text-blue-700 text-sm"
          >
            {authMode === 'login' 
              ? '¿No tienes cuenta? Regístrate aquí' 
              : '¿Ya tienes cuenta? Inicia sesión aquí'}
          </button>
        </div>
      </div>
    </div>
  )
}