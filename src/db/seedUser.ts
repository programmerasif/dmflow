import prisma from "./db.config"


async function main() {
  const user = await prisma.user.create({
    data: {
      email: 'test@test.com',
      passwordHash: 'test123', // plain text fine for testing
    }
  })

  console.log('Test user created:', user.id)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())