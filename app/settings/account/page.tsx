'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  User, 
  ArrowLeft, 
  Save,
  Eye,
  EyeOff,
  Lock,
  Mail,
  UserCircle
} from 'lucide-react'

interface UserProfile {
  id: string
  email: string
  name: string | null
  isAdmin: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function AccountSettingsPage() {
  const router = useRouter()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  // Form states
  const [personalData, setPersonalData] = useState({
    name: '',
    email: ''
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  useEffect(() => {
    fetchUserProfile()
  }, [])

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/auth/profile')
      if (response.ok) {
        const data = await response.json()
        setUserProfile(data.user)
        setPersonalData({
          name: data.user.name || '',
          email: data.user.email
        })
      } else {
        router.push('/settings')
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePersonalData = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setErrors({})

    try {
      const response = await fetch(`/api/users/${userProfile?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: personalData.name,
          email: personalData.email
        })
      })

      if (response.ok) {
        const data = await response.json()
        setUserProfile(data.user)
        alert('Dados pessoais atualizados com sucesso!')
      } else {
        const error = await response.json()
        setErrors({ personal: error.error || 'Erro ao atualizar dados pessoais' })
      }
    } catch (error) {
      console.error('Error updating personal data:', error)
      setErrors({ personal: 'Erro ao atualizar dados pessoais' })
    } finally {
      setSaving(false)
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setErrors({})

    // Validate passwords
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setErrors({ password: 'As senhas não coincidem' })
      setSaving(false)
      return
    }

    if (passwordData.newPassword.length < 6) {
      setErrors({ password: 'A nova senha deve ter pelo menos 6 caracteres' })
      setSaving(false)
      return
    }

    try {
      const response = await fetch(`/api/users/${userProfile?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          password: passwordData.newPassword
        })
      })

      if (response.ok) {
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
        alert('Senha atualizada com sucesso!')
      } else {
        const error = await response.json()
        setErrors({ password: error.error || 'Erro ao atualizar senha' })
      }
    } catch (error) {
      console.error('Error updating password:', error)
      setErrors({ password: 'Erro ao atualizar senha' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Carregando dados da conta...</div>
        </div>
      </DashboardLayout>
    )
  }

  if (!userProfile) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-red-600">Erro ao carregar dados do usuário</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => router.push('/settings')}
              className="p-2"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dados da Conta</h1>
              <p className="mt-2 text-gray-600">
                Gerencie suas informações pessoais e senha
              </p>
            </div>
          </div>
          <User className="w-8 h-8 text-gray-400" />
        </div>

        {/* Account Info */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center space-x-4 mb-6">
            <div className="p-3 bg-black rounded-full">
              <UserCircle className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {userProfile.name || 'Usuário sem nome'}
              </h3>
              <p className="text-gray-600">{userProfile.email}</p>
              <div className="flex items-center space-x-4 mt-2">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  userProfile.isAdmin 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {userProfile.isAdmin ? 'Administrador' : 'Usuário'}
                </span>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  userProfile.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {userProfile.isActive ? 'Ativo' : 'Inativo'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Conta criada em:</span>
              <p className="font-medium">{new Date(userProfile.createdAt).toLocaleString('pt-BR')}</p>
            </div>
            <div>
              <span className="text-gray-600">Última atualização:</span>
              <p className="font-medium">{new Date(userProfile.updatedAt).toLocaleString('pt-BR')}</p>
            </div>
          </div>
        </div>

        {/* Personal Data Form */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-black rounded-md">
              <UserCircle className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Dados Pessoais</h3>
          </div>
          
          <form onSubmit={handleUpdatePersonalData} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nome</Label>
                <div className="relative">
                  <UserCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="name"
                    type="text"
                    value={personalData.name}
                    onChange={(e) => setPersonalData({ ...personalData, name: e.target.value })}
                    placeholder="Seu nome completo"
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={personalData.email}
                    onChange={(e) => setPersonalData({ ...personalData, email: e.target.value })}
                    placeholder="seu@email.com"
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            </div>

            {errors.personal && (
              <div className="text-red-600 text-sm">{errors.personal}</div>
            )}

            <Button 
              type="submit" 
              disabled={saving}
              className="bg-black hover:bg-gray-800"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Salvando...' : 'Salvar Dados'}
            </Button>
          </form>
        </div>

        {/* Password Form */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-black rounded-md">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Alterar Senha</h3>
          </div>
          
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <Label htmlFor="newPassword">Nova Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  placeholder="Digite sua nova senha"
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  placeholder="Confirme sua nova senha"
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {errors.password && (
              <div className="text-red-600 text-sm">{errors.password}</div>
            )}

            <Button 
              type="submit" 
              disabled={saving}
              className="bg-black hover:bg-gray-800"
            >
              <Lock className="w-4 h-4 mr-2" />
              {saving ? 'Atualizando...' : 'Atualizar Senha'}
            </Button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  )
}

