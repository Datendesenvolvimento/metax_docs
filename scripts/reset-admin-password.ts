/**
 * Script para resetar a senha do usuário admin
 * Execute: npx tsx scripts/reset-admin-password.ts
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const ADMIN_EMAIL = 'admin@daten.com'
const NEW_PASSWORD = '123'

async function main() {
  try {
    console.log('🔍 Buscando usuário admin...')
    
    const user = await prisma.user.findUnique({
      where: { email: ADMIN_EMAIL }
    })

    if (!user) {
      console.error('❌ Usuário admin não encontrado!')
      console.log('📝 Criando usuário admin...')
      
      const hashedPassword = await bcrypt.hash(NEW_PASSWORD, 10)
      
      await prisma.user.create({
        data: {
          email: ADMIN_EMAIL,
          name: 'Administrador',
          password: hashedPassword,
          isAdmin: true,
          isActive: true
        }
      })
      
      console.log('✅ Usuário admin criado com sucesso!')
    } else {
      console.log('✅ Usuário encontrado!')
      console.log('🔄 Atualizando senha...')
      
      const hashedPassword = await bcrypt.hash(NEW_PASSWORD, 10)
      
      await prisma.user.update({
        where: { email: ADMIN_EMAIL },
        data: {
          password: hashedPassword,
          isActive: true
        }
      })
      
      console.log('✅ Senha atualizada com sucesso!')
    }

    console.log('\n📧 Email: admin@daten.com')
    console.log('🔑 Senha: 123')
    console.log('\n✨ Pronto para usar!')
    
  } catch (error) {
    console.error('❌ Erro:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

