const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

const HOSPITAL_NAME = "Black Lion Hospital";

const TEST_PATIENTS = [
  {
    phone: "+251900000000",
    email: "test.patient.one@bm-booking.com",
    profile: {
      fullName: "Test Patient One",
      gender: "Male",
      bloodType: "O+",
      dateOfBirth: new Date("1990-05-12"),
      emergencyContact: "+251911000001",
    },
    password: "password123",
  },
  {
    phone: "+251900000111",
    email: "test.patient.two@bm-booking.com",
    profile: {
      fullName: "Test Patient Two",
      gender: "Female",
      bloodType: "A-",
      dateOfBirth: new Date("1985-11-23"),
      emergencyContact: "+251911000002",
    },
    password: "password123",
  },
];

function daysFromNow(days, hours = 10, minutes = 0) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

async function main() {
  console.log("[SEED-TEST-HISTORY] Starting...");

  const hospital = await prisma.hospital.findUnique({
    where: { name: HOSPITAL_NAME },
  });
  if (!hospital) {
    throw new Error(`Hospital "${HOSPITAL_NAME}" not found — run the main seed first.`);
  }

  const doctors = await prisma.doctorProfile.findMany({
    where: { hospitalId: hospital.id, status: "Approved" },
    orderBy: { id: "asc" },
  });
  if (doctors.length < 2) {
    throw new Error(`Need at least 2 approved doctors at ${HOSPITAL_NAME}.`);
  }

  const equipment = await prisma.medicalEquipment.findMany({
    where: { hospitalId: hospital.id },
    orderBy: { id: "asc" },
  });
  if (equipment.length < 3) {
    throw new Error(`Need at least 3 equipment items at ${HOSPITAL_NAME}.`);
  }

  const passwordHash = await bcrypt.hash("password123", 10);

  for (let i = 0; i < TEST_PATIENTS.length; i++) {
    const def = TEST_PATIENTS[i];
    const user = await prisma.user.upsert({
      where: { phone: def.phone },
      update: { role: "patient", password: passwordHash, email: def.email },
      create: {
        phone: def.phone,
        email: def.email,
        password: passwordHash,
        role: "patient",
      },
    });

    await prisma.patientProfile.upsert({
      where: { userId: user.id },
      update: def.profile,
      create: { userId: user.id, ...def.profile },
    });

    await prisma.$transaction([
      prisma.appointment.deleteMany({ where: { patientId: user.id } }),
      prisma.equipmentBooking.deleteMany({ where: { patientId: user.id } }),
      prisma.review.deleteMany({ where: { patientId: user.id } }),
      prisma.notification.deleteMany({ where: { userId: user.id } }),
    ]);

    const tag = def.phone.replace(/\D/g, "").slice(-6);

    const appointments = await prisma.appointment.createMany({
      data: [
        {
          patientId: user.id,
          doctorId: doctors[0].id,
          dateTime: daysFromNow(-14, 9),
          status: "completed",
          fee: 50,
          isPaid: true,
          reason: "Routine cardiology check-up",
          confirmationCode: `TEST-APT-${tag}-C1`,
        },
        {
          patientId: user.id,
          doctorId: doctors[1].id,
          dateTime: daysFromNow(-7, 14),
          status: "completed",
          fee: 50,
          isPaid: true,
          reason: "Malaria follow-up visit",
          confirmationCode: `TEST-APT-${tag}-C2`,
        },
        {
          patientId: user.id,
          doctorId: doctors[0].id,
          dateTime: daysFromNow(3, 11),
          status: "accepted",
          fee: 50,
          isPaid: false,
          reason: "Blood pressure review",
          confirmationCode: `TEST-APT-${tag}-U1`,
        },
        {
          patientId: user.id,
          doctorId: doctors[0].id,
          dateTime: daysFromNow(5, 9, 30),
          status: "pending",
          fee: 50,
          isPaid: false,
          reason: "Diabetes consultation",
          confirmationCode: `TEST-APT-${tag}-U2`,
        },
      ],
    });

    const bookings = await prisma.equipmentBooking.createMany({
      data: [
        {
          patientId: user.id,
          equipmentId: equipment[0].id,
          hospitalId: hospital.id,
          dateTime: daysFromNow(-10, 8),
          status: "completed",
          fee: Number(equipment[0].price) + 50,
          notes: "MRI scan — lower back",
          confirmationCode: `TEST-EQ-${tag}-C1`,
        },
        {
          patientId: user.id,
          equipmentId: equipment[1].id,
          hospitalId: hospital.id,
          dateTime: daysFromNow(2, 15),
          status: "confirmed",
          fee: Number(equipment[1].price) + 50,
          notes: "Chest CT scan",
          confirmationCode: `TEST-EQ-${tag}-U1`,
        },
        {
          patientId: user.id,
          equipmentId: equipment[2].id,
          hospitalId: hospital.id,
          dateTime: daysFromNow(6, 10),
          status: "pending",
          fee: Number(equipment[2].price) + 50,
          notes: "Chest X-ray",
          confirmationCode: `TEST-EQ-${tag}-U2`,
        },
      ],
    });

    console.log(
      `  ✅ ${def.profile.fullName} (${def.phone}) — ${appointments.count} appointments, ${bookings.count} equipment bookings at ${HOSPITAL_NAME}`
    );
  }

  const summary = {
    hospital: hospital.name,
    patients: TEST_PATIENTS.map((p) => p.phone),
    doctors: doctors.map((d) => d.fullName),
    equipment: equipment.map((e) => e.name),
  };
  console.log("\n[SEED-TEST-HISTORY] Done.", JSON.stringify(summary, null, 2));
}

main()
  .catch((e) => {
    console.error("[SEED-TEST-HISTORY] Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });