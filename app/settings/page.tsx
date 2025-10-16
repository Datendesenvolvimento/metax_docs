'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Settings, Users, User, LogOut } from 'lucide-react'

interface UserProfile {
  id: string
  email: string
  name: string | null
  isAdmin: boolean
  isActive: boolean
}

export default function SettingsPage() {
  const router = useRouter()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUserProfile()
  }, [])

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/auth/profile')
      if (response.ok) {
        const data = await response.json()
        setUserProfile(data.user)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    signOut({ callbackUrl: '/login' })
  }

  const navigateToUserManagement = () => {
    router.push('/settings/users')
  }

  const navigateToAccountData = () => {
    router.push('/settings/account')
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Carregando...</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
            <p className="mt-2 text-gray-600">
              Gerencie as configurações do seu sistema
            </p>
          </div>
          <Settings className="w-8 h-8 text-gray-400" />
        </div>

        {/* Settings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* User Management - Admin only */}
          {userProfile?.isAdmin && (
            <div
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={navigateToUserManagement}
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-black rounded-md">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Gestão de Usuários
                </h3>
              </div>
              <p className="text-gray-600 text-sm">
                Criar, editar e gerenciar usuários do sistema
              </p>
            </div>
          )}

          {/* Account Data */}
          <div
            className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
            onClick={navigateToAccountData}
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-black rounded-md">
                <User className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Dados da Conta
              </h3>
            </div>
            <p className="text-gray-600 text-sm">
              Edite seus dados pessoais, nome e senha
            </p>
          </div>
        </div>

        {/* User Info */}
        {userProfile && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Informações do Usuário
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Email:</span>
                <span className="font-medium">{userProfile.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Nome:</span>
                <span className="font-medium">{userProfile.name || 'Não informado'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tipo:</span>
                <span className={`font-medium ${userProfile.isAdmin ? 'text-blue-600' : 'text-gray-900'}`}>
                  {userProfile.isAdmin ? 'Administrador' : 'Usuário'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Logout Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Sair do Sistema
              </h3>
              <p className="text-gray-600 text-sm">
                Encerrar sua sessão atual no sistema
              </p>
            </div>
            <Button 
              onClick={handleLogout}
              variant="outline"
              className="border-red-300 text-red-600 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
