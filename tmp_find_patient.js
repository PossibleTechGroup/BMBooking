const { PrismaClient } = require('@prisma/client');
const c = new PrismaClient();
c.user.findMany({
  where: { phone: { contains: '933898971' } },
  select: { id: true, username: true, phone: true, role: true }
}).then(r => {
  console.log('USERS:', JSON.stringify(r, null, 2));
  process.exit(0);
}).catch(e => {
  console.error(e);
  process.exit(1);
});
