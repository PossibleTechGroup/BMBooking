const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

/**
 * Reset the password of an existing admin (or create the admin account if none
 * exists). Run inside the backend container:
 *
 *   docker exec bm-backend node scripts/resetAdminPassword.js <new-password> [admin-email]
 *
 * With no email given, the first user with role "admin" is updated.
 */
async function main() {
  const [, , password, email] = process.argv;

  if (!password) {
    console.error('Usage: node scripts/resetAdminPassword.js <new-password> [admin-email]');
    process.exit(1);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  if (email) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      if (user.role !== 'admin') {
        console.error(`Error: ${email} exists but has role "${user.role}", not "admin".`);
        process.exit(1);
      }
      await prisma.user.update({ where: { id: user.id }, data: { password: hashedPassword } });
      console.log(`Password updated for admin ${email}`);
      return;
    }
    const created = await prisma.user.create({
      data: { email, password: hashedPassword, role: 'admin' },
    });
    console.log(`Admin created: ${created.email}`);
    return;
  }

  const admin = await prisma.user.findFirst({ where: { role: 'admin' } });
  if (!admin) {
    const created = await prisma.user.create({
      data: { email: 'admin@bm-booking.com', password: hashedPassword, role: 'admin' },
    });
    console.log(`No admin existed — created: ${created.email}`);
    return;
  }

  await prisma.user.update({ where: { id: admin.id }, data: { password: hashedPassword } });
  console.log(`Password updated for admin ${admin.email || `(id ${admin.id})`}`);
}

main()
  .catch((e) => {
    console.error(e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
