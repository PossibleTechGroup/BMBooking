const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const { ALL_PERMISSIONS } = require("../src/config/permissions");
const prisma = new PrismaClient();

function onDate(base, dayOffset, hours = 0, minutes = 0) {
  const d = new Date(base);
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

// ── Hospital Data ────────────────────────────────────────────────────────
const HOSPITALS = [
  { name: "Black Lion Hospital", address: "Addis Ababa, Tichet St", phone: "+251111550000", cardPrice: 50, lat: 9.0153, lng: 38.7546 },
  { name: "St. Paul's Hospital", address: "Addis Ababa, Swaziland St", phone: "+251112750125", cardPrice: 50, lat: 9.0196, lng: 38.7539 },
  { name: "Zewditu Memorial Hospital", address: "Addis Ababa, Filwoha St", phone: "+251111551234", cardPrice: 50, lat: 9.0160, lng: 38.7404 },
  { name: "Hayat Hospital", address: "Addis Ababa, Bole Rd", phone: "+251116610000", cardPrice: 50, lat: 9.0050, lng: 38.7830 },
  { name: "Bethel Teaching Hospital", address: "Addis Ababa, Mexico St", phone: "+251115507070", cardPrice: 50, lat: 9.0050, lng: 38.7400 },
  { name: "St. Gabriel General Hospital", address: "Addis Ababa, Kazanchis", phone: "+251115516060", cardPrice: 50, lat: 9.0100, lng: 38.7650 },
  { name: "Kadisco General Hospital", address: "Addis Ababa, Bole Medhanealem", phone: "+251116620101", cardPrice: 50, lat: 8.9980, lng: 38.7900 },
  { name: "Landmark Hospital", address: "Addis Ababa, Megenagna", phone: "+25111234567", cardPrice: 50, lat: 9.0200, lng: 38.8000 },
];

// ── 9 Real Doctors (from uploaded images) ──────────────────────────────
// NOTE: intentionally no doctor is assigned to Zewditu Memorial Hospital (Zmezem), index 2.
const DOCTORS = [
  {
    phone: "+251910000001",
    fullName: "Dr. Kefelegn Dejene",
    email: "kefelegn.dejene@bm-booking.com",
    specialization: "Cardiology",
    specializations: ["Cardiology", "Internal Medicine"],
    licenseNumber: "MD-10001",
    experienceYears: 16,
    bio: "Senior cardiologist with expertise in interventional cardiology and advanced cardiac imaging.",
    hospitalIdx: 0,
    clinicName: "Dejene Heart Clinic",
    clinicAddress: "Tichet St, Addis Ababa",
    languages: ["Amharic", "English"],
    profilePicture: "https://drkefecardio.com/images/AboutUs/9d10b8d9-7165-4784-b3aa-c4ecdb98d018.jpg",
  },
  {
    phone: "+251910000002",
    fullName: "Dr. Nathan Muluberhan",
    email: "nathan.muluberhan@bm-booking.com",
    specialization: "Emergency & Critical Care",
    specializations: ["Emergency & Critical Care", "Internal Medicine"],
    licenseNumber: "MD-10002",
    experienceYears: 11,
    bio: "Emergency and critical care specialist focused on resuscitation, trauma, and ICU management.",
    hospitalIdx: 1,
    clinicName: "Muluberhan Emergency Clinic",
    clinicAddress: "Swaziland St, Addis Ababa",
    languages: ["Amharic", "English"],
    profilePicture: "https://www.ethiopianmedicalass.org/wp-content/uploads/2023/09/photo_5807729501948460841_x.jpg",
  },
  {
    phone: "+251910000003",
    fullName: "Dr. Samson Bassa",
    email: "samson.bassa@bm-booking.com",
    specialization: "Internal Medicine",
    specializations: ["Internal Medicine", "General Medicine"],
    licenseNumber: "MD-10003",
    experienceYears: 14,
    bio: "Internal medicine physician dedicated to diagnosis and management of complex adult conditions.",
    hospitalIdx: 3,
    clinicName: "Bassa Internal Medicine Center",
    clinicAddress: "Bole Rd, Addis Ababa",
    languages: ["Amharic", "English"],
    profilePicture: "https://amcethiopia.com/images/v/dr-samson-780.jpg",
  },
  {
    phone: "+251910000004",
    fullName: "Dr. Wubshet Jote Tolossa",
    email: "wubshet.tolossa@bm-booking.com",
    specialization: "Nephrology",
    specializations: ["Nephrology", "Internal Medicine"],
    licenseNumber: "MD-10004",
    experienceYears: 12,
    bio: "Nephrologist specializing in kidney disease, dialysis, and hypertension management.",
    hospitalIdx: 4,
    clinicName: "Tolossa Kidney Care Clinic",
    clinicAddress: "Mexico St, Addis Ababa",
    languages: ["Amharic", "English"],
    profilePicture: "https://healthequity.atlanticfellows.org/wp-content/uploads/2025/08/Tolossa_Wubshet--scaled.jpg",
  },
  {
    phone: "+251910000005",
    fullName: "Dr. Abdu Adem Yesufe",
    email: "abdu.yesufe@bm-booking.com",
    specialization: "Oncology",
    specializations: ["Oncology", "Internal Medicine"],
    licenseNumber: "MD-10005",
    experienceYears: 13,
    bio: "Medical oncologist focused on cancer diagnosis, chemotherapy, and supportive care.",
    hospitalIdx: 1,
    clinicName: "Yesufe Oncology Center",
    clinicAddress: "Swaziland St, Addis Ababa",
    languages: ["Amharic", "English"],
    profilePicture: "https://oncodaily.com/pub/uploads/2025/07/St.-Pauls-Hospital-Millennium-Medical-College.jpg",
  },
  {
    phone: "+251910000006",
    fullName: "Dr. Eden Haileselassie",
    email: "eden.haileselassie@bm-booking.com",
    specialization: "General Medicine",
    specializations: ["General Medicine", "Family Medicine"],
    licenseNumber: "MD-10006",
    experienceYears: 9,
    bio: "General practitioner offering comprehensive primary and preventive care for all ages.",
    hospitalIdx: 5,
    clinicName: "Haileselassie Family Clinic",
    clinicAddress: "Kazanchis, Addis Ababa",
    languages: ["Amharic", "English"],
    profilePicture: "https://www.amcethiopia.com/images/n/dr-eden-780.jpg",
  },
  {
    phone: "+251910000007",
    fullName: "Dr. Selamawit Tariku",
    email: "selamawit.tariku@bm-booking.com",
    specialization: "Radiology",
    specializations: ["Radiology", "Diagnostic Imaging"],
    licenseNumber: "MD-10007",
    experienceYears: 10,
    bio: "Radiologist specializing in diagnostic imaging, MRI, CT, and interventional radiology.",
    hospitalIdx: 6,
    clinicName: "Tariku Imaging Center",
    clinicAddress: "Bole Medhanealem, Addis Ababa",
    languages: ["Amharic", "English"],
    profilePicture: "https://amcethiopia.com/images/n/dr-selamawit-780.jpg",
  },
  {
    phone: "+251910000008",
    fullName: "Dr. Mahlet Tadesse",
    email: "mahlet.tadesse@bm-booking.com",
    specialization: "Endocrinology",
    specializations: ["Endocrinology", "Internal Medicine"],
    licenseNumber: "MD-10008",
    experienceYears: 11,
    bio: "Endocrinologist specialized in diabetes, thyroid disorders, and hormonal imbalances.",
    hospitalIdx: 7,
    clinicName: "Tadesse Endocrine Clinic",
    clinicAddress: "Megenagna, Addis Ababa",
    languages: ["Amharic", "English"],
    profilePicture: "https://amcethiopia.com/images/r/dr-mahlet-780.jpg",
  },
  {
    phone: "+251910000009",
    fullName: "Dr. Samrawit Girma",
    email: "samrawit.girma@bm-booking.com",
    specialization: "General Medicine",
    specializations: ["General Medicine", "Internal Medicine"],
    licenseNumber: "MD-10009",
    experienceYears: 7,
    bio: "General medicine physician providing patient-centered outpatient and hospital care.",
    hospitalIdx: 0,
    clinicName: "Girma Primary Care Clinic",
    clinicAddress: "Tichet St, Addis Ababa",
    languages: ["Amharic", "English"],
    profilePicture: "https://www.soddo.org/wp-content/uploads/2025/03/Samrawit-Girma-Medical-Doctor-1024x1024.jpg",
  },
];

// ── Equipment Data ───────────────────────────────────────────────────────
const EQUIPMENT_DEFS = [
  { name: "Siemens MAGNETOM Vida 3T", cat: "MRI", dur: 45, price: 5000, desc: "3T MRI with BioMatrix technology for personalized scanning.", photo: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800" },
  { name: "GE SIGNA Premier 3.0T", cat: "MRI", dur: 45, price: 4800, desc: "High-field MRI with AIR coils for superior image quality.", photo: "https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800" },
  { name: "Philips Ingenia Elition 3.0T", cat: "MRI", dur: 40, price: 4500, desc: "Digital MRI with dStream technology for accelerated scanning.", photo: "https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=800" },
  { name: "Siemens MAGNETOM Aera 1.5T", cat: "MRI", dur: 40, price: 3500, desc: "Tim 4G 1.5T MRI with 70cm wide bore for patient comfort.", photo: "https://images.unsplash.com/photo-1579154204601-01588f351e67?w=800" },
  { name: "GE SIGNA Explorer 1.5T", cat: "MRI", dur: 35, price: 3000, desc: "Value 1.5T MRI optimized for routine clinical imaging.", photo: "https://images.unsplash.com/photo-1530497610245-94d3c16cda28?w=800" },
  { name: "Canon Vantage Galan 3T", cat: "MRI", dur: 45, price: 4700, desc: "3T MRI with AIR sound technology for quiet scanning.", photo: "https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=800" },
  { name: "GE Revolution CT 256-slice", cat: "CT_SCAN", dur: 15, price: 1500, desc: "256-slice CT with ASiR-V for low-dose cardiac imaging.", photo: "https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800" },
  { name: "Siemens SOMATOM Force", cat: "CT_SCAN", dur: 15, price: 1800, desc: "Dual-source CT with Stellar detectors for cardiac and trauma.", photo: "https://images.unsplash.com/photo-1579154204601-01588f351e67?w=800" },
  { name: "Philips Incisive CT", cat: "CT_SCAN", dur: 10, price: 1200, desc: "Core128 CT with smart workflow for fast, consistent results.", photo: "https://images.unsplash.com/photo-1530497610245-94d3c16cda28?w=800" },
  { name: "Canon Aquilion ONE SP", cat: "CT_SCAN", dur: 15, price: 1600, desc: "320-row volume CT covering the entire organ in one rotation.", photo: "https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=800" },
  { name: "GE Voluson E10", cat: "ULTRASOUND", dur: 30, price: 300, desc: "Premium OB/GYN ultrasound with HDlive rendering.", photo: "https://images.unsplash.com/photo-1551076805-e1869033e561?w=800" },
  { name: "Philips EPIQ Elite", cat: "ULTRASOUND", dur: 30, price: 350, desc: "Advanced diagnostic ultrasound with nSIGHT imaging.", photo: "https://images.unsplash.com/photo-1581093450021-4a7360e9a6b5?w=800" },
  { name: "Siemens ACUSON Juniper", cat: "ULTRASOUND", dur: 25, price: 250, desc: "Point-of-care ultrasound with mobile cart design.", photo: "https://images.unsplash.com/photo-1559757175-5700dde675bc?w=800" },
  { name: "Samsung HERA W10", cat: "ULTRASOUND", dur: 30, price: 280, desc: "Women's health ultrasound with 5D imaging technology.", photo: "https://images.unsplash.com/photo-1551076805-e1869033e561?w=800" },
  { name: "Siemens Ysio Maxima", cat: "XRAY", dur: 15, price: 150, desc: "Digital radiography system with PRIME technology.", photo: "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=800" },
  { name: "GE AMX 700", cat: "XRAY", dur: 10, price: 100, desc: "Portable digital X-ray for bedside and ICU imaging.", photo: "https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800" },
  { name: "Philips DigitalDiagnost C50", cat: "XRAY", dur: 15, price: 130, desc: "Ceiling-mounted DR system with Eleva workflow.", photo: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800" },
  { name: "Fresenius 5008S", cat: "DIALYSIS", dur: 240, price: 200, desc: "Online hemodiafiltration system with AutoSub Plus.", photo: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800" },
  { name: "NxStage System One", cat: "DIALYSIS", dur: 180, price: 180, desc: "Portable home hemodialysis system for flexible treatment.", photo: "https://images.unsplash.com/photo-1583912086096-8c60d75a53f9?w=800" },
  { name: "Baxter Prismaflex", cat: "DIALYSIS", dur: 240, price: 220, desc: "CRRT system for continuous renal replacement therapy.", photo: "https://images.unsplash.com/photo-1581093458791-9d42e3c7e117?w=800" },
  { name: "Hamilton C6", cat: "VENTILATOR", dur: 60, price: 200, desc: "Intelligent ventilation with IntelliSync+ algorithm.", photo: "https://images.unsplash.com/photo-1584982751601-97dcc096659c?w=800" },
  { name: "Drager Evita V500", cat: "VENTILATOR", dur: 60, price: 180, desc: "ICU ventilator with automated weaning protocol.", photo: "https://images.unsplash.com/photo-1581093458791-9d42e3c7e117?w=800" },
  { name: "Philips V680", cat: "VENTILATOR", dur: 60, price: 190, desc: "High-acuity ventilator with Auto-Trak sensitivity.", photo: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800" },
  { name: "GE MAC 2000", cat: "ECG", dur: 15, price: 50, desc: "Resting 12-lead ECG with MUSE integration.", photo: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800" },
  { name: "Philips PageWriter TC70", cat: "ECG", dur: 15, price: 60, desc: "12-lead ECG with DX analysis and interpretive comments.", photo: "https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800" },
  { name: "Hologic 3Dimensions", cat: "MAMMOGRAPHY", dur: 20, price: 250, desc: "3D mammography with SmartCurve comfort technology.", photo: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800" },
  { name: "Siemens MAMMOMAT Inspiration", cat: "MAMMOGRAPHY", dur: 20, price: 220, desc: "Digital mammography with AEC and dose optimization.", photo: "https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=800" },
  { name: "Philips HeartStart FR3", cat: "DEFIBRILLATOR", dur: 5, price: 30, desc: "AED with real-time CPR guidance and pre-connected pads.", photo: "https://images.unsplash.com/photo-1584982751601-97dcc096659c?w=800" },
  { name: "ZOLL X Series", cat: "DEFIBRILLATOR", dur: 5, price: 35, desc: "Advanced monitor/defibrillator with Real CPR Help.", photo: "https://images.unsplash.com/photo-1581093458791-9d42e3c7e117?w=800" },
];

async function main() {
  console.log("🌱 [SEED] Starting fresh database seed...");

  async function upsertUser(phone, data) {
    return prisma.user.upsert({ where: { phone }, update: {}, create: data });
  }
  async function upsertByEmail(email, data) {
    return prisma.user.upsert({ where: { email }, update: {}, create: data });
  }

  // ── Clear ALL existing data ────────────────────────────────────────────
  console.log("  🧹 Clearing all existing data...");
  await prisma.equipmentAnnouncement.deleteMany({});
  await prisma.equipmentBooking.deleteMany({});
  await prisma.medicalEquipment.deleteMany({});
  await prisma.review.deleteMany({});
  await prisma.appointment.deleteMany({});
  await prisma.scheduleSlot.deleteMany({});
  await prisma.doctorSchedule.deleteMany({});
  await prisma.card.deleteMany({});
  await prisma.cardTemplate.deleteMany({});
  await prisma.paymentMethod.deleteMany({});
  await prisma.wallet.deleteMany({});
  await prisma.transaction.deleteMany({});
  await prisma.withdrawalRequest.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.announcement.deleteMany({});
  await prisma.serviceFee.deleteMany({});
  await prisma.patientProfile.deleteMany({});
  await prisma.receptionistProfile.deleteMany({});
  await prisma.doctorProfile.deleteMany({});
  await prisma.hospitalApplication.deleteMany({});
  await prisma.oTP.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.hospital.deleteMany({});
  console.log("  ✅ All data cleared");

  // ── 1. Hospitals ──────────────────────────────────────────────────────
  const hospitals = [];
  for (const hd of HOSPITALS) {
    const h = await prisma.hospital.create({
      data: {
        name: hd.name, address: hd.address, phone: hd.phone,
        latitude: hd.lat, longitude: hd.lng, cardPrice: hd.cardPrice,
      },
    });
    await prisma.serviceFee.create({
      data: { hospitalId: h.id, amount: 50.0 },
    });
    hospitals.push(h);
  }
  console.log("  ✅ Hospitals (8)");

  // ── 2. Admin ─────────────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash("password123", 10);
  await upsertByEmail("admin@bm-booking.com", {
    email: "admin@bm-booking.com", password: adminPassword, role: "admin",
  });
  console.log("  ✅ Admin");

  // ── 3. Receptionists ──────────────────────────────────────────────────
  const receptionistDefs = [
    { phone: "+251933000000", username: "receptionist_bl", hospitalIdx: 0, permissions: ALL_PERMISSIONS },
    { phone: "+251933000001", username: "receptionist_sp", hospitalIdx: 1, permissions: ALL_PERMISSIONS },
    { phone: "+251933000002", username: "receptionist_zw", hospitalIdx: 2, permissions: ALL_PERMISSIONS },
  ];
  const receptionists = [];
  const receptionistPassword = await bcrypt.hash("password123", 10);
  for (const r of receptionistDefs) {
    const u = await upsertUser(r.phone, {
      phone: r.phone, email: `${r.username}@bm-booking.com`,
      username: r.username, password: receptionistPassword, role: "receptionist",
    });
    const profile = await prisma.receptionistProfile.create({
      data: { userId: u.id, hospitalId: hospitals[r.hospitalIdx].id, permissions: r.permissions },
    });
    receptionists.push({ user: u, profile });
  }
  console.log("  ✅ Receptionists (3)");

  // ── 4. 5 Real Doctors ─────────────────────────────────────────────────
  const doctors = [];
  const doctorPassword = await bcrypt.hash("password123", 10);
  for (let i = 0; i < DOCTORS.length; i++) {
    const d = DOCTORS[i];
    const user = await prisma.user.create({
      data: {
        phone: d.phone, email: d.email, password: doctorPassword, role: "doctor",
        doctorProfile: {
          create: {
            fullName: d.fullName, specialization: d.specialization,
            specializations: d.specializations, licenseNumber: d.licenseNumber,
            experienceYears: d.experienceYears, bio: d.bio,
            status: "Approved", hospitalId: hospitals[d.hospitalIdx].id,
            clinicName: d.clinicName, clinicAddress: d.clinicAddress,
            languages: d.languages, profilePicture: d.profilePicture,
            baseHourlyRate: 50.00, rating: 4.5, totalReviews: 0,
          },
        },
      },
    });
    const profile = await prisma.doctorProfile.findUnique({ where: { userId: user.id } });
    doctors.push(profile);
    console.log(`  ✅ ${d.fullName} — ${d.specialization} — 50 ETB`);
  }

  // ── 5. Medical Equipment ──────────────────────────────────────────────
  const equipmentList = [];
  for (let i = 0; i < EQUIPMENT_DEFS.length; i++) {
    const e = EQUIPMENT_DEFS[i];
    const hospIdx = i % hospitals.length;
    const days = {
      monday: { open: "08:00", close: "17:00" },
      tuesday: { open: "08:00", close: "17:00" },
      wednesday: { open: "08:00", close: "17:00" },
      thursday: { open: "08:00", close: "17:00" },
      friday: { open: "08:00", close: "17:00" },
    };
    if (Math.random() > 0.4) days.saturday = { open: "09:00", close: "13:00" };
    const eq = await prisma.medicalEquipment.create({
      data: {
        name: e.name, category: e.cat, hospitalId: hospitals[hospIdx].id,
        duration: e.dur, price: e.price, operatingHours: days,
        isOperational: true, description: e.desc, photo: e.photo,
      },
    });
    equipmentList.push(eq);
  }
  console.log(`  ✅ Equipment (${equipmentList.length} created)`);

  // ── 6. Doctor Schedules + Slots — full week, working hours (8:00–17:00) ──
  //     Each doctor gets a schedule for the next 4 weeks, Mon–Fri
  //     Each schedule gets 30-min slots from 8:00 to 17:00 (18 slots/day)
  const today = new Date(); today.setHours(0, 0, 0, 0);
  let scheduleCount = 0;
  let slotCount = 0;
  for (const doctor of doctors) {
    for (let week = 0; week < 4; week++) {
      for (let day = 1; day <= 5; day++) { // Mon=1 .. Fri=5
        const dayOffset = (week * 7) + day - today.getDay();
        if (dayOffset < 0) continue;
        const date = onDate(today, dayOffset);
        const startTime = onDate(date, 0, 8, 0);
        const endTime = onDate(date, 0, 17, 0);
        const schedule = await prisma.doctorSchedule.create({
          data: {
            doctorId: doctor.id,
            hospitalId: doctor.hospitalId,
            date,
            startTime,
            endTime,
            slotDuration: 30,
            maxPatientsPerSlot: 1,
            isActive: true,
            clinicRoom: `Room ${100 + doctor.id}`,
          },
        });
        scheduleCount++;

        // Create 30-min slots from 08:00 to 17:00 (18 slots)
        for (let h = 8; h < 17; h++) {
          for (let m = 0; m < 60; m += 30) {
            const slotStart = onDate(date, 0, h, m);
            const slotEnd = onDate(date, 0, h, m + 30);
            if (slotEnd > endTime) break;
            await prisma.scheduleSlot.create({
              data: {
                scheduleId: schedule.id,
                startTime: slotStart,
                endTime: slotEnd,
                maxPatients: 1,
              },
            });
            slotCount++;
          }
        }
      }
    }
  }
  console.log(`  ✅ Doctor Schedules (${scheduleCount} created — Mon-Fri, 8:00-17:00, 4 weeks)`);
  console.log(`  ✅ Schedule Slots (${slotCount} created — 30-min slots per schedule)`);

  // ── Summary ───────────────────────────────────────────────────────────
  const counts = {
    hospitals: await prisma.hospital.count(),
    receptionists: await prisma.receptionistProfile.count(),
    doctors: await prisma.doctorProfile.count(),
    equipment: await prisma.medicalEquipment.count(),
    schedules: await prisma.doctorSchedule.count(),
    slots: await prisma.scheduleSlot.count(),
  };
  console.log("\n📊 Seed Summary:", counts);
  console.log(
    "\n🔑 Login credentials:\n" +
    "  Admin:                    email=admin@bm-booking.com, password=password123\n" +
    "  Receptionist (Black Lion): username=receptionist_bl, password=password123\n" +
    "  Receptionist (St. Paul):   username=receptionist_sp, password=password123\n" +
    "  Receptionist (Zewditu):    username=receptionist_zw, password=password123\n" +
    "  Doctors:                  password=password123 (phone numbers below)\n" +
    DOCTORS.map(d => `    ${d.fullName}: ${d.phone} — 50 ETB/visit`).join("\n") +
    "\n\n📋 All 9 doctors have schedules Mon-Fri 8:00-17:00 for 4 weeks (none at Zmezem/Zewditu)."
  );
}

main()
  .catch((e) => { console.error("❌ [SEED] Error:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
