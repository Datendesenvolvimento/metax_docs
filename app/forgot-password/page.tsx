import Header from '@/components/layout/header-basic'
import Footer from '@/components/layout/footer-basic'
import ForgotPasswordForm from '@/components/layout/forgot-password-form'

export default function ForgotPasswordPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 py-6">
        <div className="w-full max-w-sm px-4">
          <div className="bg-white shadow-lg rounded-xl p-6 space-y-4">
            <div className="space-y-1.5">
              <h1 className="text-xl font-bold text-gray-900 text-center">
                Recuperar Senha
              </h1>
              <p className="text-gray-500 text-center text-sm">
                Digite seu email para receber o link de recuperação
              </p>
            </div>
            
            <div className="border-t border-gray-100 pt-4">
              <ForgotPasswordForm />
            </div>
            
            <div className="text-center text-sm text-gray-500">
              <p>
                Lembrou sua senha?{' '}
                <a 
                  href="/"
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Voltar ao login
                </a>
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}