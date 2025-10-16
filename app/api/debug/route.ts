import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Rota de debug para verificar conexão com banco
 * Acesse: /api/debug
 */
export async function GET() {
  try {
    // Tenta contar usuários
    const userCount = await prisma.user.count()
    
    // Busca o admin
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@daten.com' },
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
        isActive: true,
        createdAt: true
      }
    })

    return NextResponse.json({
      success: true,
      database: {
        connected: true,
        totalUsers: userCount,
        adminExists: !!admin,
        adminInfo: admin ? {
          email: admin.email,
          name: admin.name,
          isAdmin: admin.isAdmin,
          isActive: admin.isActive
        } : null
      },
      env: {
        hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
        hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        nextAuthUrl: process.env.NEXTAUTH_URL || 'NOT SET'
      }
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      database: {
        connected: false
      }
    }, { status: 500 })
  }
}

