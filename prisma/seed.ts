import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Default master user credentials
const ADMIN_EMAIL: string = process.env.ADMIN_EMAIL || 'admin@daten.com'
const ADMIN_PASSWORD: string = process.env.ADMIN_PASSWORD || '123'
const ADMIN_NAME: string = process.env.ADMIN_NAME || 'Administrador'

async function main() {
  try {
    // Check if admin user already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: ADMIN_EMAIL }
    })

    if (!existingAdmin) {
      // Create master user with hashed password
      const hashedPassword: string = await bcrypt.hash(ADMIN_PASSWORD, 10)
      
      const adminUser = await prisma.user.create({
        data: {
          email: ADMIN_EMAIL,
          name: ADMIN_NAME,
          password: hashedPassword,
          isAdmin: true,
          isActive: true
        }
      })

      console.log('✅ Master user created successfully!')
      console.log(`📧 Email: ${adminUser.email}`)
      console.log(`👤 Name: ${adminUser.name}`)
      console.log(`🔑 Password: ${ADMIN_PASSWORD}`)
    } else {
      console.log('ℹ️  Master user already exists.')
      console.log(`📧 Email: ${existingAdmin.email}`)
    }
  } catch (error) {
    console.error('❌ Error creating master user:', error)
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