const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const phone = '+251978458870';
  
  const user = await prisma.user.upsert({
    where: { phone },
    update: {},
    create: {
      phone,
      email: 'test_sms@bm-booking.com',
      password: 'password123',
      role: 'patient', // Match the enum case
      patientProfile: {
        create: {
          fullName: 'Test User Afro'
        }
      }
    }
  });

  console.log(`User created/verified: ${user.phone}`);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
