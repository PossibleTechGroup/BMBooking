const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

function onDate(base, dayOffset, hours = 0, minutes = 0) {
  const d = new Date(base);
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

// ── Hospital Data ────────────────────────────────────────────────────────
const HOSPITALS = [
  { name: "Black Lion Hospital", address: "Addis Ababa, Tichet St", phone: "+251111550000", cardPrice: 200, lat: 9.0153, lng: 38.7546 },
  { name: "St. Paul's Hospital", address: "Addis Ababa, Swaziland St", phone: "+251112750125", cardPrice: 150, lat: 9.0196, lng: 38.7539 },
  { name: "Zewditu Memorial Hospital", address: "Addis Ababa, Filwoha St", phone: "+251111551234", cardPrice: 100, lat: 9.0160, lng: 38.7404 },
  { name: "Hayat Hospital", address: "Addis Ababa, Bole Rd", phone: "+251116610000", cardPrice: 250, lat: 9.0050, lng: 38.7830 },
  { name: "Bethel Teaching Hospital", address: "Addis Ababa, Mexico St", phone: "+251115507070", cardPrice: 150, lat: 9.0050, lng: 38.7400 },
  { name: "St. Gabriel General Hospital", address: "Addis Ababa, Kazanchis", phone: "+251115516060", cardPrice: 50, lat: 9.0100, lng: 38.7650 },
  { name: "Kadisco General Hospital", address: "Addis Ababa, Bole Medhanealem", phone: "+251116620101", cardPrice: 100, lat: 8.9980, lng: 38.7900 },
  { name: "Landmark Hospital", address: "Addis Ababa, Megenagna", phone: "+25111234567", cardPrice: 300, lat: 9.0200, lng: 38.8000 },
];

// ── 5 Real Doctors (from uploaded images) ────────────────────────────────
const DOCTORS = [
  {
    phone: "+251910000001",
    fullName: "Dr. Mulualem Gessese",
    email: "mulualem.gessese@bm-booking.com",
    specialization: "Cardiology",
    specializations: ["Cardiology", "Internal Medicine"],
    licenseNumber: "MD-10001",
    experienceYears: 15,
    bio: "Experienced cardiologist specializing in interventional cardiology and cardiac rehabilitation.",
    hospitalIdx: 0,
    clinicName: "Gessese Heart Clinic",
    clinicAddress: "Bole, Addis Ababa",
    languages: ["Amharic", "English"],
    profilePicture: "/uploads/Mulualem_Gessese.png",
  },
  {
    phone: "+251910000002",
    fullName: "Dr. Menberu",
    email: "menberu@bm-booking.com",
    specialization: "Pediatrics",
    specializations: ["Pediatrics", "Family Medicine"],
    licenseNumber: "MD-10002",
    experienceYears: 10,
    bio: "Compassionate pediatrician dedicated to child health, development, and preventive care.",
    hospitalIdx: 1,
    clinicName: "Menberu Child Health Center",
    clinicAddress: "Kazanchis, Addis Ababa",
    languages: ["Amharic", "English", "Oromiffa"],
    profilePicture: "/uploads/Menberu.jpg",
  },
  {
    phone: "+251910000003",
    fullName: "Dr. MIftah Dellil",
    email: "miftah.dellil@bm-booking.com",
    specialization: "Orthopedics",
    specializations: ["Orthopedics", "General Surgery"],
    licenseNumber: "MD-10003",
    experienceYears: 12,
    bio: "Skilled orthopedic surgeon specializing in joint replacement, trauma, and sports injuries.",
    hospitalIdx: 2,
    clinicName: "Dellil Orthopedic Clinic",
    clinicAddress: "Piazza, Addis Ababa",
    languages: ["Amharic", "English"],
    profilePicture: "/uploads/MIftah_Dellil.png",
  },
  {
    phone: "+251910000004",
    fullName: "Dr. Elshaday",
    email: "elshaday@bm-booking.com",
    specialization: "Dermatology",
    specializations: ["Dermatology", "Cosmetic Medicine"],
    licenseNumber: "MD-10004",
    experienceYears: 8,
    bio: "Expert dermatologist focusing on skin care, cosmetic dermatology, and dermatologic surgery.",
    hospitalIdx: 3,
    clinicName: "Elshaday Skin & Beauty Clinic",
    clinicAddress: "Bole, Addis Ababa",
    languages: ["Amharic", "English"],
    profilePicture: "/uploads/elshaday.png",
  },
  {
    phone: "+251910000005",
    fullName: "Dr. Paulos Shume",
    email: "paulos.shume@bm-booking.com",
    specialization: "Neurology",
    specializations: ["Neurology", "Psychiatry"],
    licenseNumber: "MD-10005",
    experienceYears: 18,
    bio: "Senior neurologist with expertise in stroke, epilepsy, and neurodegenerative disorders.",
    hospitalIdx: 4,
    clinicName: "Shume Neurology Center",
    clinicAddress: "Megenagna, Addis Ababa",
    languages: ["Amharic", "English"],
    profilePicture: "/uploads/paulos_shume.jpg",
  },
];

// ── Patient Data ─────────────────────────────────────────────────────────
const PATIENT_FIRST_M = ["Abebe","Dawit","Brook","Mulugeta","Yohannes","Tewodros","Bereket","Ephrem","Girma","Haile"];
const PATIENT_FIRST_F = ["Helen","Tigist","Sara","Hiwot","Meron","Bethlehem","Rahel","Kidist","Selamawit","Mahlet"];
const PATIENT_LAST = ["Yohannes","Tadesse","Belay","Girmay","Kebede","Alemu","Tesfaye","Abera","Wolde","Desta"];
const BLOOD_TYPES = ["A+","A-","B+","B-","AB+","AB-","O+","O-"];

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
      data: { hospitalId: h.id, amount: 150.0 },
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
    { phone: "+251933000000", username: "receptionist_bl", hospitalIdx: 0 },
    { phone: "+251933000001", username: "receptionist_sp", hospitalIdx: 1 },
    { phone: "+251933000002", username: "receptionist_zw", hospitalIdx: 2 },
  ];
  const receptionists = [];
  const receptionistPassword = await bcrypt.hash("password123", 10);
  for (const r of receptionistDefs) {
    const u = await upsertUser(r.phone, {
      phone: r.phone, email: `${r.username}@bm-booking.com`,
      username: r.username, password: receptionistPassword, role: "receptionist",
    });
    const profile = await prisma.receptionistProfile.create({
      data: { userId: u.id, hospitalId: hospitals[r.hospitalIdx].id },
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

  // ── 5. Patients (20) ──────────────────────────────────────────────────
  const patients = [];
  for (let i = 0; i < 20; i++) {
    const isFemale = Math.random() > 0.5;
    const first = isFemale ? pick(PATIENT_FIRST_F) : pick(PATIENT_FIRST_M);
    const last = pick(PATIENT_LAST);
    const phone = `+2519${String(70000000 + i).padStart(8, "0")}`;
    const year = 1970 + rand(0, 40);
    const month = rand(1, 12);
    const day = rand(1, 28);
    try {
      const u = await prisma.user.create({
        data: {
          phone, email: `${first.toLowerCase()}.${last.toLowerCase()}${i}@email.com`,
          password: "password123", role: "patient",
          patientProfile: {
            create: {
              fullName: `${first} ${last}`, gender: isFemale ? "FEMALE" : "MALE",
              bloodType: pick(BLOOD_TYPES), dateOfBirth: new Date(year, month - 1, day),
              emergencyContact: `+2519${String(80000000 + rand(0, 9999)).padStart(8, "0")}`,
            },
          },
        },
      });
      patients.push(u);
    } catch (e) { /* skip duplicates */ }
  }
  console.log(`  ✅ Patients (${patients.length} created)`);

  // ── 6. Medical Equipment ──────────────────────────────────────────────
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

  // ── 7. Doctor Schedules + Slots — full week, working hours (8:00–17:00) ──
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
    patients: await prisma.patientProfile.count(),
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
    "\n\n📋 All 5 doctors have schedules Mon-Fri 8:00-17:00 for 4 weeks."
  );
}

main()
  .catch((e) => { console.error("❌ [SEED] Error:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
