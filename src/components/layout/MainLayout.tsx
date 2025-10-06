import React from 'react'
import { Navigation } from './Navigation'
import { Header } from './Header'

interface MainLayoutProps {
  user: any
  userRole: string
  activeSection: string
  onSectionChange: (section: string) => void
  children: React.ReactNode
}

export function MainLayout({ 
  user, 
  userRole, 
  activeSection, 
  onSectionChange, 
  children 
}: MainLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-100">
      <Navigation 
        activeSection={activeSection} 
        onSectionChange={onSectionChange} 
      />
      
      <div className="flex-1 ml-64 overflow-auto">
        <Header user={user} userRole={userRole} />
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}