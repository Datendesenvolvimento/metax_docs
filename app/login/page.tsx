import LoginForm from '@/components/layout/login-form'
import { Suspense } from 'react'
import Image from 'next/image'

export default function LoginPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-metax-primary via-metax-primary/90 to-metax-secondary">
      <main className="flex-grow flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white shadow-2xl rounded-2xl overflow-hidden border border-gray-100">
            {/* Logo Meta.X Negativo */}
            <div className="bg-gradient-to-r from-metax-primary to-metax-secondary text-white p-8 text-center">
              <div className="flex justify-center mb-6">
                <Image
                  src="/images/logo_negative.png"
                  alt="Meta.X Logo"
                  width={140}
                  height={140}
                  className="object-contain drop-shadow-lg"
                />
              </div>
              <h1 className="text-2xl font-bold mb-2">
                Bem-vindo
              </h1>
              <p className="text-blue-100 text-sm">
                Integração de Documentos Meta.X Interno TIme COA
              </p>
            </div>

            {/* Formulário de Login */}
            <div className="p-8">
              <div className="space-y-1.5 mb-6">
                <h2 className="text-xl font-semibold text-metax-primary text-center">
                  Acessar sua conta
                </h2>
                <p className="text-gray-500 text-center text-sm">
                  Entre com suas credenciais
                </p>
              </div>
              
              <Suspense fallback={
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-metax-secondary"></div>
                </div>
              }>
                <LoginForm />
              </Suspense>
              
              <div className="text-center text-sm mt-6">
                <div className="text-gray-500">
                  <a 
                    href="/forgot-password"
                    className="text-metax-secondary hover:text-metax-primary font-medium transition-colors"
                  >
                    Esqueceu sua senha?
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
