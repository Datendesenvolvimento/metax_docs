import { getToken } from 'next-auth/jwt'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Definir quais rotas são públicas
  const isPublicPath = path === '/login' || 
                    path === '/register' || 
                    path === '/forgot-password' || 
                    path.startsWith('/reset-password/')

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  })

  // Redirecionar usuários logados para /dashboard se tentarem acessar rotas públicas
  if (isPublicPath && token) {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  // Redirecionar usuários não logados para /login
  if (!isPublicPath && !token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

// Configurar em quais rotas o middleware será executado
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public assets)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ]
}