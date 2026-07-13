const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUser() {
  const phone = '+251986064500';
  console.log(`🔍 Checking user with phone: ${phone}`);
  
  const user = await prisma.user.findUnique({
    where: { phone },
    include: {
      doctorProfile: true,
      patientProfile: true
    }
  });

  if (!user) {
    console.log('❌ User not found in database.');
  } else {
    console.log('✅ User found:');
    console.log(JSON.stringify(user, null, 2));
  }
  
  process.exit(0);
}

checkUser();
