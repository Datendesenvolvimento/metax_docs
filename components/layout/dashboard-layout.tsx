'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Sidebar from './sidebar'
import { LogOut, User, ChevronDown } from 'lucide-react'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data: session } = useSession()
  const [isMobile, setIsMobile] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      
      // Auto-collapse on mobile
      if (mobile) {
        setIsCollapsed(true)
      }
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Calculate main content margin based on sidebar state
  const getMainMargin = () => {
    if (isMobile) return 'ml-0'
    return isCollapsed ? 'ml-20' : 'ml-64'
  }

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  return (
    <div className="flex min-h-screen bg-metax-light">
      <Sidebar 
        isCollapsed={isCollapsed}
        onCollapsedChange={setIsCollapsed}
      />
      
      <div className={`flex-1 flex flex-col transition-all duration-300 ${getMainMargin()}`}>
        {/* Top Header with User Menu */}
        <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-30">
          <div className="px-6 py-4 flex items-center justify-between">
            {/* Spacer para mobile (onde fica o botão do menu) */}
            <div className="md:hidden w-10"></div>
            
            {/* Title - opcional, pode ser removido se não precisar */}
            <div className="flex-1"></div>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-metax-light transition-colors group"
              >
                <div className="bg-gradient-to-br from-metax-secondary to-metax-primary text-white rounded-full p-2">
                  <User className="w-5 h-5" />
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-semibold text-metax-primary">
                    {session?.user?.name || 'Usuário'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {session?.user?.email}
                  </p>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <>
                  {/* Overlay to close menu */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowUserMenu(false)}
                  />
                  
                  {/* Menu */}
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-metax-primary">
                        {session?.user?.name || 'Usuário'}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {session?.user?.email}
                      </p>
                      {(session?.user as any)?.isAdmin && (
                        <span className="inline-block mt-2 px-2 py-1 bg-metax-secondary text-white text-xs font-semibold rounded">
                          Administrador
                        </span>
                      )}
                    </div>

                    {/* Menu Items */}
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setShowUserMenu(false)
                          window.location.href = '/settings'
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-metax-light transition-colors"
                      >
                        <User className="w-4 h-4 text-metax-secondary" />
                        Meu Perfil
                      </button>
                      
                      <div className="border-t border-gray-100 my-1"></div>
                      
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sair
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
