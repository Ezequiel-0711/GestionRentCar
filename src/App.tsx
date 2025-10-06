import React from 'react'
import { useAuth } from './hooks/useAuth'
import { useNavigation } from './hooks/useNavigation'
import { LoginForm } from './components/auth/LoginForm'
import { MainLayout } from './components/layout/MainLayout'
import { LoadingScreen } from './components/common/LoadingScreen'
import { SectionRenderer } from './components/common/SectionRenderer'

function App() {
  const { user, userRole, loading } = useAuth()
  const { activeSection, setActiveSection } = useNavigation()

  if (loading) {
    return <LoadingScreen />
  }

  if (!user) {
    return <LoginForm onAuthSuccess={() => {}} />
  }

  return (
    <MainLayout
      user={user}
      userRole={userRole}
      activeSection={activeSection}
      onSectionChange={setActiveSection}
    >
      <SectionRenderer activeSection={activeSection} userRole={userRole} />
    </MainLayout>
  )
}

export default App