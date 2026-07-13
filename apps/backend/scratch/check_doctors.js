const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDoctors() {
  const doctors = await prisma.doctorProfile.findMany({
    include: {
      user: {
        select: {
          phone: true,
        }
      }
    }
  });
  console.log('--- DOCTORS ---');
  doctors.forEach(d => {
    console.log(`ID: ${d.id}, Name: ${d.fullName}, Spec: ${d.specialization}, Phone: ${d.user.phone}`);
  });
  console.log('--- END ---');
}

checkDoctors()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
