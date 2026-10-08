const EquipmentView = (() => {
  const PENDING_KEY = 'eq_pending_payment';

  const ICON = {
    search: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
    chevronRight: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>',
    location: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
    navigate: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>',
    check: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
    back: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>',
    user: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    calendar: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/></svg>',
    clock: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
    building: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>',
    phone: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
    cloud: '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/><line x1="2" y1="2" x2="22" y2="22"/></svg>',
    business: '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>',
    calendarEmpty: '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/></svg>',
    card: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>',
  };

  let containerRef = null;
  let state = null;
  let userLocation = null;
  let locationAsked = false;

  function freshState() {
    return {
      step: 'list',
      searchQuery: '',
      selectedCategory: null,
      categories: [],
      equipment: [],
      centers: [],
      selectedCenter: null,
      selectedEquipment: null,
      siblingServices: [],
      dateId: '',
      slotStart: '',
      slots: [],
      availabilityLoading: false,
      notes: '',
      equipFee: 0,
      hospFee: 0,
      totalPayable: 0,
      paymentDone: false,
      showBooking: false,
      showPayment: false,
      success: false,
      createdBooking: null,
      myBookings: [],
      bookingsLoading: false,
      bookingsError: null,
      listLoading: false,
      listError: null,
      detailLoading: false,
      detailError: null,
    };
  }

  function esc(value) {
    if (value === null || value === undefined) return '';
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function t(key, fallback) {
    const value = I18n.t(key);
    if (!value || value === key) return fallback || key;
    return value;
  }

  function tf(key, fallback, vars) {
    let out = t(key, fallback);
    Object.keys(vars || {}).forEach((k) => {
      out = out.split(`{{${k}}}`).join(String(vars[k]));
    });
    return out;
  }

  function round2(n) {
    return Math.round(Number(n) * 100) / 100;
  }

  function toNumber(value) {
    if (value === null || value === undefined || value === '') return null;
    const n = Number(value);
    return isNaN(n) ? null : n;
  }

  function equipmentFeeOf(item) {
    const price = toNumber(item && item.price);
    if (price !== null) return price;
    const daily = toNumber(item && item.dailyRate);
    if (daily !== null) return daily;
    return 0;
  }

  function hospitalFeeOf(item) {
    const nested = item && item.hospital && item.hospital.serviceFee
      ? toNumber(item.hospital.serviceFee.amount)
      : null;
    if (nested !== null) return nested;
    const flat = toNumber(item && item.serviceFee);
    if (flat !== null) return flat;
    return 50;
  }

  function applyFees(item) {
    state.equipFee = equipmentFeeOf(item);
    state.hospFee = hospitalFeeOf(item);
    state.totalPayable = round2(state.equipFee + state.hospFee);
  }

  function haversineKm(lat1, lon1, lat2, lon2) {
    const toRad = (v) => (v * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
  }

  function distanceFor(lat, lng) {
    if (!userLocation || !lat || !lng) return null;
    return Math.round(haversineKm(userLocation.lat, userLocation.lon, Number(lat), Number(lng)) * 10) / 10;
  }

  function distanceLabel(lat, lng) {
    const km = distanceFor(lat, lng);
    if (km === null) return t('distanceUnavailable', 'Distance unavailable');
    return tf('kmAway', '{{km}} km away', { km: km.toFixed(1) });
  }

  function requestLocationOnce(onReady) {
    if (locationAsked || userLocation) return;
    locationAsked = true;
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        userLocation = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        if (typeof onReady === 'function') onReady();
      },
      () => {},
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 },
    );
  }

  function dateIdOf(d) {
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${m}-${day}`;
  }

  function getNext7Days() {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      days.push({
        id: dateIdOf(d),
        day: d.toLocaleDateString('en-US', { weekday: 'short' }),
        date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        full: TimeUtils.formatDate(d),
      });
    }
    return days;
  }

  function slotDate(dateId, start) {
    const [y, m, d] = String(dateId).split('-').map(Number);
    const [hh, mm] = String(start).split(':').map(Number);
    return new Date(y, m - 1, d, hh || 0, mm || 0);
  }

  function buildDateTimeISO(dateId, start) {
    return slotDate(dateId, start).toISOString();
  }

  function formatBookingDate(dateTime) {
    const d = new Date(dateTime);
    if (isNaN(d.getTime())) return '';
    return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()} ${TimeUtils.formatTime(d)}`;
  }

  function categoryLabel(category) {
    return t(category, category || '');
  }

  function normalizeStatus(status) {
    let s = String(status || 'pending').toLowerCase();
    if (s === 'confirmed') s = 'accepted';
    return s;
  }

  function badgeClass(status) {
    const s = normalizeStatus(status);
    return ['pending', 'accepted', 'completed', 'declined', 'cancelled'].includes(s)
      ? `badge badge-${s}`
      : 'badge badge-pending';
  }

  function statusLabel(status) {
    const raw = String(status || 'pending').toLowerCase();
    if (raw === 'confirmed') return t('confirmed', 'Confirmed');
    if (raw === 'accepted') return t('accepted', 'Accepted');
    return t(raw, raw.charAt(0).toUpperCase() + raw.slice(1));
  }

  function savePending() {
    try {
      localStorage.setItem(PENDING_KEY, JSON.stringify({
        equipmentId: state.selectedEquipment ? state.selectedEquipment.id : null,
        dateId: state.dateId,
        date: state.dateId,
        slotStart: state.slotStart,
        notes: state.notes,
        totalPayable: state.totalPayable,
      }));
    } catch {}
  }

  function loadPending() {
    try {
      const raw = localStorage.getItem(PENDING_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch { return null; }
  }

  function clearPending() {
    try { localStorage.removeItem(PENDING_KEY); } catch {}
  }

  function openPaymentUrl(amount) {
    const url = `${API.TELEBIRR}/?amount=${encodeURIComponent(String(amount))}&src=tg`;
    if (TG.webapp) TG.openLink(url);
    else window.open(url, '_blank');
  }

  async function render(container) {
    containerRef = container;
    state = freshState();
    TG.hideMainButton();

    const pending = loadPending();
    if (pending && pending.equipmentId) {
      clearPending();
      await resumePendingPayment(container, pending);
      return;
    }
    renderList(container);
  }

  // ─── List: search + category chips + grouped centers + my bookings ───

  async function renderList(container) {
    state.step = 'list';
    state.showBooking = false;
    state.showPayment = false;
    state.success = false;

    container.innerHTML = `
      <div class="view-header bm-brand-header">
        <div class="bm-brand"><img src="/bm-booking.png" alt="BM" /><span class="bm-brand-title">BM</span></div>
        <div class="view-header-right">
          <button class="icon-btn" id="eq-profile-btn" aria-label="${esc(t('myProfile', 'My Profile'))}">${ICON.user}</button>
        </div>
      </div>
      <h1 class="screen-title">${esc(t('diagnosisCenters', 'Diagnosis Centers'))}</h1>
      <div class="search-bar glass-surface">
        ${ICON.search}
        <input type="text" id="eq-search" placeholder="${esc(t('searchEquipmentPlaceholder', 'Search services or centers...'))}" value="${esc(state.searchQuery)}" />
      </div>
      <div class="sub-tabs" id="eq-categories"></div>
      <div id="eq-list"><div class="loading"><div class="spinner"></div></div></div>
      <h3 class="section-title eq-bookings-title" id="eq-bookings-title">${esc(t('myEquipmentBookings', 'My Equipment Bookings'))}</h3>
      <div id="eq-my-bookings"><div class="loading"><div class="spinner"></div></div></div>
    `;

    container.querySelector('#eq-profile-btn').addEventListener('click', () => Router.navigate('profile'));

    const search = container.querySelector('#eq-search');
    search.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        state.searchQuery = search.value;
        loadEquipment(container);
      }
    });
    search.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      clearTimeout(state._searchTimer);
      state._searchTimer = setTimeout(() => loadEquipment(container), 350);
    });

    loadCategories(container);
    loadEquipment(container);
    loadMyBookings(container);
    requestLocationOnce(() => renderCenters(container));
  }

  async function loadCategories(container) {
    try {
      state.categories = (await API.getEquipmentCategories()) || [];
    } catch {
      state.categories = [];
    }
    const el = container.querySelector('#eq-categories');
    if (!el) return;
    el.innerHTML = `
      <button class="sub-tab ${!state.selectedCategory ? 'active' : ''}" data-cat="">${esc(t('all', 'All'))}</button>
      ${state.categories.map((c) => `
        <button class="sub-tab ${state.selectedCategory === c.category ? 'active' : ''}" data-cat="${esc(c.category)}">
          ${esc(categoryLabel(c.category))}${c._count && c._count.id ? ` (${c._count.id})` : ''}
        </button>
      `).join('')}
    `;
    el.querySelectorAll('[data-cat]').forEach((tab) => {
      tab.addEventListener('click', () => {
        state.selectedCategory = tab.dataset.cat || null;
        el.querySelectorAll('[data-cat]').forEach((x) => x.classList.toggle('active', x === tab));
        loadEquipment(container);
      });
    });
  }

  function groupCenters(items) {
    const map = new Map();
    for (const item of items || []) {
      const hospital = item.hospital || null;
      const key = hospital && hospital.id != null
        ? `h${hospital.id}`
        : (item.hospitalName || item.name || 'center');
      if (!map.has(key)) {
        map.set(key, {
          id: hospital && hospital.id != null ? hospital.id : null,
          name: (hospital && hospital.name) || item.hospitalName || t('diagnosisCenter', 'Diagnosis Center'),
          address: (hospital && hospital.address) || item.address || '',
          phone: (hospital && hospital.phone) || item.hospitalPhone || '',
          latitude: (hospital && hospital.latitude) || item.latitude || 0,
          longitude: (hospital && hospital.longitude) || item.longitude || 0,
          services: [],
        });
      }
      map.get(key).services.push(item);
    }
    return Array.from(map.values());
  }

  async function loadEquipment(container) {
    state.listLoading = true;
    state.listError = null;
    renderCenters(container);
    try {
      state.equipment = (await API.searchEquipment({
        query: state.searchQuery || undefined,
        category: state.selectedCategory || undefined,
      })) || [];
      state.centers = groupCenters(state.equipment);
      state.listError = null;
    } catch (err) {
      state.centers = [];
      state.listError = err.message || t('error', 'Error');
    } finally {
      state.listLoading = false;
      renderCenters(container);
    }
  }

  function renderCenters(container) {
    const el = container.querySelector('#eq-list');
    if (!el || state.step !== 'list') return;

    if (state.listLoading && state.centers.length === 0) {
      el.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
      return;
    }

    if (state.listError && state.centers.length === 0) {
      el.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">${ICON.cloud}</div>
          <h3>${esc(t('equipmentLoadError', "Couldn't load diagnosis centers"))}</h3>
          <p>${esc(state.listError || t('checkYourConnection', 'Check your connection and try again.'))}</p>
          <button class="btn btn-primary eq-empty-cta" id="eq-list-retry">${esc(t('retry', 'Retry'))}</button>
        </div>
      `;
      el.querySelector('#eq-list-retry').addEventListener('click', () => loadEquipment(container));
      return;
    }

    if (state.centers.length === 0) {
      el.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">${ICON.business}</div>
          <h3>${esc(t('noEquipmentFound', 'No diagnosis centers found'))}</h3>
          <p>${esc(t('tryDifferentCategory', 'Try selecting another category or different search terms.'))}</p>
        </div>
      `;
      return;
    }

    el.innerHTML = state.centers.map((center) => {
      const chips = center.services.slice(0, 3);
      const availableCount = center.services.filter((s) => s.isOperational !== false).length;
      const extra = center.services.length - chips.length;
      return `
        <div class="doctor-card eq-center-card" data-center="${esc(center.id != null ? center.id : center.name)}" role="button">
          <div class="doctor-avatar eq-center-avatar">${ICON.building}</div>
          <div class="doctor-info">
            <div class="eq-center-tag">${esc(t('diagnosisCenter', 'DIAGNOSIS CENTER'))}</div>
            <h3>${esc(center.name)}</h3>
            ${center.address ? `<div class="meta"><span class="meta-item">${ICON.location} ${esc(center.address)}</span></div>` : ''}
            <div class="meta">
              <span class="meta-item eq-distance">${ICON.navigate} ${esc(distanceLabel(center.latitude, center.longitude))}</span>
              <span class="meta-item">${availableCount} ${esc(availableCount === 1 ? t('service', 'service') : t('services', 'services'))}</span>
            </div>
            ${chips.length ? `
              <div class="eq-tags">
                ${chips.map((s) => `<span class="eq-tag">${esc(categoryLabel(s.category))}</span>`).join('')}
                ${extra > 0 ? `<span class="eq-more">+${extra} ${esc(t('more', 'more'))}</span>` : ''}
              </div>` : ''}
          </div>
          <div class="doctor-chevron">${ICON.chevronRight}</div>
        </div>
      `;
    }).join('');

    el.querySelectorAll('.eq-center-card').forEach((card) => {
      card.addEventListener('click', () => {
        const key = card.dataset.center;
        const center = state.centers.find((c) => String(c.id != null ? c.id : c.name) === String(key));
        if (center) renderCenter(container, center);
      });
    });
  }

  // ─── My Equipment Bookings ───

  async function loadMyBookings(container) {
    state.bookingsLoading = true;
    state.bookingsError = null;
    renderMyBookings(container);
    try {
      state.myBookings = (await API.getMyEquipmentBookings()) || [];
    } catch (err) {
      state.bookingsError = err.message || t('error', 'Error');
    } finally {
      state.bookingsLoading = false;
      renderMyBookings(container);
    }
  }

  function renderMyBookings(container) {
    const el = container.querySelector('#eq-my-bookings');
    if (!el || state.step !== 'list') return;

    if (state.bookingsLoading && state.myBookings.length === 0) {
      el.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
      return;
    }

    if (state.bookingsError) {
      el.innerHTML = `<div class="alert alert-error">${esc(state.bookingsError)}</div>`;
      return;
    }

    if (state.myBookings.length === 0) {
      el.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">${ICON.calendarEmpty}</div>
          <h3>${esc(t('noEquipmentBookings', 'No equipment bookings yet'))}</h3>
          <p>${esc(t('noEquipmentBookingsDesc', 'Book a diagnostic service to see your bookings here.'))}</p>
          <button class="btn btn-primary eq-empty-cta" id="eq-browse-services">${esc(t('browseServices', 'Browse Services'))}</button>
        </div>
      `;
      el.querySelector('#eq-browse-services').addEventListener('click', () => {
        const search = container.querySelector('#eq-search');
        if (search) {
          search.scrollIntoView({ behavior: 'smooth', block: 'center' });
          search.focus();
        }
      });
      return;
    }

    el.innerHTML = state.myBookings.map((b) => {
      const equipmentName = (b.equipment && b.equipment.name) || t('equipmentTitle', 'Equipment');
      const hospitalName = b.hospitalName || (b.hospital && b.hospital.name) ||
        (b.equipment && b.equipment.hospital && b.equipment.hospital.name) || '';
      const status = String(b.status || 'pending').toLowerCase();
      const canCancel = status === 'pending' || status === 'confirmed';
      const fee = toNumber(b.fee);
      return `
        <div class="card eq-booking-card" data-booking="${b.id}">
          <div class="card-row eq-booking-head">
            <div class="eq-booking-info">
              <div class="eq-booking-title">${esc(equipmentName)}</div>
              ${hospitalName ? `<div class="eq-sub">${esc(hospitalName)}</div>` : ''}
            </div>
            <span class="${badgeClass(b.status)}">${esc(statusLabel(b.status))}</span>
          </div>
          <div class="card-row">
            <span class="text-hint">${ICON.calendar} ${esc(t('date', 'Date'))}</span>
            <span>${esc(formatBookingDate(b.dateTime))}</span>
          </div>
          ${fee !== null ? `
            <div class="card-row">
              <span class="text-hint">${ICON.card} ${esc(t('amount', 'Amount'))}</span>
              <span><strong>${fee} ${esc(t('etb', 'ETB'))}</strong></span>
            </div>` : ''}
          ${b.notes ? `
            <div class="card-row">
              <span class="text-hint">${esc(t('notesOptional', 'Notes').replace(/\s*\(.*\)$/, ''))}</span>
              <span class="eq-sub">${esc(b.notes)}</span>
            </div>` : ''}
          ${canCancel ? `
            <div class="eq-booking-actions">
              <button class="btn btn-outline btn-sm" data-cancel="${b.id}">${esc(t('cancel', 'Cancel'))}</button>
            </div>` : ''}
        </div>
      `;
    }).join('');

    el.querySelectorAll('[data-cancel]').forEach((btn) => {
      btn.addEventListener('click', () => handleCancelBooking(container, Number(btn.dataset.cancel), btn));
    });
  }

  async function handleCancelBooking(container, bookingId, btn) {
    const confirmed = await TG.showConfirm(
      `${t('cancelBooking', 'Cancel Booking')}\n${t('cancelConfirm', 'Are you sure you want to cancel this booking?')}`,
    );
    if (!confirmed) return;
    if (btn) {
      btn.disabled = true;
      btn.textContent = t('loading', 'Loading...');
    }
    try {
      await API.cancelEquipmentBooking(bookingId);
      const booking = state.myBookings.find((b) => b.id === bookingId);
      if (booking) booking.status = 'cancelled';
      TG.showAlert(t('bookingCancelled', 'Booking cancelled'));
    } catch (err) {
      TG.showAlert(err.message || t('error', 'Error'));
    } finally {
      renderMyBookings(container);
    }
  }

  // ─── Center detail ───

  function renderCenter(container, center) {
    state.step = 'center';
    state.selectedCenter = center;

    container.innerHTML = `
      <div class="view-header">
        <button class="view-header-back" id="eq-center-back">${ICON.back}<span>${esc(t('back', 'Back'))}</span></button>
        <div class="view-header-spacer"></div>
      </div>
      <div class="eq-center-head">
        <div class="eq-center-tag">${esc(t('diagnosisCenter', 'DIAGNOSIS CENTER'))}</div>
        <h1 class="eq-center-name">${esc(center.name)}</h1>
        ${center.address ? `<div class="meta-item">${ICON.location} ${esc(center.address)}</div>` : ''}
        <div class="meta">
          <span class="meta-item eq-distance">${ICON.navigate} ${esc(distanceLabel(center.latitude, center.longitude))}</span>
          <span class="meta-item">${center.services.length} ${esc(center.services.length === 1 ? t('service', 'service') : t('services', 'services'))}</span>
        </div>
        ${center.phone ? `<a class="meta-item eq-call" href="tel:${esc(center.phone)}">${ICON.phone} ${esc(center.phone)}</a>` : ''}
      </div>
      <div id="eq-center-services">
        ${center.services.length === 0 ? `
          <div class="empty-state">
            <div class="empty-state-icon">${ICON.business}</div>
            <h3>${esc(t('noEquipmentFound', 'No diagnosis centers found'))}</h3>
          </div>` : ''}
        ${center.services.map((item) => renderItemCard(item)).join('')}
      </div>
    `;

    container.querySelector('#eq-center-back').addEventListener('click', () => renderList(container));
    container.querySelectorAll('[data-detail]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        renderItemDetail(container, Number(btn.dataset.detail));
      });
    });
    container.querySelectorAll('.eq-item-card').forEach((card) => {
      card.addEventListener('click', () => renderItemDetail(container, Number(card.dataset.item)));
    });
  }

  function renderItemCard(item) {
    const equipFee = equipmentFeeOf(item);
    const hospFee = hospitalFeeOf(item);
    const price = item.price != null ? item.price : (item.dailyRate != null ? item.dailyRate : null);
    const operational = item.isOperational !== false;
    return `
      <div class="card eq-item-card ${operational ? '' : 'eq-item-disabled'}" data-item="${item.id}" role="button">
        <div class="eq-item-top">
          <div class="eq-item-info">
            <h3>${esc(item.name)}</h3>
            <div class="eq-item-meta">${esc(categoryLabel(item.category))} &bull; ${price != null ? `${esc(price)} ${esc(t('etb', 'ETB'))}` : esc(t('callCenter', 'Contact center'))} &bull; ${esc(item.duration || 30)} min</div>
          </div>
          <span class="badge ${operational ? 'badge-completed' : 'badge-declined'}">${esc(operational ? t('available', 'Available') : t('unavailable', 'Unavailable'))}</span>
        </div>
        <div class="eq-item-actions">
          <span class="eq-item-fee">${esc(t('hospitalFee', 'Hospital Fee'))}: <strong>${hospFee} ${esc(t('etb', 'ETB'))}</strong></span>
          ${operational ? `<button class="btn btn-primary btn-sm" data-detail="${item.id}">${esc(t('book', 'Book'))}</button>` : ''}
        </div>
      </div>
    `;
  }

  // ─── Item detail with 7-day picker + availability slots ───

  async function renderItemDetail(container, equipmentId) {
    state.step = 'detail';
    state.selectedEquipment = null;
    state.siblingServices = [];
    state.dateId = '';
    state.slotStart = '';
    state.slots = [];
    state.availabilityLoading = false;
    state.notes = '';
    state.paymentDone = false;
    state.showBooking = false;
    state.showPayment = false;
    state.success = false;
    state.createdBooking = null;
    state.detailLoading = true;
    state.detailError = null;

    renderDetailShell(container);

    try {
      const detail = await API.getEquipmentDetail(equipmentId);
      if (!detail) throw new Error(t('toolNotFound', 'Tool not found'));
      state.selectedEquipment = detail;
      state.detailLoading = false;
      applyFees(detail);
      const days = getNext7Days();
      state.dateId = days.length ? days[0].id : '';
      renderDetailBody(container);
      loadAvailability(container);
      loadSiblingServices(container, detail);
    } catch (err) {
      state.detailLoading = false;
      state.detailError = err.message || t('error', 'Error');
      renderDetailShell(container);
    }
  }

  function renderDetailShell(container) {
    container.innerHTML = `
      <div class="view-header">
        <button class="view-header-back" id="eq-detail-back">${ICON.back}<span>${esc(t('back', 'Back'))}</span></button>
        <div class="view-header-spacer"></div>
      </div>
      <div id="eq-detail-body"></div>
    `;
    container.querySelector('#eq-detail-back').addEventListener('click', () => {
      if (state.selectedCenter) renderCenter(container, state.selectedCenter);
      else renderList(container);
    });

    const body = container.querySelector('#eq-detail-body');
    if (state.detailLoading) {
      body.innerHTML = '<div class="loading"><div class="spinner"></div><p class="eq-loading-text">' +
        esc(t('loadingToolDetails', 'Loading tool details...')) + '</p></div>';
      return;
    }
    if (state.detailError) {
      body.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">${ICON.cloud}</div>
          <h3>${esc(state.detailError === t('toolNotFound', 'Tool not found') ? t('toolNotFound', 'Tool not found') : state.detailError)}</h3>
          <button class="btn btn-primary eq-empty-cta" id="eq-detail-go-back">${esc(t('goBack', 'Go Back'))}</button>
        </div>
      `;
      body.querySelector('#eq-detail-go-back').addEventListener('click', () => {
        if (state.selectedCenter) renderCenter(container, state.selectedCenter);
        else renderList(container);
      });
    }
  }

  async function loadSiblingServices(container, detail) {
    const hospitalId = detail.hospital && detail.hospital.id != null ? detail.hospital.id : null;
    if (hospitalId === null) {
      renderSiblings(container);
      return;
    }
    try {
      const all = (await API.searchEquipment({ hospitalId: String(hospitalId) })) || [];
      state.siblingServices = all;
    } catch {
      state.siblingServices = [];
    }
    renderSiblings(container);
  }

  function renderSiblings(container) {
    const wrap = container.querySelector('#eq-siblings');
    if (!wrap || !state.selectedEquipment) return;
    const item = state.selectedEquipment;
    const name = (item.hospital && item.hospital.name) || '';
    const services = state.siblingServices;

    if (services.length === 0) {
      wrap.innerHTML = `
        <h3 class="section-title">${esc(tf('allServicesAt', 'All services at {{name}}', { name: name }))}</h3>
        <p class="text-hint">${esc(t('loadingHospitalServices', "Loading this hospital's services..."))}</p>
      `;
      return;
    }

    wrap.innerHTML = `
      <h3 class="section-title">${esc(tf('allServicesAt', 'All services at {{name}}', { name: name }))}</h3>
      ${services.map((svc) => {
        const selected = svc.id === item.id;
        const operational = svc.isOperational !== false;
        const price = svc.price != null ? `${svc.price} ${t('etb', 'ETB')}` : (svc.dailyRate != null ? `${svc.dailyRate} ${t('etb', 'ETB')}` : t('callCenter', 'Contact hospital'));
        return `
          <div class="eq-svc-row ${selected ? 'selected' : ''} ${operational ? '' : 'eq-item-disabled'}" data-service-id="${svc.id}" role="button">
            <div class="eq-svc-body">
              <div class="eq-svc-name">${esc(svc.name)}</div>
              <div class="eq-svc-meta">${esc(categoryLabel(svc.category))} &bull; ${esc(price)}</div>
            </div>
            <span class="eq-svc-dot ${operational ? '' : 'off'}"></span>
            ${selected ? ICON.check : ICON.chevronRight}
          </div>
        `;
      }).join('')}
    `;

    wrap.querySelectorAll('[data-service-id]').forEach((row) => {
      row.addEventListener('click', () => {
        const id = Number(row.dataset.serviceId);
        if (id === state.selectedEquipment.id) return;
        const svc = state.siblingServices.find((s) => s.id === id);
        if (svc && svc.isOperational === false) return;
        renderItemDetail(container, id);
      });
    });
  }

  async function loadAvailability(container) {
    if (!state.selectedEquipment || !state.dateId) return;
    state.availabilityLoading = true;
    state.slotStart = '';
    renderSlots(container);
    try {
      const data = await API.getEquipmentAvailability(state.selectedEquipment.id, state.dateId);
      state.slots = (data && data.slots) || [];
      state.availabilityLoading = false;
      const firstFree = state.slots.find((s) => !s.booked);
      state.slotStart = firstFree ? firstFree.start : '';
    } catch {
      state.slots = [];
      state.availabilityLoading = false;
      state.slotStart = '';
    }
    renderSlots(container);
    updateContinueButton(container);
  }

  function renderSlots(container) {
    const box = container.querySelector('#eq-slots');
    if (!box) return;

    if (state.availabilityLoading) {
      box.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
      return;
    }

    if (state.slots.length === 0) {
      box.innerHTML = `<div class="eq-slots-empty">${esc(t('noAvailableSlots', 'No available slots for this date.'))}</div>`;
      return;
    }

    box.innerHTML = `<div class="slot-grid">${state.slots.map((slot) => {
      const booked = slot.booked === true;
      const selected = state.slotStart === slot.start;
      const time = TimeUtils.formatTime(slotDate(state.dateId, slot.start));
      return `
        <div class="slot-chip ${selected ? 'selected' : ''} ${booked ? 'full booked' : ''}"
             data-slot="${esc(slot.start)}" role="button" aria-disabled="${booked}">
          ${esc(time)}
        </div>
      `;
    }).join('')}</div>`;

    box.querySelectorAll('[data-slot]').forEach((chip) => {
      chip.addEventListener('click', () => {
        if (chip.classList.contains('full')) return;
        state.slotStart = chip.dataset.slot;
        box.querySelectorAll('.slot-chip').forEach((c) => c.classList.remove('selected'));
        chip.classList.add('selected');
        updateContinueButton(container);
      });
    });
  }

  function updateContinueButton(container) {
    const btn = container.querySelector('#eq-bk-continue');
    if (btn) btn.disabled = !state.dateId || !state.slotStart;
  }

  function renderDetailBody(container) {
    const body = container.querySelector('#eq-detail-body');
    if (!body || !state.selectedEquipment) return;
    const item = state.selectedEquipment;
    const operational = item.isOperational !== false;
    const category = categoryLabel(item.category);
    const days = getNext7Days();

    body.innerHTML = `
      <div class="eq-detail">
        <div class="eq-detail-title-row">
          <div>
            <h1>${esc(item.name)}</h1>
            <p class="eq-detail-cat">${esc(category.replace('_', ' '))}</p>
          </div>
          <span class="badge ${operational ? 'badge-completed' : 'badge-declined'}">${esc(operational ? t('active', 'Active') : t('inactive', 'Inactive'))}</span>
        </div>

        <div class="card eq-hosp-card">
          <div class="eq-hosp-icon">${ICON.building}</div>
          <div class="eq-hosp-body">
            <h3>${esc((item.hospital && item.hospital.name) || '')}</h3>
            ${item.hospital && item.hospital.address ? `<p class="text-hint">${esc(item.hospital.address)}</p>` : ''}
            <div class="meta-item eq-distance">${ICON.navigate} ${esc(distanceLabel(item.hospital && item.hospital.latitude, item.hospital && item.hospital.longitude))}</div>
          </div>
        </div>

        <div id="eq-siblings"></div>

        <h3 class="section-title">${esc(t('details', 'Details'))}</h3>
        <p class="eq-desc">${esc(item.description || t('defaultToolDescription', 'This specialized medical tool is available at the facility for patients requiring diagnostic or therapeutic care.'))}</p>

        ${!state.showBooking && !state.success ? `
          <div class="eq-ready" id="eq-ready-card">
            <h3>${esc(t('readyToBook', 'Ready to book this diagnostic service?'))}</h3>
            <p>${esc(t('chooseDateAndTime', 'Choose a date and time. The center will confirm your booking.'))}</p>
            ${operational ? `<button class="btn btn-primary mt-16" id="eq-open-booking">${ICON.calendar} ${esc(t('bookAppointment', 'Book Appointment'))}</button>` : `<p class="eq-unavailable">${esc(t('currentlyUnavailable', 'Currently Unavailable'))}</p>`}
          </div>` : ''}

        ${state.success ? renderSuccessHtml() : ''}

        ${state.showBooking ? `
          <div class="card eq-panel" id="eq-booking-panel">
            <h3 class="eq-panel-title">${esc(t('bookAppointment', 'Book Appointment'))}</h3>

            <p class="eq-section-label">${esc(t('selectDate', 'Select Date'))}</p>
            <div class="eq-date-row">
              ${days.map((d) => `
                <button class="eq-date-chip ${state.dateId === d.id ? 'selected' : ''}" data-date="${d.id}" title="${esc(d.full)}">
                  <span class="eq-date-day">${esc(d.day)}</span>
                  <span class="eq-date-num">${esc(d.date)}</span>
                </button>
              `).join('')}
            </div>

            <p class="eq-section-label">${esc(t('availableSlots', 'Available Slots'))}</p>
            <div id="eq-slots"></div>

            <p class="eq-section-label">${esc(t('feeSummary', 'Fee Summary'))}</p>
            <div class="eq-fee-box">
              <div class="eq-fee-row"><span>${esc(t('equipmentCost', 'Equipment Cost'))}</span><span>${state.equipFee} ${esc(t('etb', 'ETB'))}</span></div>
              <div class="eq-fee-row"><span>${esc(t('appFee', 'App Fee'))}</span><span>${state.hospFee} ${esc(t('etb', 'ETB'))}</span></div>
              <div class="eq-fee-row eq-fee-total"><span>${esc(t('total', 'Total'))}</span><span>${state.totalPayable} ${esc(t('etb', 'ETB'))}</span></div>
            </div>

            <div class="eq-panel-actions">
              <button class="btn btn-outline" id="eq-bk-cancel">${esc(t('cancel', 'Cancel'))}</button>
              <button class="btn btn-primary" id="eq-bk-continue" ${state.slotStart ? '' : 'disabled'}>${esc(t('continueToPayment', 'Continue to Payment'))}</button>
            </div>
          </div>` : ''}

        ${state.showPayment ? renderPaymentHtml() : ''}
      </div>

      ${!state.showBooking && !state.showPayment && !state.success ? `
        <div class="glass-bottom-bar eq-detail-bar">
          ${operational ? `<button class="btn btn-primary" id="eq-footer-book">${ICON.calendar} ${esc(t('bookAppointment', 'Book Appointment'))}</button>` : `<button class="btn btn-primary" disabled>${esc(t('currentlyUnavailable', 'Currently Unavailable'))}</button>`}
        </div>` : ''}
    `;

    bindDetailEvents(container, days);
    if (state.showBooking) {
      renderSlots(container);
      renderSiblings(container);
    } else {
      renderSiblings(container);
    }
  }

  function renderPaymentHtml() {
    const item = state.selectedEquipment;
    const free = state.totalPayable <= 0;
    return `
      <div class="card eq-panel" id="eq-payment-panel">
        <h3 class="eq-panel-title">${esc(t('paymentSummary', 'Payment Summary'))}</h3>
        <div class="eq-fee-box eq-fee-box-gap">
          <div class="eq-fee-row"><span>${esc(item.name)}</span><span>${esc(item.duration || 30)} min</span></div>
          <div class="eq-fee-row"><span>${esc(t('equipmentRental', 'Equipment Rental'))}</span><span>${state.equipFee} ${esc(t('etb', 'ETB'))}</span></div>
          <div class="eq-fee-row"><span>${esc(t('hospitalServiceFee', 'Hospital service fee'))}</span><span>${state.hospFee} ${esc(t('etb', 'ETB'))}</span></div>
          <div class="eq-fee-row eq-fee-total"><span>${esc(t('total', 'Total'))}</span><span>${state.totalPayable} ${esc(t('etb', 'ETB'))}</span></div>
        </div>
        <button class="btn btn-primary mt-16 eq-pay-btn" id="eq-pay-btn">
          ${free ? esc(t('confirmFreeBooking', 'Confirm Free Booking')) : esc(t('paymentProcessing', 'Processing...'))}
        </button>
        <div id="eq-pay-note">${free ? '' : `<p class="text-hint eq-pay-note">${esc(t('youWillBeRedirected', 'You will be redirected to Telebirr to complete payment'))}</p>`}</div>
      </div>
    `;
  }

  function renderSuccessHtml() {
    return `
      <div class="success-screen eq-success">
        <div class="check-icon">${ICON.check}</div>
        <h2>${esc(t('bookingRequested', 'Booking Requested'))}</h2>
        <p>${esc(t('bookingSubmittedNote', 'Your appointment request has been submitted. The center will confirm your booking shortly.'))}</p>
        <div class="card text-center">
          ${state.createdBooking ? `<p>${esc(t('bookingId', 'Booking ID'))}: <strong>#${esc(state.createdBooking.id)}</strong></p>` : ''}
          <p class="text-hint mt-8">${esc(state.selectedEquipment ? state.selectedEquipment.name : '')}</p>
          <p class="text-hint">${esc(state.dateId)} ${esc(state.slotStart ? TimeUtils.formatTime(slotDate(state.dateId, state.slotStart)) : '')}</p>
        </div>
        <div class="eq-success-actions">
          <button class="btn btn-primary mt-16" id="eq-view-bookings">${esc(t('viewMyBookings', 'View My Bookings'))}</button>
          <button class="btn btn-outline mt-8" id="eq-browse-more">${esc(t('browseMore', 'Browse More'))}</button>
        </div>
      </div>
    `;
  }

  function bindDetailEvents(container, days) {
    const openBooking = container.querySelector('#eq-open-booking');
    const footerBook = container.querySelector('#eq-footer-book');
    const onOpen = () => {
      state.showBooking = true;
      state.showPayment = false;
      renderDetailBody(container);
      loadAvailability(container);
    };
    if (openBooking) openBooking.addEventListener('click', onOpen);
    if (footerBook) footerBook.addEventListener('click', onOpen);

    container.querySelectorAll('[data-date]').forEach((chip) => {
      chip.addEventListener('click', () => {
        if (chip.dataset.date === state.dateId) return;
        state.dateId = chip.dataset.date;
        container.querySelectorAll('[data-date]').forEach((c) => c.classList.toggle('selected', c === chip));
        loadAvailability(container);
      });
    });

    const bkCancel = container.querySelector('#eq-bk-cancel');
    if (bkCancel) bkCancel.addEventListener('click', () => {
      state.showBooking = false;
      state.showPayment = false;
      state.slotStart = '';
      renderDetailBody(container);
    });

    const bkContinue = container.querySelector('#eq-bk-continue');
    if (bkContinue) bkContinue.addEventListener('click', () => {
      if (!state.dateId || !state.slotStart) {
        TG.showAlert(t('selectDateTimeError', 'Please select date and time.'));
        return;
      }
      state.showPayment = true;
      renderDetailBody(container);
    });

    const payBtn = container.querySelector('#eq-pay-btn');
    if (payBtn) payBtn.addEventListener('click', () => startPayment(container, payBtn));

    const viewBookings = container.querySelector('#eq-view-bookings');
    if (viewBookings) viewBookings.addEventListener('click', () => renderList(container));
    const browseMore = container.querySelector('#eq-browse-more');
    if (browseMore) browseMore.addEventListener('click', () => renderList(container));
  }

  // ─── Payment + booking submission ───

  async function startPayment(container, btn) {
    if (state.totalPayable <= 0) {
      state.paymentDone = false;
      await submitBooking(container);
      return;
    }
    savePending();
    if (btn) {
      btn.disabled = true;
      btn.textContent = t('openingTelebirr', 'Opening Telebirr...');
    }
    openPaymentUrl(state.totalPayable);
    const pending = loadPending() || {
      equipmentId: state.selectedEquipment.id,
      dateId: state.dateId,
      date: state.dateId,
      slotStart: state.slotStart,
      notes: state.notes,
      totalPayable: state.totalPayable,
    };
    renderResumeVerify(container, pending);
  }

  async function submitBooking(container) {
    const item = state.selectedEquipment;
    if (!item) return false;
    if (!state.dateId || !state.slotStart) {
      TG.showAlert(t('selectDateTimeError', 'Please select date and time.'));
      return false;
    }

    const payload = {
      equipmentId: item.id,
      dateTime: buildDateTimeISO(state.dateId, state.slotStart),
      notes: state.notes || undefined,
      fee: state.totalPayable,
      isPaid: !!state.paymentDone,
    };

    try {
      const booking = await API.createEquipmentBooking(payload);
      state.createdBooking = booking || null;
      clearPending();
      state.success = true;
      state.showBooking = false;
      state.showPayment = false;
      state.notes = '';
      renderDetailBody(container);
      loadMyBookings(container);
      return true;
    } catch (err) {
      TG.showAlert(`${t('bookingFailed', 'Booking Failed')}: ${err.message}`);
      return false;
    }
  }

  async function resumePendingPayment(container, pending) {
    container.innerHTML = `
      <div class="view-header bm-brand-header">
        <div class="bm-brand"><img src="/bm-booking.png" alt="BM" /><span class="bm-brand-title">BM</span></div>
      </div>
      <div class="loading">
        <div class="spinner"></div>
        <p class="eq-loading-text">${esc(t('verifyingPayment', 'Verifying payment...'))}</p>
      </div>
    `;

    try {
      const equipment = await API.getEquipmentDetail(pending.equipmentId);
      if (!equipment) {
        renderList(container);
        return;
      }
      state.selectedEquipment = equipment;
      applyFees(equipment);
      state.dateId = pending.dateId || pending.date || '';
      state.slotStart = pending.slotStart || '';
      state.notes = pending.notes || '';
      state.totalPayable = pending.totalPayable || state.totalPayable;

      const verifyRes = await API.verifyTelebirr(state.totalPayable);
      if (verifyRes && verifyRes.data && verifyRes.data.paid) {
        state.paymentDone = true;
        state.step = 'detail';
        renderDetailShell(container);
        state.detailLoading = false;
        renderDetailBody(container);
        await submitBooking(container);
        return;
      }
      renderResumeScreen(container, equipment, pending);
    } catch (err) {
      container.innerHTML = `
        <div class="view-header bm-brand-header">
          <div class="bm-brand"><img src="/bm-booking.png" alt="BM" /><span class="bm-brand-title">BM</span></div>
        </div>
        <div class="empty-state">
          <div class="empty-state-icon">${ICON.cloud}</div>
          <h3>${esc(t('equipmentLoadError', "Couldn't load diagnosis centers"))}</h3>
          <p>${esc(err.message)}</p>
          <button class="btn btn-primary eq-empty-cta" id="eq-resume-home">${esc(t('backToHome', 'Back to Home'))}</button>
        </div>
      `;
      const home = container.querySelector('#eq-resume-home');
      if (home) home.addEventListener('click', () => renderList(container));
    }
  }

  function renderResumeScreen(container, equipment, pending) {
    state.step = 'payment';
    container.innerHTML = `
      <div class="view-header">
        <button class="view-header-back" id="eq-resume-back">${ICON.back}<span>${esc(t('back', 'Back'))}</span></button>
        <div class="view-header-spacer"></div>
      </div>
      <div class="card">
        <div class="card-row">
          <span class="text-hint">${esc(t('equipmentTitle', 'Equipment'))}</span>
          <span><strong>${esc(equipment.name)}</strong></span>
        </div>
        <div class="card-row">
          <span class="text-hint">${esc(t('hospitalFee', 'Hospital Fee'))}</span>
          <span>${state.hospFee} ${esc(t('etb', 'ETB'))}</span>
        </div>
        <div class="card-row">
          <span class="text-hint">${esc(t('date', 'Date'))}</span>
          <span>${esc(state.dateId)}</span>
        </div>
        <div class="card-row">
          <span class="text-hint">${esc(t('time', 'Time'))}</span>
          <span>${esc(state.slotStart ? TimeUtils.formatTime(slotDate(state.dateId, state.slotStart)) : '-')}</span>
        </div>
        <div class="card-row">
          <span class="text-hint">${esc(t('total', 'Total'))}</span>
          <span><strong>${pending.totalPayable} ${esc(t('etb', 'ETB'))}</strong></span>
        </div>
      </div>
      <p class="text-hint eq-pay-note">${esc(t('autoCheckPayment', 'Payment is checked automatically as soon as you finish paying.'))}</p>
      <div class="eq-resume-actions">
        <button class="btn btn-primary" id="eq-resume-retry">${esc(t('retryVerify', 'Retry — Open Payment Again'))}</button>
        <button class="btn btn-outline" id="eq-resume-verify">${esc(t('alreadyPaidVerify', 'I Already Paid — Verify Now'))}</button>
      </div>
    `;

    container.querySelector('#eq-resume-back').addEventListener('click', () => renderList(container));
    container.querySelector('#eq-resume-retry').addEventListener('click', () => {
      openPaymentUrl(pending.totalPayable);
      renderResumeVerify(container, pending);
    });
    container.querySelector('#eq-resume-verify').addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      btn.disabled = true;
      btn.textContent = t('loading', 'Loading...');
      await verifyAndFinish(container, pending, btn, t('alreadyPaidVerify', 'I Already Paid — Verify Now'));
    });
  }

  async function verifyAndFinish(container, pending, btn, restoreLabel) {
    try {
      const res = await API.verifyTelebirr(pending.totalPayable);
      if (res && res.data && res.data.paid) {
        state.paymentDone = true;
        clearPending();
        if (state.selectedEquipment && state.step === 'detail') {
          await submitBooking(container);
        } else {
          await resumePendingPayment(container, pending);
        }
      } else {
        TG.showAlert(t('paymentNotDetected', 'Payment not detected yet. Please wait a moment and try again.'));
      }
    } catch {
      TG.showAlert(t('paymentNotDetectedVerify', 'Payment not detected yet. Make sure you completed the payment, then try again in a few seconds.'));
    } finally {
      if (btn && document.contains(btn)) {
        btn.disabled = false;
        btn.textContent = restoreLabel;
      }
    }
  }

  function renderResumeVerify(container, pending) {
    state.step = 'payment';
    container.innerHTML = `
      <div class="view-header">
        <button class="view-header-back" id="eq-rv-back">${ICON.back}<span>${esc(t('back', 'Back'))}</span></button>
        <div class="view-header-spacer"></div>
      </div>
      <div class="card eq-resume-card">
        <div class="spinner"></div>
        <h3 class="eq-resume-title">${esc(t('waitingForPayment', 'Waiting for payment...'))}</h3>
        <p class="text-hint eq-resume-line">${esc(t('completePaymentInPage', 'Complete payment in the Telebirr page, then come back here.'))}</p>
        <p class="text-hint eq-resume-line">${esc(t('amount', 'Amount'))}: <strong>${pending.totalPayable} ${esc(t('etb', 'ETB'))}</strong></p>
      </div>
      <div class="eq-resume-actions">
        <button class="btn btn-primary" id="eq-rv-verify">${esc(t('completedPaymentVerify', 'I Completed Payment — Verify'))}</button>
        <button class="btn btn-outline" id="eq-rv-home">${esc(t('backToHome', 'Back to Home'))}</button>
      </div>
    `;

    container.querySelector('#eq-rv-back').addEventListener('click', () => renderList(container));
    container.querySelector('#eq-rv-home').addEventListener('click', () => renderList(container));
    container.querySelector('#eq-rv-verify').addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      btn.disabled = true;
      btn.textContent = t('loading', 'Loading...');
      await verifyAndFinish(container, pending, btn, t('completedPaymentVerify', 'I Completed Payment — Verify'));
    });
  }

  return { render };
})();
