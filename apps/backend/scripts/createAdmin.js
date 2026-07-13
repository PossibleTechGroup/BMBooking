const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const [_, __, email, password] = process.argv;

  if (!email || !password) {
    console.error('Usage: node scripts/createAdmin.js <email> <password>');
    process.exit(1);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.error('Error: Email already in use');
    process.exit(1);
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const admin = await prisma.user.create({
    data: { email, password: hashedPassword, role: 'admin' },
  });

  console.log(`Admin created: ${admin.id} ${admin.email}`);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
