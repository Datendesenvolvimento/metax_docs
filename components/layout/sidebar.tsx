'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { 
  ChevronLeft, 
  ChevronRight, 
  Home, 
  Settings, 
  Menu,
  X,
  FileText,
  Users,
  User as UserIcon
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarItem {
  id: string
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  adminOnly?: boolean
}

const sidebarItems: SidebarItem[] = [
  {
    id: 'home',
    label: 'Dashboard',
    href: '/',
    icon: Home
  },
  {
    id: 'documentos',
    label: 'Documentos',
    href: '/documentos',
    icon: FileText
  },
  {
    id: 'usuarios',
    label: 'Usuários',
    href: '/settings/users',
    icon: Users,
    adminOnly: true
  },
  {
    id: 'settings',
    label: 'Configurações',
    href: '/settings',
    icon: Settings
  }
]

interface SidebarProps {
  className?: string
  isCollapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
}

export default function Sidebar({ 
  className, 
  isCollapsed: externalCollapsed, 
  onCollapsedChange 
}: SidebarProps) {
  const { data: session } = useSession()
  const [internalCollapsed, setInternalCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const pathname = usePathname()

  const isAdmin = (session?.user as any)?.isAdmin || false

  // Use external collapsed state if provided, otherwise use internal
  const isCollapsed = externalCollapsed !== undefined ? externalCollapsed : internalCollapsed

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth >= 768) {
        setIsMobileOpen(false)
      }
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Close mobile sidebar when route changes
  useEffect(() => {
    if (isMobile) {
      setIsMobileOpen(false)
    }
  }, [pathname, isMobile])

  const toggleCollapse = () => {
    if (!isMobile) {
      const newCollapsed = !isCollapsed
      if (onCollapsedChange) {
        onCollapsedChange(newCollapsed)
      } else {
        setInternalCollapsed(newCollapsed)
      }
    }
  }

  const toggleMobileSidebar = () => {
    setIsMobileOpen(!isMobileOpen)
  }

  // Filter items based on admin status
  const visibleItems = sidebarItems.filter(item => {
    if (item.adminOnly) {
      return isAdmin
    }
    return true
  })

  return (
    <>
      {/* Mobile Menu Button */}
      {isMobile && (
        <button
          onClick={toggleMobileSidebar}
          className="fixed top-4 left-4 z-50 p-3 bg-metax-primary text-white rounded-lg shadow-lg md:hidden"
          aria-label="Toggle menu"
        >
          {isMobileOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      )}

      {/* Mobile Overlay */}
      {isMobile && isMobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-full bg-gradient-to-b from-metax-primary to-metax-primary/95 text-white transition-all duration-300 ease-in-out shadow-2xl',
          {
            // Desktop states
            'w-64': !isMobile && !isCollapsed,
            'w-20': !isMobile && isCollapsed,
            // Mobile states
            'w-64 translate-x-0': isMobile && isMobileOpen,
            '-translate-x-full': isMobile && !isMobileOpen,
          },
          className
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header with Logo */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            {(!isCollapsed || isMobile) ? (
              <div className="flex items-center gap-3">
                <div className="bg-white rounded-lg p-2">
                  <Image
                    src="/images/logo.png"
                    alt="Meta.X"
                    width={32}
                    height={32}
                    className="object-contain"
                  />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    Meta.X
                  </h2>
                  <p className="text-xs text-blue-200">
                    Gestão de Docs
                  </p>
                </div>
              </div>
            ) : (
              <div className="mx-auto">
                <div className="bg-white rounded-lg p-1.5">
                  <Image
                    src="/images/logo.png"
                    alt="Meta.X"
                    width={24}
                    height={24}
                    className="object-contain"
                  />
                </div>
              </div>
            )}
            {!isMobile && (
              <button
                onClick={toggleCollapse}
                className="p-1.5 rounded-md hover:bg-white/10 transition-colors"
                aria-label={isCollapsed ? 'Expandir menu' : 'Recolher menu'}
              >
                {isCollapsed ? (
                  <ChevronRight className="w-5 h-5" />
                ) : (
                  <ChevronLeft className="w-5 h-5" />
                )}
              </button>
            )}
          </div>

          {/* User Info */}
          {(!isCollapsed || isMobile) && session?.user && (
            <div className="px-4 py-3 border-b border-white/10 bg-white/5">
              <div className="flex items-center gap-3">
                <div className="bg-metax-secondary rounded-full p-2">
                  <UserIcon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {session.user.name || session.user.email}
                  </p>
                  <p className="text-xs text-blue-200">
                    {isAdmin ? 'Administrador' : 'Usuário'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 overflow-y-auto">
            <ul className="space-y-1">
              {visibleItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || 
                                (item.href !== '/' && pathname.startsWith(item.href))

                return (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center px-3 py-3 rounded-lg transition-all duration-200 group',
                        {
                          'bg-metax-secondary text-white shadow-lg': isActive,
                          'text-blue-100 hover:bg-white/10 hover:text-white': !isActive,
                          'justify-center': isCollapsed && !isMobile,
                        }
                      )}
                      title={isCollapsed && !isMobile ? item.label : undefined}
                    >
                      <Icon 
                        className={cn(
                          'w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110',
                          {
                            'mr-3': (!isCollapsed || isMobile),
                          }
                        )} 
                      />
                      {(!isCollapsed || isMobile) && (
                        <span className="font-medium">{item.label}</span>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-white/10 bg-white/5">
            {(!isCollapsed || isMobile) ? (
              <div className="text-xs text-blue-200 text-center">
                <p className="font-semibold text-white mb-1">Meta.X</p>
                <p>© 2025 Todos os direitos reservados</p>
              </div>
            ) : (
              <div className="text-xs text-blue-200 text-center">
                <p className="font-bold">©</p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}
