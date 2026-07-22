const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

function onDate(base, dayOffset, hours = 0, minutes = 0) {
  const d = new Date(base);
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

const DOCTORS = [
  { phone: "+251910000001", fullName: "Dr. Dawit Yohannes", specialization: "Cardiology", exp: 12, rate: 50, bio: "Expert cardiologist with 12 years of experience in interventional cardiology.", languages: ["Amharic", "English"], hospitalIdx: 0, schedules: [{ days: [0,1,2,3,4], start: 8, end: 12 }, { days: [0,1,2,3,4], start: 14, end: 17 }] },
  { phone: "+251910000002", fullName: "Dr. Helen Tadesse", specialization: "Pediatrics", exp: 8, rate: 50, bio: "Compassionate pediatrician dedicated to child health and development.", languages: ["Amharic", "English", "Oromiffa"], hospitalIdx: 1, schedules: [{ days: [0,1,2,3,4], start: 9, end: 13 }, { days: [0,1,2,3,4], start: 14, end: 16 }] },
  { phone: "+251910000003", fullName: "Dr. Brook Mengistu", specialization: "Orthopedics", exp: 15, rate: 50, bio: "Specializing in joint replacement and sports injury treatment.", languages: ["Amharic", "English"], hospitalIdx: 2, schedules: [{ days: [0,1,2,3,4], start: 8, end: 12 }, { days: [1,3], start: 14, end: 17 }] },
  { phone: "+251910000004", fullName: "Dr. Tigist Girmay", specialization: "Dermatology", exp: 6, rate: 50, bio: "Focused on skin care, cosmetic dermatology, and dermatologic surgery.", languages: ["Amharic", "English"], hospitalIdx: 3, schedules: [{ days: [0,1,2,3,4], start: 9, end: 13 }, { days: [2,4], start: 14, end: 16 }] },
  { phone: "+251910000005", fullName: "Dr. Mulugeta Belay", specialization: "Neurology", exp: 10, rate: 50, bio: "Neurologist specializing in stroke, epilepsy, and movement disorders.", languages: ["Amharic", "English"], hospitalIdx: 0, schedules: [{ days: [0,1,2,3], start: 8, end: 12 }, { days: [0,2], start: 14, end: 17 }] },
  { phone: "+251910000006", fullName: "Dr. Sara Kebede", specialization: "Gynecology", exp: 9, rate: 50, bio: "OB-GYN with expertise in maternal-fetal medicine and reproductive health.", languages: ["Amharic", "English", "Oromiffa"], hospitalIdx: 4, schedules: [{ days: [0,1,2,3,4], start: 8, end: 12 }, { days: [0,1,2,3,4], start: 13, end: 15 }] },
  { phone: "+251910000007", fullName: "Dr. Yohannes Tesfaye", specialization: "Internal Medicine", exp: 20, rate: 50, bio: "Experienced internist with a focus on chronic disease management.", languages: ["Amharic", "English"], hospitalIdx: 5, schedules: [{ days: [0,1,2,3,4], start: 7, end: 11 }, { days: [0,1,2,3,4], start: 14, end: 18 }] },
  { phone: "+251910000008", fullName: "Dr. Meron Alemu", specialization: "Ophthalmology", exp: 7, rate: 50, bio: "Eye care specialist trained in cataract surgery and glaucoma treatment.", languages: ["Amharic", "English"], hospitalIdx: 6, schedules: [{ days: [0,1,2,3,4], start: 9, end: 13 }, { days: [1,3], start: 14, end: 16 }] },
  { phone: "+251910000009", fullName: "Dr. Haile Desta", specialization: "General Surgery", exp: 18, rate: 50, bio: "Veteran surgeon with expertise in laparoscopic and minimally invasive procedures.", languages: ["Amharic", "English"], hospitalIdx: 7, schedules: [{ days: [0,1,2,3,4], start: 7, end: 12 }, { days: [0,2,4], start: 14, end: 16 }] },
  { phone: "+251910000010", fullName: "Dr. Rahel Gebre", specialization: "Family Medicine", exp: 5, rate: 50, bio: "Dedicated family physician providing comprehensive primary care.", languages: ["Amharic", "English", "Oromiffa"], hospitalIdx: 0, schedules: [{ days: [0,1,2,3,4], start: 8, end: 16 }] },
];

async function main() {
  console.log("🧹 Removing all existing doctors...");

  // Delete in order of dependencies
  await prisma.review.deleteMany({});
  await prisma.appointment.deleteMany({});
  await prisma.doctorSchedule.deleteMany({});
  await prisma.doctorProfile.deleteMany({});

  // Also delete orphaned doctor users
  const doctorUsers = await prisma.user.findMany({ where: { role: "doctor" } });
  if (doctorUsers.length > 0) {
    await prisma.user.deleteMany({ where: { id: { in: doctorUsers.map(u => u.id) } } });
  }
  console.log(`  ✅ Removed all doctors`);

  // Get hospitals
  const hospitals = await prisma.hospital.findMany({ orderBy: { id: "asc" } });
  if (hospitals.length === 0) {
    console.error("❌ No hospitals found. Run full seed first.");
    process.exit(1);
  }

  console.log("\n👨‍⚕️ Creating 10 doctors with schedules...");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const created = [];

  for (let i = 0; i < DOCTORS.length; i++) {
    const d = DOCTORS[i];
    const email = d.fullName.toLowerCase().replace(/[. ]+/g, ".").replace("dr.", "") + `@bm-booking.com`;

    const user = await prisma.user.upsert({
      where: { phone: d.phone },
      update: {},
      create: {
        phone: d.phone, email, password: await bcrypt.hash("password123", 10), role: "doctor",
        doctorProfile: {
          create: {
            fullName: d.fullName,
            specialization: d.specialization,
            specializations: [d.specialization],
            licenseNumber: `MD-${10000 + i}`,
            experienceYears: d.exp,
            baseHourlyRate: d.rate,
            bio: d.bio,
            rating: 4.0 + Math.random(),
            totalReviews: Math.floor(Math.random() * 30) + 5,
            status: "Approved",
            hospitalId: hospitals[d.hospitalIdx % hospitals.length].id,
            clinicName: d.fullName.replace("Dr. ", "") + " Clinic",
            clinicAddress: `Addis Ababa`,
            languages: d.languages,
          },
        },
      },
    });

    const profile = await prisma.doctorProfile.findUnique({ where: { userId: user.id } });
    if (!profile) { console.log(`  ⚠️ Skipped ${d.fullName}`); continue; }

    // Create schedules for next 7 days
    for (let dayOff = 0; dayOff < 7; dayOff++) {
      const date = onDate(today, dayOff);
      const dayOfWeek = date.getDay(); // 0=Sun, 1=Mon...

      for (const sch of d.schedules) {
        if (!sch.days.includes(dayOfWeek)) continue;
        const startTime = new Date(date);
        startTime.setHours(sch.start, 0, 0, 0);
        const endTime = new Date(date);
        endTime.setHours(sch.end, 0, 0, 0);

        await prisma.doctorSchedule.create({
          data: {
            doctorId: profile.id,
            hospitalId: hospitals[d.hospitalIdx % hospitals.length].id,
            date,
            startTime,
            endTime,
            slotDuration: 30,
            clinicRoom: `Room ${100 + i}`,
            isActive: true,
          },
        });
      }
    }

    const schedCount = await prisma.doctorSchedule.count({ where: { doctorId: profile.id } });
    created.push({ name: d.fullName, spec: d.specialization, rate: d.rate, schedules: schedCount });
    console.log(`  ✅ ${d.fullName} — ${d.specialization} — ${d.rate} ETB/hr — ${schedCount} slots`);
  }

  console.log(`\n📊 Done: ${created.length} doctors created with schedules`);
}

main()
  .catch((e) => { console.error("❌ Error:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
