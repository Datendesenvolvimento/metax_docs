'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { FileText, Users, BarChart3, ArrowRight } from 'lucide-react'
import Image from 'next/image'

export default function HomePage() {
  const { data: session } = useSession()
  const router = useRouter()

  const navigationCards = [
    {
      id: 'documentos',
      title: 'Pendências de Documentos',
      description: 'Consulte e envie relatórios de pendências por competência',
      icon: FileText,
      color: 'bg-metax-secondary',
      hoverColor: 'hover:bg-metax-primary',
      path: '/documentos',
      admin: false
    },
    {
      id: 'usuarios',
      title: 'Gerenciar Usuários',
      description: 'Adicione, edite e gerencie usuários do sistema',
      icon: Users,
      color: 'bg-metax-primary',
      hoverColor: 'hover:bg-metax-secondary',
      path: '/settings/users',
      admin: true
    }
  ]

  return (
    <DashboardLayout>
      <div className="min-h-[calc(100vh-200px)] bg-metax-light">
        {/* Header com Logo */}
        <div className="bg-gradient-to-r from-metax-primary to-metax-secondary text-white py-12 px-6 rounded-2xl shadow-lg mb-8">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-3">
                Bem-vindo, {session?.user?.name || 'Usuário'}!
              </h1>
              <p className="text-lg text-blue-100">
                Sistema de Gestão de Documentos Meta.X
              </p>
            </div>
            <div className="hidden md:block">
              <Image
                src="/images/logo_negative.png"
                alt="Meta.X Logo"
                width={120}
                height={120}
                className="drop-shadow-2xl"
              />
            </div>
          </div>
        </div>

        {/* Cards de Navegação */}
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-metax-primary mb-6">
            Acesso Rápido
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {navigationCards.map((card) => {
              const Icon = card.icon
              
              // Se é admin only e usuário não é admin, não mostra
              if (card.admin && !(session?.user as any)?.isAdmin) {
                return null
              }

              return (
                <button
                  key={card.id}
                  onClick={() => router.push(card.path)}
                  className={`
                    ${card.color} ${card.hoverColor}
                    text-white p-8 rounded-xl shadow-lg
                    transition-all duration-300 transform hover:scale-105
                    flex flex-col items-start text-left
                    group relative overflow-hidden
                  `}
                >
                  {/* Background pattern */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0" style={{
                      backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                      backgroundSize: '40px 40px'
                    }}></div>
                  </div>

                  {/* Content */}
                  <div className="relative z-10 w-full">
                    <div className="flex items-center justify-between mb-4">
                      <div className="bg-white bg-opacity-20 p-4 rounded-xl backdrop-blur-sm">
                        <Icon className="w-8 h-8" />
                      </div>
                      <ArrowRight className="w-6 h-6 transform group-hover:translate-x-2 transition-transform" />
                    </div>

                    <h3 className="text-2xl font-bold mb-2">
                      {card.title}
                    </h3>
                    <p className="text-blue-100 text-sm leading-relaxed">
                      {card.description}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Informações do Sistema */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <BarChart3 className="w-6 h-6 text-metax-secondary" />
              <h3 className="text-xl font-semibold text-metax-primary">
                Sobre o Sistema
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-metax-light rounded-lg">
                <FileText className="w-8 h-8 text-metax-secondary mx-auto mb-2" />
                <h4 className="font-semibold text-metax-primary mb-1">
                  Documentos
                </h4>
                <p className="text-sm text-gray-600">
                  Gestão completa de pendências documentais
                </p>
              </div>

              <div className="text-center p-4 bg-metax-light rounded-lg">
                <Users className="w-8 h-8 text-metax-secondary mx-auto mb-2" />
                <h4 className="font-semibold text-metax-primary mb-1">
                  Usuários
                </h4>
                <p className="text-sm text-gray-600">
                  Controle de acesso e permissões
                </p>
              </div>

              <div className="text-center p-4 bg-metax-light rounded-lg">
                <BarChart3 className="w-8 h-8 text-metax-secondary mx-auto mb-2" />
                <h4 className="font-semibold text-metax-primary mb-1">
                  Relatórios
                </h4>
                <p className="text-sm text-gray-600">
                  Análises e envio automatizado
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
