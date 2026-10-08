const API = (() => {
  const BASE = (() => {
    return 'https://bmbookingapi.possibletechplc.com';
  })();

  const TELEBIRR = (() => {
    return 'https://bmtelebirr.possibletechplc.com';
  })();

  function getToken() {
    return Store.getToken();
  }

  function authHeaders() {
    const t = getToken();
    return t ? { 'Authorization': `Bearer ${t}` } : {};
  }

  async function request(method, path, body = null, opts = {}) {
    const url = `${BASE}${path}`;
    const headers = { 'Content-Type': 'application/json', ...authHeaders(), ...opts.headers };

    const config = {
      method,
      headers,
      ...(body ? { body: JSON.stringify(body) } : {}),
      ...opts.fetchOptions,
    };

    try {
      const res = await fetch(url, config);
      const data = await res.json();
      if (!res.ok) {
        const msg = data?.message || data?.data?.message || `Request failed (${res.status})`;
        throw new Error(msg);
      }
      return data;
    } catch (err) {
      if (err.message.includes('NetworkError') || err.message.includes('Failed to fetch')) {
        throw new Error('Network error. Please check your connection.');
      }
      throw err;
    }
  }

  return {
    BASE,
    TELEBIRR,

    // ─── Auth ───
    async requestOtp(phone, role = null, isRegistration = false) {
      const body = { phone };
      if (role) body.role = role;
      body.isRegistration = isRegistration;
      return request('POST', '/api/auth/request-otp', body);
    },

    async verifyOtp(phone, code, role = null, isRegistration = false) {
      const body = { phone, code };
      if (role) body.role = role;
      body.isRegistration = isRegistration;
      const res = await request('POST', '/api/auth/verify-otp', body);
      return res.data;
    },

    // ─── Patient ───
    async getPatientProfile() {
      const res = await request('GET', '/api/patients/profile');
      return res.data;
    },

    async submitPatientProfile(data) {
      return request('POST', '/api/patients/profile', data);
    },

    // ─── Doctors ───
    async getAllDoctors(qs) {
      const res = await request('GET', '/api/doctors/all' + (qs || ''));
      return res.data;
    },

    async getDoctorDetail(id) {
      const all = await this.getAllDoctors();
      return all.find(d => d.id === id) || null;
    },

    async getDoctorSchedules(doctorId, from, to) {
      const params = new URLSearchParams();
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      const res = await request('GET', `/api/doctors/${doctorId}/schedules?${params}`);
      return res.data;
    },

    // ─── Appointments ───
    async getCategories() {
      const res = await request('GET', '/api/appointments/categories');
      return res.data;
    },

    async getRecommendations(category) {
      const res = await request('GET', `/api/appointments/recommendations/${category}`);
      return res.data;
    },

    async createAppointment(data) {
      const res = await request('POST', '/api/appointments', data);
      return res.data;
    },

    async getMyAppointments() {
      const res = await request('GET', '/api/appointments/my');
      return res.data;
    },

    async cancelAppointment(id) {
      const res = await request('PATCH', `/api/appointments/${id}/cancel`);
      return res.data;
    },

    async createReview(data) {
      const res = await request('POST', '/api/reviews', data);
      return res.data;
    },

    async uploadReferral(file) {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${BASE}/api/appointments/upload`, {
        method: 'POST',
        headers: { ...authHeaders() },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Upload failed');
      return data;
    },

    // ─── Equipment ───
    async searchEquipment(params = {}) {
      const q = new URLSearchParams();
      if (params.query) q.set('query', params.query);
      if (params.category) q.set('category', params.category);
      if (params.city) q.set('city', params.city);
      if (params.hospitalId) q.set('hospitalId', String(params.hospitalId));
      const res = await request('GET', `/api/equipment/search?${q}`);
      return res.data;
    },

    async getEquipmentCategories() {
      const res = await request('GET', '/api/equipment/categories');
      return res.data;
    },

    async getEquipmentDetail(id) {
      const res = await request('GET', `/api/equipment/detail/${id}`);
      return res.data;
    },

    async getEquipmentAvailability(equipmentId, date) {
      const res = await request('GET', `/api/equipment/${equipmentId}/availability?date=${date}`);
      return res.data;
    },

    async createEquipmentBooking(data) {
      const res = await request('POST', '/api/equipment/book', data);
      return res.data;
    },

    async getMyEquipmentBookings(filters = {}) {
      const q = new URLSearchParams();
      if (filters.status) q.set('status', filters.status);
      if (filters.date) q.set('date', filters.date);
      const res = await request('GET', `/api/equipment/bookings?${q}`);
      return res.data;
    },

    async cancelEquipmentBooking(bookingId) {
      const res = await request('PATCH', `/api/equipment/bookings/${bookingId}/cancel`);
      return res.data;
    },

    // ─── Hospitals ───
    async getAllHospitals() {
      const res = await request('GET', '/api/hospitals');
      return res.data;
    },

    // ─── Payments ───
    async verifyTelebirr(amount) {
      const res = await request('POST', '/api/payments/verify-telebirr', { amount });
      return res;
    },
  };
})();
