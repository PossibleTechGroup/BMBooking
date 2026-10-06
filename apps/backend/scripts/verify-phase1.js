const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const API = process.env.API_BASE || 'http://localhost:5000/api';
const results = [];
function log(name, ok, extra = '') {
  results.push(`${ok ? 'PASS' : 'FAIL'} ${name}${extra ? ' :: ' + extra : ''}`);
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${extra ? ' :: ' + extra : ''}`);
}

(async () => {
  let doc;
  const RANGE_START = '2026-12-06';
  const RANGE_END = '2026-12-20';
  try {
    const adminRes = await axios.post(`${API}/admin/login`, { email: 'admin@bm-booking.com', password: 'password123' });
    const adminToken = adminRes.data.token || adminRes.data.data?.token;
    if (!adminToken) throw new Error('no admin token');
    const adminHeaders = { Authorization: `Bearer ${adminToken}` };

    const docs = await axios.get(`${API}/admin/doctors`, { headers: adminHeaders });
    const list = docs.data.data || docs.data || [];
    doc = list.find(d => /kefelegn/i.test((d.fullName || '') + ' ' + (d.name || '')));
    if (!doc) throw new Error('Dr Kefelegn not found in admin doctor list');
    console.log('Doctor:', doc.id, doc.fullName, 'hospitalId=', doc.hospitalId);

    const existing = await prisma.doctorSchedule.count({ where: { doctorId: doc.id, date: { gte: new Date(RANGE_START), lte: new Date(RANGE_END) } } });
    if (existing > 0) {
      console.log('SKIP create (schedules already present) — verifying existing rows');
    } else {
      const payload = {
        doctorId: doc.id,
        date: RANGE_START,
        startTime: `${RANGE_START}T10:00:00.000Z`,
        endTime: `${RANGE_START}T12:00:00.000Z`,
        slotDuration: 30,
        maxPatientsPerSlot: 1,
        daysOfWeek: [0],
        repeatEndDate: RANGE_END,
      };
      const created = await axios.post(`${API}/admin/doctors/schedules`, payload, { headers: adminHeaders });
      const scheds = created.data.data || [];
      log('recurring create returns multiple schedules', Array.isArray(scheds) && scheds.length >= 3, 'count=' + (Array.isArray(scheds) ? scheds.length : typeof scheds));
      const allHaveHospital = Array.isArray(scheds) && scheds.length > 0 && scheds.every(s => s.hospitalId === doc.hospitalId);
      log('schedules inherited hospitalId from doctor', allHaveHospital, 'expected=' + doc.hospitalId);
    }

    const fetch = await axios.get(`${API}/admin/doctors/${doc.id}/schedules`, { headers: adminHeaders });
    const fetched = fetch.data.data || [];
    log('admin GET shows new recurring schedules', fetched.some(s => s.date && String(s.date).startsWith('2026-12-')));

    const login = await axios.post(`${API}/auth/receptionist-login`, { username: 'receptionist_bl', password: 'password123' });
    const recToken = login.data.token || login.data.data?.token;
    if (!recToken) throw new Error('no receptionist token');
    const recHeaders = { Authorization: `Bearer ${recToken}` };

    const s1 = await axios.get(`${API}/receptionist/patients?search=14`, { headers: recHeaders });
    const s1data = s1.data.data || [];
    log('reception search by userId=14', Array.isArray(s1data) && s1data.some(p => p.id === 14));

    const appt = await prisma.appointment.findFirst({ where: { patientId: 14 }, select: { confirmationCode: true } });
    if (appt?.confirmationCode) {
      const s2 = await axios.get(`${API}/receptionist/patients?search=${encodeURIComponent(appt.confirmationCode)}`, { headers: recHeaders });
      const s2data = s2.data.data || [];
      log('reception search by confirmationCode', Array.isArray(s2data) && s2data.some(p => p.id === 14), appt.confirmationCode);
    } else {
      log('reception search by confirmationCode', false, 'no appt found');
    }

    const a1 = await axios.get(`${API}/admin/patients?search=Test`, { headers: adminHeaders });
    const a1data = a1.data.data || [];
    log('admin patients search by name', Array.isArray(a1data) && a1data.some(p => /test patient one/i.test(p.fullName)));

    if (appt?.confirmationCode) {
      const a2 = await axios.get(`${API}/admin/patients?search=${encodeURIComponent(appt.confirmationCode)}`, { headers: adminHeaders });
      const a2data = a2.data.data || [];
      log('admin patients search by confirmationCode', Array.isArray(a2data) && a2data.some(p => p.userId === 14));
    }
  } catch (err) {
    log('SCRIPT_ERROR', false, err.message);
  } finally {
    if (doc) {
      await prisma.$transaction(async (tx) => {
        const scheds = await tx.doctorSchedule.findMany({
          where: { doctorId: doc.id, date: { gte: new Date(RANGE_START), lte: new Date(RANGE_END) } },
          select: { id: true },
        });
        if (scheds.length) {
          await tx.scheduleSlot.deleteMany({ where: { scheduleId: { in: scheds.map(s => s.id) } } });
          await tx.doctorSchedule.deleteMany({ where: { id: { in: scheds.map(s => s.id) } } });
          console.log(`CLEANUP: removed ${scheds.length} test schedule(s)`);
        }
      });
    }
    await prisma.$disconnect();
    const pass = results.filter(r => r.startsWith('PASS')).length;
    const fail = results.filter(r => r.startsWith('FAIL')).length;
    console.log(`\nTOTAL PASS=${pass} FAIL=${fail}`);
    process.exit(fail > 0 ? 1 : 0);
  }
})();