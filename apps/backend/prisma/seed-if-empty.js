const { PrismaClient } = require("@prisma/client");
const { ALL_PERMISSIONS } = require("../src/config/permissions");
const prisma = new PrismaClient();

(async () => {
  try {
    const hospitalCount = await prisma.hospital.count();
    const userCount = await prisma.user.count();
    if (hospitalCount === 0 && userCount === 0) {
      console.log("🌱 [SEED] Empty database detected — running seed...");
      require("./seed");
    } else {
      console.log("🌱 [SEED] Database already has data — skipping seed.");
    }

    // Backfill: existing receptionists with no permissions get all (transition safety).
    const result = await prisma.receptionistProfile.updateMany({
      where: { permissions: { isEmpty: true } },
      data: { permissions: ALL_PERMISSIONS },
    });
    if (result.count > 0) {
      console.log(`🌱 [SEED] Backfilled permissions for ${result.count} receptionist(s).`);
    }
  } catch (err) {
    console.error("❌ [SEED-CHECK] Error:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();