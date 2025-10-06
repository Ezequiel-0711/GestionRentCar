import { useState, useEffect } from 'react'

export function useNavigation() {
  const [activeSection, setActiveSection] = useState('dashboard')

  useEffect(() => {
    // Escuchar eventos de cambio de sección desde acciones rápidas
    const handleSectionChange = (event: any) => {
      setActiveSection(event.detail)
    }

    window.addEventListener('changeSection', handleSectionChange)

    return () => {
      window.removeEventListener('changeSection', handleSectionChange)
    }
  }, [])

  return {
    activeSection,
    setActiveSection
  }
}