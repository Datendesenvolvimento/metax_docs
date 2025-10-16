import { AuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          console.log('[AUTH] Tentando autenticar:', credentials?.email)
          
          if (!credentials?.email || !credentials?.password) {
            console.log('[AUTH] Credenciais vazias')
            throw new Error('Credenciais inválidas')
          }

          console.log('[AUTH] Buscando usuário no banco...')
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email
            }
          })

          if (!user || !user?.password) {
            console.log('[AUTH] Usuário não encontrado:', credentials.email)
            throw new Error('Usuário não encontrado')
          }

          console.log('[AUTH] Usuário encontrado:', user.email, 'isActive:', user.isActive)

          // Check if user is active (will work once migration is run)
          if ('isActive' in user && !user.isActive) {
            console.log('[AUTH] Conta inativa')
            throw new Error('Conta inativa')
          }

          console.log('[AUTH] Comparando senhas...')
          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          )

          console.log('[AUTH] Senha válida:', isPasswordValid)

          if (!isPasswordValid) {
            console.log('[AUTH] Senha incorreta para:', user.email)
            throw new Error('Senha incorreta')
          }

          console.log('[AUTH] Login bem-sucedido:', user.email)
          return {
            id: user.id,
            email: user.email,
            name: user.name || undefined,
          }
        } catch (error) {
          console.error('[AUTH] Erro na autenticação:', error)
          throw error
        }
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: '/',
  },
  callbacks: {
    async jwt({ token, user }) {
      if(user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session?.user && typeof token.id === 'string') {
        session.user.id = token.id
      }
      return session
    }
  }
}

