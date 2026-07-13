const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

function todayAt(hours, minutes = 0, seconds = 0) {
  const d = new Date();
  d.setHours(hours, minutes, seconds, 0);
  return d;
}

function onDate(base, dayOffset, hours = 0, minutes = 0) {
  const d = new Date(base);
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

// ── Ethiopian doctor data ──────────────────────────────────────────────
const FIRST_NAMES_M = ["Abebe","Dawit","Brook","Mulugeta","Yohannes","Tewodros","Bereket","Ephrem","Girma","Haile","Kebede","Lemma","Fikre","Solomon","Mesfin","Tekle","Alemayehu","Biniam","Daniel","Getachew","Henok","Kaleab","Mikael","Nahom","Robel","Samuel","Tadesse","Yared","Zelalem","Amanuel"];
const FIRST_NAMES_F = ["Helen","Tigist","Sara","Hiwot","Meron","Bethlehem","Rahel","Kidist","Selamawit","Mahlet","Lydia","Eden","Feven","Meseret","Yeshi","Aida","Bezawit","Hermela","Nardos","Ruth"];
const LAST_NAMES = ["Yohannes","Tadesse","Belay","Girmay","Kebede","Alemu","Tesfaye","Abera","Wolde","Desta","Mengistu","Hailu","Gebre","Bogale","Assefa","Bekele","Demeke","Eshetu","Ferede","Getahun","Habte","Kassa","Melaku","Negash","Seyoum","Tilahun","Worku","Zewde","Ayele","Berhane"];

const SPECIALIZATIONS = [
  "Cardiology","Dermatology","Neurology","Pediatrics","Orthopedics",
  "Ophthalmology","Gynecology","Urology","Psychiatry","Oncology",
  "Gastroenterology","Pulmonology","Nephrology","Endocrinology","Rheumatology",
  "ENT","General Surgery","Internal Medicine","Family Medicine","Emergency Medicine",
];

const BIOS = [
  "Dedicated to providing compassionate, evidence-based care.",
  "Passionate about advancing medical practice through research.",
  "Committed to patient-centered healthcare with years of experience.",
  "Specializing in minimally invasive treatment approaches.",
  "Known for thorough diagnostics and personalized treatment plans.",
  "Experienced in both clinical practice and medical education.",
  "Focused on preventive care and holistic patient wellness.",
  "Expert in managing complex and chronic conditions.",
  "Award-winning physician with international training.",
  "Devoted to community health and accessible medical services.",
];

const ADDIS_LOCATIONS = [
  { name: "Bole", lat: 8.9806, lng: 38.7578 },
  { name: "Kazanchis", lat: 9.0147, lng: 38.7634 },
  { name: "Piazza", lat: 9.0340, lng: 38.7470 },
  { name: "Megenagna", lat: 9.0196, lng: 38.8014 },
  { name: "Sarbet", lat: 8.9950, lng: 38.7410 },
  { name: "CMC", lat: 9.0350, lng: 38.8170 },
  { name: "Ayat", lat: 9.0410, lng: 38.8600 },
  { name: "Summit", lat: 8.9700, lng: 38.7280 },
  { name: "Gerji", lat: 8.9880, lng: 38.8050 },
  { name: "Lebu", lat: 8.9400, lng: 38.7200 },
  { name: "Lideta", lat: 9.0100, lng: 38.7350 },
  { name: "Mexico", lat: 9.0050, lng: 38.7400 },
  { name: "Arat Kilo", lat: 9.0350, lng: 38.7600 },
  { name: "Saris", lat: 8.9600, lng: 38.7500 },
  { name: "Kality", lat: 8.9300, lng: 38.7600 },
];

const CLINIC_NAMES = [
  "Private Practice","Selam Clinic","Bethel Medical","Hayat Clinic",
  "Genet Health Center","Addis Clinic","Tena Clinic","Hope Medical",
  "Zema Health","Fasika Clinic","Abyssinia Medical","Ethio-German Clinic",
];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function generateDoctors(count) {
  const docs = [];
  for (let i = 0; i < count; i++) {
    const isFemale = Math.random() > 0.55;
    const first = isFemale ? pick(FIRST_NAMES_F) : pick(FIRST_NAMES_M);
    const last = pick(LAST_NAMES);
    const fullName = `Dr. ${first} ${last}`;
    const spec = pick(SPECIALIZATIONS);
    const loc = pick(ADDIS_LOCATIONS);
    docs.push({
      phone: `+2519${String(30000000 + i).padStart(8, "0")}`,
      fullName,
      spec,
      specs: [spec, ...(Math.random() > 0.6 ? [pick(SPECIALIZATIONS.filter(s => s !== spec))] : [])],
      exp: rand(2, 25),
      rating: +(3.0 + Math.random() * 2).toFixed(1),
      bio: pick(BIOS),
      clinicName: pick(CLINIC_NAMES),
      clinicAddress: `${loc.name}, Addis Ababa`,
      lat: loc.lat + (Math.random() - 0.5) * 0.01,
      lng: loc.lng + (Math.random() - 0.5) * 0.01,
      hospitalIdx: rand(0, 7),
      languages: ["Amharic", "English", ...(Math.random() > 0.7 ? ["Oromiffa"] : [])],
    });
  }
  return docs;
}

async function main() {
  console.log("🌱 [SEED] Starting database seeding...");

  async function upsertUser(phone, data) {
    return prisma.user.upsert({ where: { phone }, update: {}, create: data });
  }
  async function upsertByEmail(email, data) {
    return prisma.user.upsert({ where: { email }, update: {}, create: data });
  }

  // ── 1. Hospitals ──────────────────────────────────────────────────────
  const hospitalNames = [
    "Black Lion Hospital","St. Paul Hospital","Zewditu Hospital","Landmark Hospital",
    "Hayat Hospital","Bethel Teaching Hospital","St. Gabriel General Hospital","Kadisco General Hospital",
  ];
  const cardPrices = [200, 150, 100, 250, 150, 50, 100, 300];
  const hospitals = [];
  for (let hi = 0; hi < hospitalNames.length; hi++) {
    const name = hospitalNames[hi];
    const cp = cardPrices[hi];
    const h = await prisma.hospital.upsert({
      where: { name },
      update: { cardPrice: cp },
      create: { name, address: "Addis Ababa", phone: "+251111000000", latitude: 9.0192 + (Math.random() - 0.5) * 0.01, longitude: 38.7525 + (Math.random() - 0.5) * 0.01, cardPrice: cp },
    });
    await prisma.serviceFee.upsert({
      where: { hospitalId: h.id },
      update: { amount: 150.0 },
      create: { hospitalId: h.id, amount: 150.0 },
    });
    hospitals.push(h);
  }
  console.log("  ✅ Hospitals");

  // ── 2. Patients ───────────────────────────────────────────────────────
  const patientDefs = [
    { phone: "+251911000000", fullName: "Abebe Kebede", email: "abebe@example.com", gender: "MALE" },
    { phone: "+251911000001", fullName: "Sara Tesfaye", email: "sara@example.com", gender: "FEMALE" },
    { phone: "+251911000002", fullName: "Mulugeta Alemu", email: "mulu@example.com", gender: "MALE" },
    { phone: "+251978458870", fullName: "Test User", email: "test@example.com", gender: "MALE" },
    { phone: "+251911000003", fullName: "Hiwot Desta", email: "hiwot@example.com", gender: "FEMALE" },
  ];
  const patients = [];
  for (const p of patientDefs) {
    const u = await upsertUser(p.phone, { phone: p.phone, email: p.email, password: "password123", role: "patient", patientProfile: { create: { fullName: p.fullName, gender: p.gender, bloodType: "O+" } } });
    patients.push(u);
  }
  console.log("  ✅ Patients");

  // ── 3. Receptionists ──────────────────────────────────────────────────
  const receptionistDefs = [
    { phone: "+251933000000", username: "receptionist_bl", hospitalIdx: 0 },
    { phone: "+251933000001", username: "receptionist_sp", hospitalIdx: 1 },
    { phone: "+251933000002", username: "receptionist_zw", hospitalIdx: 2 },
  ];
  const receptionists = [];
  const receptionistPassword = await bcrypt.hash("password123", 10);
  for (const r of receptionistDefs) {
    const u = await upsertUser(r.phone, { phone: r.phone, email: `${r.username}@bm-booking.com`, username: r.username, password: receptionistPassword, role: "receptionist" });
    const existing = await prisma.receptionistProfile.findUnique({ where: { userId: u.id } });
    if (!existing) { await prisma.receptionistProfile.create({ data: { userId: u.id, hospitalId: hospitals[r.hospitalIdx].id } }); }
    const profile = await prisma.receptionistProfile.findUnique({ where: { userId: u.id }, include: { hospital: true } });
    receptionists.push({ user: u, profile });
  }
  console.log("  ✅ Receptionists");

  // ── 3b. Admin ─────────────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash("password123", 10);
  await upsertByEmail("admin@bm-booking.com", { email: "admin@bm-booking.com", password: adminPassword, role: "admin" });
  console.log("  ✅ Admin");

  // ── 4. Doctors (100+) ─────────────────────────────────────────────────
  const doctorDefs = generateDoctors(100);
  const doctors = [];
  for (let i = 0; i < doctorDefs.length; i++) {
    const d = doctorDefs[i];
    const email = d.fullName.toLowerCase().replace(/[ .]+/g, ".").replace("dr.", "") + `${i}@bm-booking.com`;
    try {
      const user = await upsertUser(d.phone, {
        phone: d.phone, email, password: "password123", role: "doctor",
        doctorProfile: {
          create: {
            fullName: d.fullName, specialization: d.spec, specializations: d.specs,
            licenseNumber: "MD-" + String(10000 + i), experienceYears: d.exp,
            bio: d.bio, rating: d.rating, totalReviews: rand(0, 50),
            status: "Approved", hospitalId: hospitals[d.hospitalIdx].id,
            clinicName: d.clinicName, clinicAddress: d.clinicAddress,
            languages: d.languages,
          },
        },
      });
      const profile = await prisma.doctorProfile.findUnique({ where: { userId: user.id } });
      if (profile) doctors.push(profile);
    } catch (e) {
      // Skip duplicates silently
    }
  }
  console.log(`  ✅ Doctors (${doctors.length} created)`);

  // ── 5. Medical Equipment ──────────────────────────────────────────────
  await prisma.equipmentBooking.deleteMany({});
  await prisma.equipmentAnnouncement.deleteMany({});
  await prisma.medicalEquipment.deleteMany({});
  const equipmentDefs = [
    { name: "Siemens Magnetom MRI", cat: "MRI", hospIdx: 0, duration: 45, ops: { monday: { open: "08:00", close: "16:00" }, tuesday: { open: "08:00", close: "16:00" }, wednesday: { open: "08:00", close: "16:00" }, thursday: { open: "08:00", close: "16:00" }, friday: { open: "08:00", close: "16:00" }, saturday: { open: "08:00", close: "13:00" } } },
    { name: "GE Revolution CT", cat: "CT_SCAN", hospIdx: 1, duration: 30, ops: { monday: { open: "07:00", close: "17:00" }, tuesday: { open: "07:00", close: "17:00" }, wednesday: { open: "07:00", close: "17:00" }, thursday: { open: "07:00", close: "17:00" }, friday: { open: "07:00", close: "17:00" }, saturday: { open: "08:00", close: "13:00" } } },
    { name: "Philips ClearVue Ultrasound", cat: "ULTRASOUND", hospIdx: 2, duration: 30, ops: null },
    { name: "Siemens X-Ray Unit", cat: "XRAY", hospIdx: 0, duration: 15, ops: { monday: { open: "09:00", close: "17:00" }, tuesday: { open: "09:00", close: "17:00" }, wednesday: { open: "09:00", close: "17:00" }, thursday: { open: "09:00", close: "17:00" }, friday: { open: "09:00", close: "17:00" } } },
  ];
  const equipmentList = [];
  for (const e of equipmentDefs) {
    const eq = await prisma.medicalEquipment.create({ data: { name: e.name, category: e.cat, hospitalId: hospitals[e.hospIdx].id, duration: e.duration, operatingHours: e.ops, isOperational: true } });
    equipmentList.push(eq);
  }
  console.log("  ✅ Equipment");

  // ── 7. Doctor Schedules ───────────────────────────────────────────────
  await prisma.doctorSchedule.deleteMany({});
  const today = new Date(); today.setHours(0, 0, 0, 0);
  for (let i = 0; i < Math.min(doctors.length, 20); i++) {
    for (let dayOff = 0; dayOff < 3; dayOff++) {
      const date = onDate(today, dayOff);
      const startH = rand(8, 10);
      await prisma.doctorSchedule.create({
        data: { doctorId: doctors[i].id, date, startTime: new Date(date.getTime() + startH * 3600000), endTime: new Date(date.getTime() + (startH + rand(4, 8)) * 3600000), slotDuration: 30, clinicRoom: `Room ${rand(100, 400)}`, isActive: true },
      });
    }
  }
  console.log("  ✅ Doctor Schedules");

  // ── 8. Appointments ───────────────────────────────────────────────────
  await prisma.appointment.deleteMany({});
  const blReceptionist = receptionists[0].profile;
  const appointmentDefs = [
    { patientIdx: 0, doctorIdx: 0, dayOffset: 0, hour: 9, minute: 30, status: "pending", reason: "Chest pain and shortness of breath", issueCategory: "cardiology" },
    { patientIdx: 1, doctorIdx: 0, dayOffset: 0, hour: 10, minute: 0, status: "pending", reason: "Regular heart checkup" },
    { patientIdx: 2, doctorIdx: 1, dayOffset: 0, hour: 11, minute: 0, status: "pending", reason: "Persistent skin rash", issueCategory: "dermatology" },
    { patientIdx: 0, doctorIdx: 0, dayOffset: 1, hour: 9, minute: 0, status: "pending", reason: "Follow-up on ECG results" },
    { patientIdx: 0, doctorIdx: 1, dayOffset: 0, hour: 14, minute: 0, status: "accepted", reviewedById: blReceptionist.id, reason: "Skin allergy consultation" },
    { patientIdx: 1, doctorIdx: 0, dayOffset: 0, hour: 11, minute: 0, status: "accepted", reviewedById: blReceptionist.id, reason: "Heart murmur evaluation" },
    { patientIdx: 0, doctorIdx: 0, dayOffset: -1, hour: 9, minute: 0, status: "completed", reviewedById: blReceptionist.id, reason: "Chest pain", notes: "Patient responded well" },
    { patientIdx: 1, doctorIdx: 1, dayOffset: -1, hour: 10, minute: 0, status: "completed", reviewedById: blReceptionist.id, reason: "Skin checkup" },
  ];
  const appointments = [];
  for (const a of appointmentDefs) {
    const dt = onDate(today, a.dayOffset, a.hour, a.minute);
    const appt = await prisma.appointment.create({
      data: {
        patientId: patients[a.patientIdx].id, doctorId: doctors[a.doctorIdx].id, dateTime: dt,
        status: a.status, fee: hospitals[doctorDefs[a.doctorIdx]?.hospitalIdx]?.cardPrice ? Number(hospitals[doctorDefs[a.doctorIdx].hospitalIdx].cardPrice) : 200,
        isPaid: ["completed", "accepted"].includes(a.status), reason: a.reason || null,
        issueCategory: a.issueCategory || null, notes: a.notes || null,
        declineReason: a.declineReason || null,
        reviewedByReceptionistId: a.reviewedById ?? null, reviewedAt: a.reviewedById ? new Date() : null, duration: 30,
      },
    });
    appointments.push(appt);
  }
  console.log("  ✅ Appointments");

  // ── 9. Reviews ────────────────────────────────────────────────────────
  await prisma.review.deleteMany({});
  const reviewComments = [
    "Excellent doctor, highly recommend!", "Very thorough and professional.",
    "Great bedside manner.", "Long wait but worth it.", "Attentive and caring.",
    "Explained everything clearly.", "Would visit again.", "Fantastic experience.",
    "Very knowledgeable.", "Made me feel comfortable.",
  ];
  // Create reviews linked to completed appointments
  for (let i = 0; i < Math.min(appointments.length, 60); i++) {
    const appt = appointments[i];
    if (appt.status !== "completed") continue;
    const numReviews = rand(0, 1);
    for (let j = 0; j < numReviews; j++) {
      await prisma.review.create({
        data: { rating: rand(3, 5), comment: pick(reviewComments), patientId: appt.patientId, doctorId: appt.doctorId, appointmentId: appt.id },
      });
    }
  }
  // Recalculate doctor averages
  for (const doctor of doctors) {
    const all = await prisma.review.findMany({ where: { doctorId: doctor.id } });
    if (all.length > 0) {
      const avg = all.reduce((acc, curr) => acc + curr.rating, 0) / all.length;
      await prisma.doctorProfile.update({ where: { id: doctor.id }, data: { rating: avg, totalReviews: all.length } });
    }
  }
  console.log("  ✅ Reviews");

  // ── 10. Equipment Bookings ─────────────────────────────────────────────
  const bookingDefs = [
    { patientIdx: 0, equipmentIdx: 0, dayOffset: 0, hour: 10, minute: 0, status: "pending" },
    { patientIdx: 1, equipmentIdx: 0, dayOffset: 0, hour: 11, minute: 0, status: "pending" },
    { patientIdx: 2, equipmentIdx: 0, dayOffset: 0, hour: 14, minute: 0, status: "confirmed", reviewedById: blReceptionist.id },
    { patientIdx: 0, equipmentIdx: 3, dayOffset: 0, hour: 9, minute: 0, status: "pending" },
  ];
  for (const b of bookingDefs) {
    const dt = onDate(today, b.dayOffset, b.hour, b.minute);
    await prisma.equipmentBooking.create({
      data: { patientId: patients[b.patientIdx].id, equipmentId: equipmentList[b.equipmentIdx].id, hospitalId: equipmentList[b.equipmentIdx].hospitalId, dateTime: dt, status: b.status, reviewedByReceptionistId: b.reviewedById ?? null, reviewedAt: b.reviewedById ? new Date() : null },
    });
  }
  console.log("  ✅ Equipment Bookings");

  // ── 11. Equipment Announcements ───────────────────────────────────────
  const announcementDefs = [
    { title: "MRI Scheduled Maintenance", message: "The MRI machine will be down for maintenance on May 20th, 2026.", cat: "MRI", hospIdx: 0, equipIdx: 0 },
    { title: "New CT Scanner Arriving", message: "A new CT scanner will be operational next month.", cat: "CT_SCAN", hospIdx: 0, equipIdx: null },
  ];
  for (const a of announcementDefs) {
    await prisma.equipmentAnnouncement.create({ data: { title: a.title, message: a.message, category: a.cat, hospitalId: hospitals[a.hospIdx].id, equipmentId: a.equipIdx !== null ? equipmentList[a.equipIdx]?.id ?? null : null } });
  }
  console.log("  ✅ Equipment Announcements");

  // ── Summary ───────────────────────────────────────────────────────────
  const counts = {
    hospitals: await prisma.hospital.count(), patients: await prisma.patientProfile.count(),
    receptionists: await prisma.receptionistProfile.count(), doctors: await prisma.doctorProfile.count(),
    reviews: await prisma.review.count(), equipment: await prisma.medicalEquipment.count(),
    schedules: await prisma.doctorSchedule.count(), appointments: await prisma.appointment.count(),
  };
  console.log("\n📊 Seed Summary:", counts);
  console.log(
    "\n🔑 Login credentials:\n" +
    "  Admin:                    email=admin@bm-booking.com, password=password123\n" +
    "  Receptionist (Black Lion): username=receptionist_bl, password=password123\n" +
    "  Receptionist (St. Paul):   username=receptionist_sp, password=password123\n" +
    "  Receptionist (Zewditu):    username=receptionist_zw, password=password123"
  );
}

main()
  .catch((e) => { console.error("❌ [SEED] Error:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
