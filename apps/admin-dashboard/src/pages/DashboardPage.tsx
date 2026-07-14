import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPendingDoctors, fetchAllDoctors, reviewDoctor, deleteDoctor, assignHospitalToDoctor, createDoctor, createSchedule } from '../store/slices/doctorSlice';
import { fetchHospitals } from '../store/slices/hospitalSlice';
import { logout } from '../store/slices/authSlice';
import type { AppDispatch, RootState } from '../store';
import PatientsPage from './PatientsPage';
import AnalysisPage from './AnalysisPage';
import { ItemsPage } from './ItemsPage';
import { HospitalsPage } from './HospitalsPage';
import { ReviewsPage } from './ReviewsPage';
import { DoctorProfileView } from './DoctorProfileView';
import { AnnouncementsPage } from './AnnouncementsPage';
import ReportsPage from './ReportsPage';
import AppliedHospitalsPage from './AppliedHospitalsPage';
import { formatDate } from '../utils/ethiopianDate';
import { useTimeFormat, setTimeFormat, setCalendarFormat } from '../utils/timeFormat';
import {
  Users,
  LogOut,
  CheckCircle2,
  XCircle,
  ChevronRight,
  FileText,
  Video,
  Phone,
  Mail,
  User as UserIcon,
  Search,
  RefreshCcw,
  Filter,
  Activity,
  TrendingUp,
  Building2 as Building2Icon,
  Star,
  MessageSquare,
  Volume2,
  Package,
  BarChart3,
  Clock,
  PlusCircle,
  Briefcase,
  MapPin,
  Globe,
  DollarSign,
  Shield,
  FileBadge,
  CalendarDays,
  Building2,
  Languages,
  BadgeCheck,
} from 'lucide-react';

type TabView = 'dashboard' | 'patients' | 'analysis' | 'reports' | 'hospitals' | 'applied-hospitals' | 'items' | 'announcements' | 'reviews' | 'profile';

type NavigateOpts = {
  filter?: 'all' | 'active' | 'inactive';
  from?: 'reports' | 'reviews';
  doctorId?: number;
  replace?: boolean;
};

const DashboardPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { pendingDoctors = [], doctors = [], loading, error } = useSelector((state: RootState) => state.doctors);
  const { user } = useSelector((state: RootState) => state.auth);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const view = (searchParams.get('tab') || 'dashboard') as TabView;
  const patientFilter = (searchParams.get('filter') as 'all' | 'active' | 'inactive') || 'all';
  const navigationFrom = searchParams.get('from');
  const selectedDoctorId = searchParams.get('doctorId') ? Number(searchParams.get('doctorId')) : null;

  const navigateToTab = (tab: string, opts?: NavigateOpts) => {
    const params = new URLSearchParams();
    params.set('tab', tab);
    if (tab === 'patients') {
      if (opts?.filter && opts.filter !== 'all') {
        params.set('filter', opts.filter);
      }
    }
    if ((tab === 'patients' || tab === 'profile') && opts?.from) {
      params.set('from', opts.from);
    }
    if (tab === 'profile' && opts?.doctorId) {
      params.set('doctorId', String(opts.doctorId));
    }
    setSearchParams(params, { replace: opts?.replace ?? false });
  };
  const [listType, setListType] = useState<'pending' | 'all'>('pending');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Approved' | 'PendingReview' | 'Rejected'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [rejectModal, setRejectModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [hospitalsList, setHospitalsList] = useState<any[]>([]);
  const { isEthiopian, isEthiopianCalendar } = useTimeFormat();
  const [showSettingsPopover, setShowSettingsPopover] = useState(false);
  const [pendingAppsCount, setPendingAppsCount] = useState(0);
  const [showCreateDoctor, setShowCreateDoctor] = useState(false);
  const [createDoctorForm, setCreateDoctorForm] = useState({
    fullName: '', phone: '', email: '', specialization: '', licenseNumber: '',
    experienceYears: '', bio: '', clinicName: '', clinicAddress: '',
    languages: '', baseHourlyRate: '', hospitalId: '',
  });
  const [createDoctorError, setCreateDoctorError] = useState('');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    date: '', startTime: '', endTime: '', slotDuration: '30', maxPatientsPerSlot: '1', clinicRoom: '', notes: '',
  });
  const [scheduleError, setScheduleError] = useState('');
  const [scheduleSuccess, setScheduleSuccess] = useState('');

  const specializations = [
    'General Practice', 'Cardiology', 'Dermatology', 'Endocrinology', 'Gastroenterology',
    'Neurology', 'Oncology', 'Ophthalmology', 'Orthopedics', 'Otolaryngology (ENT)',
    'Pediatrics', 'Psychiatry', 'Pulmonology', 'Radiology', 'Surgery',
    'Urology', 'Nephrology', 'Rheumatology', 'Hematology', 'Infectious Disease',
    'Emergency Medicine', 'Anesthesiology', 'Obstetrics & Gynecology', 'Dentistry', 'Dermatology',
  ];

  useEffect(() => {
    const fetchApplicationsCount = async () => {
      try {
        const { default: apiClient } = await import('../api/client');
        const { data } = await apiClient.get('/admin/hospital-applications');
        const pendingCount = (data.data || []).filter((app: any) => app.status === 'PENDING').length;
        setPendingAppsCount(pendingCount);
      } catch { /* ignore */ }
    };
    fetchApplicationsCount();
    const interval = setInterval(fetchApplicationsCount, 30000);
    return () => clearInterval(interval);
  }, [view]);

  useEffect(() => {
    localStorage.setItem('admin_tab', view);
  }, [view]);

  useEffect(() => {
    const fetchAllHospitals = async () => {
      try {
        const { default: apiClient } = await import('../api/client');
        const { data } = await apiClient.get('/admin/hospitals?limit=200');
        setHospitalsList(data.data || []);
      } catch { /* ignore */ }
    };
    fetchAllHospitals();
  }, []);

  useEffect(() => {
    if (view !== 'dashboard') return;
    if (listType === 'pending') {
      dispatch(fetchPendingDoctors());
    } else {
      dispatch(fetchAllDoctors());
    }
  }, [dispatch, listType, view]);

  const filteredDoctors = (listType === 'pending' ? pendingDoctors : doctors).filter(doc => {
    if (!doc) return false;
    const fullName = doc.fullName || '';
    const specialization = doc.specialization || '';
    const matchesSearch = fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         specialization.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || doc.status === statusFilter;
    const matchesRating = (doc.rating || 0) >= minRating;
    return matchesSearch && matchesStatus && matchesRating;
  });

  const handleAction = (status: 'Approved' | 'Rejected') => {
    if (!selectedDoctor) return;
    if (status === 'Rejected' && !rejectionReason) {
      alert('Please provide a reason for rejection');
      return;
    }

    dispatch(reviewDoctor({ 
      doctorId: selectedDoctor.id, 
      status, 
      rejectionReason: status === 'Rejected' ? rejectionReason : null 
    }));
    
    setSelectedDoctor(null);
    setRejectModal(false);
    setRejectionReason('');
  };

  const handleDeleteDoctor = () => {
    if (!selectedDoctor) return;
    dispatch(deleteDoctor(selectedDoctor.id));
    setSelectedDoctor(null);
    navigateToTab('dashboard');
    setDeleteModal(false);
  };

  const handleCreateDoctor = async () => {
    setCreateDoctorError('');
    if (!createDoctorForm.fullName || !createDoctorForm.phone) {
      setCreateDoctorError('Full name and phone are required');
      return;
    }
    try {
      const fd = new FormData();
      fd.append('fullName', createDoctorForm.fullName);
      fd.append('phone', createDoctorForm.phone);
      if (createDoctorForm.email) fd.append('email', createDoctorForm.email);
      if (createDoctorForm.specialization) fd.append('specialization', createDoctorForm.specialization);
      if (createDoctorForm.licenseNumber) fd.append('licenseNumber', createDoctorForm.licenseNumber);
      if (createDoctorForm.experienceYears) fd.append('experienceYears', createDoctorForm.experienceYears);
      if (createDoctorForm.bio) fd.append('bio', createDoctorForm.bio);
      if (createDoctorForm.clinicName) fd.append('clinicName', createDoctorForm.clinicName);
      if (createDoctorForm.clinicAddress) fd.append('clinicAddress', createDoctorForm.clinicAddress);
      if (createDoctorForm.languages) fd.append('languages', JSON.stringify(createDoctorForm.languages.split(',').map((s: string) => s.trim()).filter(Boolean)));
      if (createDoctorForm.baseHourlyRate) fd.append('baseHourlyRate', createDoctorForm.baseHourlyRate);
      if (createDoctorForm.hospitalId) fd.append('hospitalId', createDoctorForm.hospitalId);
      const result = await dispatch(createDoctor(fd)).unwrap();
      setShowCreateDoctor(false);
      setCreateDoctorForm({ fullName: '', phone: '', email: '', specialization: '', licenseNumber: '', experienceYears: '', bio: '', clinicName: '', clinicAddress: '', languages: '', baseHourlyRate: '', hospitalId: '' });
      if (result?.tempPassword) {
        alert(`Doctor created successfully!\n\nTemp password: ${result.tempPassword}\n\nShare this with the doctor — they'll need it to log in.`);
      }
    } catch (err: any) {
      setCreateDoctorError(err || 'Failed to create doctor');
    }
  };

  const handleCreateSchedule = async () => {
    setScheduleError('');
    setScheduleSuccess('');
    if (!selectedDoctor || !scheduleForm.date || !scheduleForm.startTime || !scheduleForm.endTime) {
      setScheduleError('Date, start time, and end time are required');
      return;
    }
    try {
      await dispatch(createSchedule({
        doctorId: selectedDoctor.id,
        date: scheduleForm.date,
        startTime: `${scheduleForm.date}T${scheduleForm.startTime}:00.000Z`,
        endTime: `${scheduleForm.date}T${scheduleForm.endTime}:00.000Z`,
        slotDuration: parseInt(scheduleForm.slotDuration) || 30,
        maxPatientsPerSlot: parseInt(scheduleForm.maxPatientsPerSlot) || 1,
        clinicRoom: scheduleForm.clinicRoom || undefined,
        notes: scheduleForm.notes || undefined,
        hospitalId: selectedDoctor.hospitalId || null,
      })).unwrap();
      setScheduleSuccess('Schedule created successfully');
      setScheduleForm({ date: '', startTime: '', endTime: '', slotDuration: '30', maxPatientsPerSlot: '1', clinicRoom: '', notes: '' });
      setTimeout(() => setScheduleSuccess(''), 3000);
    } catch (err: any) {
      setScheduleError(err || 'Failed to create schedule');
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <h2 style={styles.logo}>BM Hub</h2>
          <nav style={styles.nav}>
            <button 
              onClick={() => navigateToTab('dashboard')} 
              style={{...styles.navBtn, color: view === 'dashboard' ? 'var(--accent-primary)' : 'var(--text-secondary)'}}
            >
              <Users size={18} /> Doctors
            </button>
            <button 
              onClick={() => navigateToTab('patients')} 
              style={{...styles.navBtn, color: view === 'patients' ? 'var(--accent-primary)' : 'var(--text-secondary)'}}
            >
              <UserIcon size={18} /> Patients
            </button>
            <button
              onClick={() => navigateToTab('reports')}
              style={{...styles.navBtn, color: view === 'reports' ? 'var(--accent-primary)' : 'var(--text-secondary)'}}
            >
              <BarChart3 size={18} /> Analysis
            </button>
            <button
              onClick={() => navigateToTab('hospitals')}
              style={{...styles.navBtn, color: view === 'hospitals' ? 'var(--accent-primary)' : 'var(--text-secondary)'}}
            >
              <Building2Icon size={18} /> Hospitals
            </button>
            <button
              onClick={() => navigateToTab('applied-hospitals')}
              style={{
                ...styles.navBtn,
                color: view === 'applied-hospitals' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                position: 'relative'
              }}
            >
              <Building2Icon size={18} /> Applied Hospitals
              {pendingAppsCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-6px',
                  right: '-12px',
                  backgroundColor: '#D92D20',
                  color: '#FFFFFF',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  borderRadius: '10px',
                  padding: '2px 6px',
                  minWidth: '16px',
                  textAlign: 'center',
                  boxShadow: '0 0 0 2px var(--surface)'
                }}>
                  {pendingAppsCount}
                </span>
              )}
            </button>
            <button 
              onClick={() => navigateToTab('items')} 
              style={{...styles.navBtn, color: view === 'items' ? 'var(--accent-primary)' : 'var(--text-secondary)'}}
            >
              <Package size={18} /> Medical Tools
            </button>
            <button
              onClick={() => navigateToTab('announcements')}
              style={{...styles.navBtn, color: view === 'announcements' ? 'var(--accent-primary)' : 'var(--text-secondary)'}}
            >
              <Volume2 size={18} /> Announcements
            </button>
            <button 
              onClick={() => navigateToTab('reviews')} 
              style={{...styles.navBtn, color: view === 'reviews' ? 'var(--accent-primary)' : 'var(--text-secondary)'}}
            >
              <Star size={18} /> Reviews
            </button>
          </nav>
        </div>
        <div style={styles.headerRight}>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowSettingsPopover(prev => !prev)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '8px 14px', borderRadius: '8px',
                border: `1.5px solid ${isEthiopian || isEthiopianCalendar ? '#7C3AED' : 'var(--accent-primary)'}`,
                background: isEthiopian || isEthiopianCalendar ? '#F3E8FF' : '#EFF6FF',
                cursor: 'pointer', fontSize: '13px', fontWeight: 500,
                color: isEthiopian || isEthiopianCalendar ? '#7C3AED' : 'var(--accent-primary)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.8'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
            >
              <Clock size={16} />
              {isEthiopian ? 'ቀን/ሌሊት' : 'AM/PM'} · {isEthiopianCalendar ? 'Eth. cal' : 'Greg.'}
            </button>
            {showSettingsPopover && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 9 }} onClick={() => setShowSettingsPopover(false)} />
                <div style={{
                  position: 'absolute', right: 0, top: '100%', marginTop: 4, zIndex: 10,
                  background: '#fff', borderRadius: '8px', boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                  border: '1px solid var(--border)', padding: 4, minWidth: 220,
                }}>
                  <div style={{ padding: '6px 12px', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                    Time
                  </div>
                  <div onClick={() => { setTimeFormat('western'); setShowSettingsPopover(false); }} style={{ padding: '8px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 13, background: !isEthiopian ? '#EFF6FF' : 'transparent', color: !isEthiopian ? 'var(--accent-primary)' : 'var(--text-secondary)', fontWeight: !isEthiopian ? 600 : 400 }}>
                    Standard (AM/PM)
                  </div>
                  <div onClick={() => { setTimeFormat('ethiopian'); setShowSettingsPopover(false); }} style={{ padding: '8px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 13, background: isEthiopian ? '#F3E8FF' : 'transparent', color: isEthiopian ? '#7C3AED' : 'var(--text-secondary)', fontWeight: isEthiopian ? 600 : 400 }}>
                    Ethiopian (ቀን/ሌሊት)
                  </div>
                  <div style={{ height: 1, background: 'var(--border)', margin: '6px 0' }} />
                  <div style={{ padding: '6px 12px', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                    Calendar
                  </div>
                  <div onClick={() => { setCalendarFormat('gregorian'); setShowSettingsPopover(false); }} style={{ padding: '8px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 13, background: !isEthiopianCalendar ? '#EFF6FF' : 'transparent', color: !isEthiopianCalendar ? 'var(--accent-primary)' : 'var(--text-secondary)', fontWeight: !isEthiopianCalendar ? 600 : 400 }}>
                    Gregorian
                  </div>
                  <div onClick={() => { setCalendarFormat('ethiopian'); setShowSettingsPopover(false); }} style={{ padding: '8px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 13, background: isEthiopianCalendar ? '#F3E8FF' : 'transparent', color: isEthiopianCalendar ? '#7C3AED' : 'var(--text-secondary)', fontWeight: isEthiopianCalendar ? 600 : 400 }}>
                    Ethiopian
                  </div>
                </div>
              </>
            )}
          </div>
          <div style={styles.adminInfo}>
            <p style={styles.adminEmail}>{user?.email}</p>
            <button onClick={() => dispatch(logout())} style={styles.logoutBtn}>
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {view === 'patients' ? (
        <PatientsPage
          initialFilter={patientFilter}
          onBack={navigationFrom === 'reports' ? () => navigate(-1) : undefined}
        />
      ) : view === 'reports' ? (
            <ReportsPage onNavigate={(_, filter) => navigateToTab('patients', { filter: filter || 'all', from: 'reports' })} />
      ) : view === 'reviews' ? (
        <ReviewsPage onViewProfile={(id) => navigateToTab('profile', { doctorId: id, from: 'reviews' })} />
      ) : view === 'profile' && selectedDoctorId ? (
        <DoctorProfileView
          doctorId={selectedDoctorId}
          backLabel={navigationFrom === 'reviews' ? 'Back to Reviews' : 'Back to Directory'}
          onBack={
            navigationFrom === 'reviews'
              ? () => navigate(-1)
              : () => navigateToTab('dashboard')
          }
        />
      ) : view === 'analysis' ? (
        <AnalysisPage />
      ) : view === 'hospitals' ? (
        <HospitalsPage />
      ) : view === 'applied-hospitals' ? (
        <AppliedHospitalsPage />
      ) : view === 'items' ? (
        <ItemsPage />
      ) : view === 'announcements' ? (
        <AnnouncementsPage />
      ) : view === 'reviews' ? (
        <ReviewsPage />
      ) : (
        <main style={styles.main}>
          <section style={styles.listSection}>
            <div style={styles.sectionHeader}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <h3 
                  style={{...styles.sectionTitle, cursor: 'pointer', borderBottom: listType === 'pending' ? '2px solid var(--accent-primary)' : 'none', color: listType === 'pending' ? 'var(--text-primary)' : 'var(--text-secondary)'}}
                  onClick={() => setListType('pending')}
                >
                  Pending
                </h3>
                <h3 
                  style={{...styles.sectionTitle, cursor: 'pointer', borderBottom: listType === 'all' ? '2px solid var(--accent-primary)' : 'none', color: listType === 'all' ? 'var(--text-primary)' : 'var(--text-secondary)'}}
                  onClick={() => setListType('all')}
                >
                  All Doctors
                </h3>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button onClick={() => setShowCreateDoctor(true)} style={{ backgroundColor: 'var(--accent-primary)', color: '#FFF', padding: '8px 14px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                  <PlusCircle size={16} /> Create Doctor
                </button>
                <button onClick={() => listType === 'pending' ? dispatch(fetchPendingDoctors()) : dispatch(fetchAllDoctors())} style={styles.refreshBtn}>
                  <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>

            <div style={styles.searchBar}>
              <Search size={18} color="var(--text-secondary)" />
              <input 
                type="text" 
                placeholder="Search doctors..." 
                style={styles.searchInput} 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div style={styles.filterRow}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                <Star size={14} color="var(--text-secondary)" />
                <select 
                  style={styles.select} 
                  value={minRating} 
                  onChange={(e: any) => setMinRating(parseFloat(e.target.value))}
                >
                  <option value="0">All Ratings</option>
                  <option value="3">3+ Stars</option>
                  <option value="4">4+ Stars</option>
                  <option value="4.5">4.5+ Stars</option>
                </select>
              </div>
              {listType === 'all' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Filter size={14} color="var(--text-secondary)" />
                  <select 
                    style={styles.select} 
                    value={statusFilter} 
                    onChange={(e: any) => setStatusFilter(e.target.value)}
                  >
                    <option value="All">All Status</option>
                    <option value="Approved">Approved</option>
                    <option value="PendingReview">Pending</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              )}
            </div>

            <div style={styles.doctorList}>
              {filteredDoctors.length === 0 && !loading && (
                <div style={styles.emptyState}>
                  <Users size={48} color="var(--border)" />
                  <p>No doctors found</p>
                </div>
              )}
              
              {filteredDoctors.map(doctor => (
                <div 
                  key={doctor.id} 
                  className="paper-card" 
                  style={{
                    ...styles.doctorCard,
                    borderColor: selectedDoctor?.id === doctor.id ? 'var(--accent-secondary)' : 'var(--border)',
                    backgroundColor: selectedDoctor?.id === doctor.id ? '#F0F4F8' : 'var(--surface)'
                  }}
                  onClick={() => setSelectedDoctor(doctor)}
                >
                  <div style={styles.cardHeader}>
                    {doctor.profilePicture ? (
                      <img src={doctor.profilePicture} alt="" style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'cover' }} />
                    ) : (
                      <div style={styles.avatarPlaceholder}>
                        {(doctor.fullName || 'D').charAt(0)}
                      </div>
                    )}
                    <div style={styles.cardInfo}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <p style={styles.doctorName}>{doctor.fullName || 'Unnamed Doctor'}</p>
                        {listType === 'all' && (
                          <span style={{
                            ...styles.statusDot,
                            backgroundColor: doctor.status === 'Approved' ? '#027A48' : doctor.status === 'Rejected' ? '#D92D20' : '#F79009'
                          }} />
                        )}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <p style={styles.doctorSpec}>{doctor.specialization || 'General Practice'}</p>
                        {(doctor.rating || 0) > 0 && (
                          <div style={styles.miniRating}>
                            <Star size={10} fill="#F59E0B" color="#F59E0B" />
                            <span>{(doctor.rating || 0).toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <ChevronRight size={18} color="var(--text-secondary)" />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section style={styles.detailSection}>
            {selectedDoctor ? (
              <div className="animate-fade" style={styles.detailView}>
                <div style={styles.detailHeader}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <h2 style={styles.detailTitle}>Professional Profile</h2>
                    {selectedDoctor.status === 'Approved' && (
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <span style={styles.approvedBadge}>
                          <CheckCircle2 size={14} /> Approved
                        </span>
                        <button 
                          onClick={() => navigateToTab('profile', { doctorId: selectedDoctor.id })}
                          style={styles.viewAnalysisBtn}
                        >
                          View Full Analysis <Activity size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteModal(true)}
                          style={styles.deleteBtn}
                        >
                          Delete Doctor
                        </button>
                      </div>
                    )}
                    {selectedDoctor.status === 'Rejected' && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#FEE2E2', color: '#B91C1C', padding: '4px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: '600' }}>
                        <XCircle size={14} /> Rejected
                      </span>
                    )}
                  </div>
                  {selectedDoctor.status === 'PendingReview' && (
                    <div style={styles.actionButtons}>
                      <button style={styles.approveBtn} onClick={() => handleAction('Approved')}>
                        <CheckCircle2 size={18} /> Approve Doctor
                      </button>
                      <button style={styles.rejectBtn} onClick={() => setRejectModal(true)}>
                        <XCircle size={18} /> Reject
                      </button>
                    </div>
                  )}
                </div>

                {selectedDoctor.status === 'Rejected' && selectedDoctor.rejectionReason && (
                  <div style={{ backgroundColor: '#FEF3F2', border: '1px solid #FEE4E2', borderRadius: '12px', padding: '16px 20px', marginBottom: '24px' }}>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: '#B42318', marginBottom: '4px' }}>Rejection Reason</p>
                    <p style={{ fontSize: '14px', color: '#7A271A' }}>{selectedDoctor.rejectionReason}</p>
                  </div>
                )}

                <div style={styles.detailGrid}>
                  {/* Identity & Contact */}
                  <div className="paper-card" style={styles.infoCard}>
                    <h4 style={styles.infoTitle}><UserIcon size={16} /> Identity & Contact</h4>
                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}>Full Name</span>
                      <span style={styles.infoValue}>{selectedDoctor.fullName || 'N/A'}</span>
                    </div>
                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}><Phone size={14} /> Phone</span>
                      <span style={styles.infoValue}>{selectedDoctor.user?.phone || 'N/A'}</span>
                    </div>
                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}><Mail size={14} /> Email</span>
                      <span style={styles.infoValue}>{selectedDoctor.user?.email || 'N/A'}</span>
                    </div>
                  </div>

                  {/* Professional Info */}
                  <div className="paper-card" style={styles.infoCard}>
                    <h4 style={styles.infoTitle}><Briefcase size={16} /> Professional Info</h4>
                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}>Specialization</span>
                      <span style={styles.infoValue}>{selectedDoctor.specialization || 'N/A'}</span>
                    </div>
                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}><BadgeCheck size={14} /> License Number</span>
                      <span style={styles.infoValue}>{selectedDoctor.licenseNumber || 'N/A'}</span>
                    </div>
                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}><CalendarDays size={14} /> Experience</span>
                      <span style={styles.infoValue}>{selectedDoctor.experienceYears != null ? `${selectedDoctor.experienceYears} years` : 'N/A'}</span>
                    </div>
                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}><DollarSign size={14} /> Hourly Rate</span>
                      <span style={styles.infoValue}>{selectedDoctor.baseHourlyRate ? `${selectedDoctor.baseHourlyRate} ETB` : 'N/A'}</span>
                    </div>
                  </div>

                  {/* Clinic & Practice */}
                  <div className="paper-card" style={styles.infoCard}>
                    <h4 style={styles.infoTitle}><Building2 size={16} /> Clinic & Practice</h4>
                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}>Clinic Name</span>
                      <span style={styles.infoValue}>{selectedDoctor.clinicName || 'N/A'}</span>
                    </div>
                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}><MapPin size={14} /> Clinic Address</span>
                      <span style={styles.infoValue}>{selectedDoctor.clinicAddress || 'N/A'}</span>
                    </div>
                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}><Globe size={14} /> Languages</span>
                      <span style={styles.infoValue}>{Array.isArray(selectedDoctor.languages) && selectedDoctor.languages.length > 0 ? selectedDoctor.languages.join(', ') : 'N/A'}</span>
                    </div>
                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}><Shield size={14} /> Status</span>
                      <span style={{...styles.infoValue, color: selectedDoctor.status === 'Approved' ? '#027A48' : selectedDoctor.status === 'Rejected' ? '#B91C1C' : '#F79009', fontWeight: 600}}>
                        {selectedDoctor.status === 'PendingReview' ? 'Pending Review' : selectedDoctor.status || 'N/A'}
                      </span>
                    </div>
                  </div>

                  {/* Performance */}
                  <div className="paper-card" style={styles.infoCard}>
                    <h4 style={styles.infoTitle}><Star size={16} /> Performance</h4>
                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}>Rating</span>
                      <span style={{...styles.infoValue, color: '#F59E0B', display: 'flex', alignItems: 'center', gap: '4px'}}>
                        <Star size={14} fill="#F59E0B" /> {(selectedDoctor.rating || 0).toFixed(1)}
                      </span>
                    </div>
                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}>Total Reviews</span>
                      <span style={styles.infoValue}>{selectedDoctor.totalReviews || 0}</span>
                    </div>
                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}>Specializations</span>
                      <span style={styles.infoValue}>{Array.isArray(selectedDoctor.specializations) && selectedDoctor.specializations.length > 0 ? selectedDoctor.specializations.join(', ') : 'N/A'}</span>
                    </div>
                    {selectedDoctor.user?.createdAt && (
                      <div style={styles.infoRow}>
                        <span style={styles.infoLabel}>Registered</span>
                        <span style={styles.infoValue}>{formatDate(new Date(selectedDoctor.user.createdAt), 'medium')}</span>
                      </div>
                    )}
                  </div>

                  {/* Feedback */}
                  {selectedDoctor.reviews?.length > 0 && (
                    <div className="paper-card" style={{...styles.infoCard, gridColumn: 'span 2'}}>
                      <h4 style={styles.infoTitle}><MessageSquare size={16} /> Feedback ({selectedDoctor.reviews.length})</h4>
                      {selectedDoctor.reviews.map((rev: any) => (
                        <div key={rev.id} style={styles.reviewItem}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', gap: '2px' }}>
                              {[...Array(rev.rating || 0)].map((_, i) => <Star key={i} size={10} fill="#F59E0B" color="#F59E0B" />)}
                            </div>
                            <span style={{ fontSize: '11px', color: '#94A3B8' }}>{formatDate(new Date(rev.createdAt), 'medium')}</span>
                          </div>
                          <p style={styles.reviewText}>"{rev.comment}"</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Biography */}
                  <div className="paper-card" style={{...styles.infoCard, gridColumn: 'span 2'}}>
                    <h4 style={styles.infoTitle}>Biography</h4>
                    <p style={styles.bioText}>{selectedDoctor.bio || 'No biography provided.'}</p>
                  </div>

                  {/* Media */}
                  <div className="paper-card" style={{...styles.infoCard, gridColumn: 'span 2'}}>
                    <h4 style={styles.infoTitle}><Video size={16} /> Media</h4>
                    {selectedDoctor.profilePicture || selectedDoctor.introVideo ? (
                      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                        {selectedDoctor.profilePicture && (
                          <div>
                            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Profile Photo</div>
                            <img
                              src={selectedDoctor.profilePicture}
                              alt=""
                              style={{ width: 160, height: 160, objectFit: 'cover', borderRadius: '16px', border: '1px solid var(--border)' }}
                            />
                          </div>
                        )}
                        {selectedDoctor.introVideo && (
                          <div>
                            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Intro Video</div>
                            <video
                              src={selectedDoctor.introVideo}
                              controls
                              style={{ width: 280, height: 160, borderRadius: '16px', background: '#000' }}
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>N/A</p>
                    )}
                  </div>

                  {/* Hospital Assignment */}
                  <div className="paper-card" style={{...styles.infoCard, gridColumn: 'span 2'}}>
                    <h4 style={styles.infoTitle}><Building2Icon size={16} /> Hospital Assignment</h4>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <select
                        style={{
                          flex: 1,
                          padding: '10px 14px',
                          borderRadius: '8px',
                          border: '1px solid var(--border)',
                          fontSize: '14px',
                          outline: 'none',
                        }}
                        value={selectedDoctor.hospitalId || ''}
                        onChange={(e) => {
                          const val = e.target.value ? parseInt(e.target.value) : null;
                          dispatch(assignHospitalToDoctor({ doctorId: selectedDoctor.id, hospitalId: val }));
                        }}
                      >
                        <option value="">-- No Hospital --</option>
                        {hospitalsList.map((h: any) => (
                          <option key={h.id} value={h.id}>{h.name}</option>
                        ))}
                      </select>
                      {selectedDoctor.hospital && (
                        <span style={{
                          backgroundColor: '#ECFDF3',
                          color: '#027A48',
                          padding: '4px 12px',
                          borderRadius: '100px',
                          fontSize: '12px',
                          fontWeight: '600',
                        }}>
                          {selectedDoctor.hospital.name}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Schedule Management */}
                  <div className="paper-card" style={{...styles.infoCard, gridColumn: 'span 2'}}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <h4 style={{...styles.infoTitle, marginBottom: 0 }}><Clock size={16} /> Schedule</h4>
                      <button
                        onClick={() => { setShowScheduleModal(true); setScheduleError(''); setScheduleSuccess(''); }}
                        style={{ backgroundColor: 'var(--accent-primary)', color: '#FFF', padding: '6px 14px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer' }}
                      >
                        <PlusCircle size={14} /> Create Schedule
                      </button>
                    </div>
                    {scheduleSuccess && (
                      <div style={{ backgroundColor: '#ECFDF3', border: '1px solid #D1FAE5', borderRadius: '8px', padding: '8px 14px', marginBottom: '8px', color: '#027A48', fontSize: '13px' }}>
                        {scheduleSuccess}
                      </div>
                    )}
                    {selectedDoctor.status === 'Approved' ? (
                      <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                        Click "Create Schedule" to add available time slots for this doctor.
                      </p>
                    ) : (
                      <p style={{ color: '#F79009', fontSize: '13px' }}>
                        Doctor must be approved before schedules can be created.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div style={styles.selectPrompt}>
                <Users size={64} color="var(--border)" />
                <h3>Select a doctor to review</h3>
              </div>
            )}
          </section>
        </main>
      )}

      {rejectModal && (
        <div style={styles.modalOverlay}>
          <div className="glass-card animate-fade" style={styles.modalContent}>
            <h3>Reject Application</h3>
            <textarea 
              style={styles.textarea}
              placeholder="Reason for rejection..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
            <div style={styles.modalActions}>
              <button style={styles.cancelBtn} onClick={() => setRejectModal(false)}>Cancel</button>
              <button style={styles.confirmRejectBtn} onClick={() => handleAction('Rejected')}>Confirm</button>
            </div>
          </div>
        </div>
      )}

      {deleteModal && (
        <div style={styles.modalOverlay}>
          <div className="glass-card animate-fade" style={styles.modalContent}>
            <h3>Delete Doctor</h3>
            <p style={{ marginBottom: '20px', color: '#475569' }}>
              Are you sure you want to delete {selectedDoctor?.fullName || 'this doctor'}? This cannot be undone.
            </p>
            <div style={styles.modalActions}>
              <button style={styles.cancelBtn} onClick={() => setDeleteModal(false)}>Cancel</button>
              <button style={styles.deleteConfirmBtn} onClick={handleDeleteDoctor}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {showCreateDoctor && (
        <div style={styles.modalOverlay}>
          <div className="glass-card animate-fade" style={{...styles.modalContent, width: '560px', maxHeight: '85vh', overflowY: 'auto'}}>
            <h3 style={{ marginBottom: '20px' }}>Create Doctor Account</h3>
            {createDoctorError && (
              <div style={{ backgroundColor: '#FEF3F2', border: '1px solid #FEE4E2', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', color: '#B42318', fontSize: '13px' }}>
                {createDoctorError}
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={styles.formLabel}>Full Name *</label>
                <input style={styles.formInput} value={createDoctorForm.fullName} onChange={e => setCreateDoctorForm(p => ({...p, fullName: e.target.value}))} placeholder="Dr. John Doe" />
              </div>
              <div>
                <label style={styles.formLabel}>Phone *</label>
                <input style={styles.formInput} value={createDoctorForm.phone} onChange={e => setCreateDoctorForm(p => ({...p, phone: e.target.value}))} placeholder="+251911223344" />
              </div>
              <div>
                <label style={styles.formLabel}>Email</label>
                <input style={styles.formInput} type="email" value={createDoctorForm.email} onChange={e => setCreateDoctorForm(p => ({...p, email: e.target.value}))} placeholder="doctor@email.com" />
              </div>
              <div>
                <label style={styles.formLabel}>Specialization</label>
                <select style={styles.formInput} value={createDoctorForm.specialization} onChange={e => setCreateDoctorForm(p => ({...p, specialization: e.target.value}))}>
                  <option value="">Select specialization</option>
                  {specializations.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={styles.formLabel}>License Number</label>
                <input style={styles.formInput} value={createDoctorForm.licenseNumber} onChange={e => setCreateDoctorForm(p => ({...p, licenseNumber: e.target.value}))} placeholder="MD-12345" />
              </div>
              <div>
                <label style={styles.formLabel}>Experience (years)</label>
                <input style={styles.formInput} type="number" min="0" value={createDoctorForm.experienceYears} onChange={e => setCreateDoctorForm(p => ({...p, experienceYears: e.target.value}))} placeholder="5" />
              </div>
              <div>
                <label style={styles.formLabel}>Hourly Rate (ETB)</label>
                <input style={styles.formInput} type="number" min="0" value={createDoctorForm.baseHourlyRate} onChange={e => setCreateDoctorForm(p => ({...p, baseHourlyRate: e.target.value}))} placeholder="500" />
              </div>
              <div>
                <label style={styles.formLabel}>Languages</label>
                <input style={styles.formInput} value={createDoctorForm.languages} onChange={e => setCreateDoctorForm(p => ({...p, languages: e.target.value}))} placeholder="Amharic, English" />
              </div>
              <div>
                <label style={styles.formLabel}>Hospital</label>
                <select style={styles.formInput} value={createDoctorForm.hospitalId} onChange={e => setCreateDoctorForm(p => ({...p, hospitalId: e.target.value}))}>
                  <option value="">None</option>
                  {hospitalsList.map((h: any) => <option key={h.id} value={h.id}>{h.name}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={styles.formLabel}>Clinic Name</label>
                <input style={styles.formInput} value={createDoctorForm.clinicName} onChange={e => setCreateDoctorForm(p => ({...p, clinicName: e.target.value}))} placeholder="City Clinic" />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={styles.formLabel}>Clinic Address</label>
                <input style={styles.formInput} value={createDoctorForm.clinicAddress} onChange={e => setCreateDoctorForm(p => ({...p, clinicAddress: e.target.value}))} placeholder="Bole, Addis Ababa" />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={styles.formLabel}>Bio</label>
                <textarea style={{...styles.formInput, height: '80px', resize: 'vertical'}} value={createDoctorForm.bio} onChange={e => setCreateDoctorForm(p => ({...p, bio: e.target.value}))} placeholder="A short bio about the doctor..." />
              </div>
            </div>
            <div style={{...styles.modalActions, marginTop: '20px' }}>
              <button style={styles.cancelBtn} onClick={() => { setShowCreateDoctor(false); setCreateDoctorError(''); }}>Cancel</button>
              <button style={{...styles.approveBtn}} onClick={handleCreateDoctor}>
                <PlusCircle size={16} /> Create Doctor
              </button>
            </div>
          </div>
        </div>
      )}

      {showScheduleModal && selectedDoctor && (
        <div style={styles.modalOverlay}>
          <div className="glass-card animate-fade" style={{...styles.modalContent, width: '480px'}}>
            <h3 style={{ marginBottom: '20px' }}>Create Schedule — {selectedDoctor.fullName}</h3>
            {scheduleError && (
              <div style={{ backgroundColor: '#FEF3F2', border: '1px solid #FEE4E2', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', color: '#B42318', fontSize: '13px' }}>
                {scheduleError}
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={styles.formLabel}>Date *</label>
                <input style={styles.formInput} type="date" value={scheduleForm.date} onChange={e => setScheduleForm(p => ({...p, date: e.target.value}))} />
              </div>
              <div>
                <label style={styles.formLabel}>Slot Duration (min)</label>
                <input style={styles.formInput} type="number" min="5" value={scheduleForm.slotDuration} onChange={e => setScheduleForm(p => ({...p, slotDuration: e.target.value}))} />
              </div>
              <div>
                <label style={styles.formLabel}>Start Time *</label>
                <input style={styles.formInput} type="time" value={scheduleForm.startTime} onChange={e => setScheduleForm(p => ({...p, startTime: e.target.value}))} />
              </div>
              <div>
                <label style={styles.formLabel}>End Time *</label>
                <input style={styles.formInput} type="time" value={scheduleForm.endTime} onChange={e => setScheduleForm(p => ({...p, endTime: e.target.value}))} />
              </div>
              <div>
                <label style={styles.formLabel}>Max Patients / Slot</label>
                <input style={styles.formInput} type="number" min="1" value={scheduleForm.maxPatientsPerSlot} onChange={e => setScheduleForm(p => ({...p, maxPatientsPerSlot: e.target.value}))} />
              </div>
              <div>
                <label style={styles.formLabel}>Clinic Room</label>
                <input style={styles.formInput} value={scheduleForm.clinicRoom} onChange={e => setScheduleForm(p => ({...p, clinicRoom: e.target.value}))} placeholder="Room 101" />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={styles.formLabel}>Notes</label>
                <textarea style={{...styles.formInput, height: '60px', resize: 'vertical'}} value={scheduleForm.notes} onChange={e => setScheduleForm(p => ({...p, notes: e.target.value}))} placeholder="Optional notes..." />
              </div>
            </div>
            <div style={{...styles.modalActions, marginTop: '20px' }}>
              <button style={styles.cancelBtn} onClick={() => setShowScheduleModal(false)}>Cancel</button>
              <button style={styles.approveBtn} onClick={handleCreateSchedule}>
                <PlusCircle size={16} /> Create Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  header: { height: '70px', backgroundColor: 'var(--surface)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', zIndex: 10 },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '32px' },
  logo: { fontSize: '20px', color: 'var(--accent-primary)', letterSpacing: '-0.5px', fontWeight: '800' },
  nav: { display: 'flex', gap: '24px' },
  navBtn: { backgroundColor: 'transparent', fontSize: '15px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', border: 'none', cursor: 'pointer' },
  headerRight: { display: 'flex', alignItems: 'center', gap: '16px' },
  adminInfo: { display: 'flex', alignItems: 'center', gap: '24px' },
  adminEmail: { fontSize: '14px', color: 'var(--text-secondary)' },
  logoutBtn: { backgroundColor: 'transparent', color: 'var(--status-error)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '500', border: 'none', cursor: 'pointer' },
  main: { flex: 1, display: 'flex', overflow: 'hidden' },
  listSection: { width: '400px', borderRight: '1px solid var(--border)', backgroundColor: '#FFF', display: 'flex', flexDirection: 'column', padding: '24px' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  sectionTitle: { fontSize: '18px', fontWeight: '600' },
  refreshBtn: { backgroundColor: 'transparent', color: 'var(--text-secondary)', border: 'none', cursor: 'pointer' },
  searchBar: { height: '44px', backgroundColor: 'var(--bg-primary)', borderRadius: '8px', display: 'flex', alignItems: 'center', padding: '0 12px', gap: '10px', marginBottom: '16px' },
  searchInput: { border: 'none', backgroundColor: 'transparent', outline: 'none', flex: 1, fontSize: '14px' },
  doctorList: { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' },
  doctorCard: { padding: '16px', cursor: 'pointer', borderRadius: '12px', border: '1px solid var(--border)' },
  cardHeader: { display: 'flex', alignItems: 'center', gap: '12px' },
  avatarPlaceholder: { width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'var(--accent-secondary)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700' },
  cardInfo: { flex: 1 },
  doctorName: { fontSize: '15px', fontWeight: '600', marginBottom: '2px' },
  doctorSpec: { fontSize: '13px', color: 'var(--text-secondary)' },
  detailSection: { flex: 1, backgroundColor: 'var(--bg-primary)', overflowY: 'auto', padding: '40px' },
  detailView: { maxWidth: '900px', margin: '0 auto' },
  detailHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' },
  detailTitle: { fontSize: '28px', color: 'var(--accent-primary)', fontWeight: '700' },
  actionButtons: { display: 'flex', gap: '12px' },
  approveBtn: { backgroundColor: 'var(--status-success)', color: '#FFF', padding: '10px 20px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', border: 'none', cursor: 'pointer' },
  rejectBtn: { backgroundColor: '#FFF', color: 'var(--status-error)', border: '1px solid var(--status-error)', padding: '10px 20px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', cursor: 'pointer' },
  detailGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' },
  infoCard: { padding: '24px', backgroundColor: '#FFF', borderRadius: '16px', border: '1px solid var(--border)' },
  infoTitle: { fontSize: '14px', color: 'var(--accent-secondary)', textTransform: 'uppercase', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700' },
  infoRow: { display: 'flex', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #F2F4F7' },
  infoLabel: { fontSize: '14px', color: 'var(--text-secondary)' },
  infoValue: { fontSize: '14px', fontWeight: '600' },
  bioText: { fontSize: '15px', lineHeight: '1.6' },
  selectPrompt: { height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' },
  filterRow: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' },
  select: { border: 'none', backgroundColor: 'transparent', fontSize: '14px', fontWeight: '500', outline: 'none', cursor: 'pointer' },
  statusDot: { width: '8px', height: '8px', borderRadius: '50%' },
  approvedBadge: { display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#ECFDF3', color: '#027A48', padding: '4px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: '600' },
  viewAnalysisBtn: { backgroundColor: '#F0F9FF', border: '1px solid #BAE6FD', color: '#0369A1', padding: '4px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' },
  miniRating: { display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#F59E0B', fontWeight: '700' },
  reviewItem: { padding: '12px', backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0', marginBottom: '8px' },
  reviewText: { fontSize: '13px', color: '#475569', fontStyle: 'italic', marginTop: '4px' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(16, 24, 40, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  modalContent: { width: '450px', padding: '32px', backgroundColor: '#FFF', borderRadius: '16px' },
  textarea: { width: '100%', height: '100px', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '20px' },
  modalActions: { display: 'flex', gap: '12px', justifyContent: 'flex-end' },
  cancelBtn: { backgroundColor: 'transparent', border: 'none', fontWeight: '500', cursor: 'pointer' },
  confirmRejectBtn: { backgroundColor: 'var(--status-error)', color: '#FFF', padding: '10px 20px', borderRadius: '8px', fontWeight: '600', border: 'none', cursor: 'pointer' },
  deleteBtn: { backgroundColor: '#FEE2E2', color: '#B91C1C', border: '1px solid #FCA5A5', padding: '8px 14px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' },
  deleteConfirmBtn: { backgroundColor: '#B91C1C', color: '#FFF', padding: '10px 20px', borderRadius: '8px', fontWeight: '600', border: 'none', cursor: 'pointer' },
  emptyState: { textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' },
  formLabel: { display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' },
  formInput: { width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '14px', outline: 'none', boxSizing: 'border-box' },
};

export default DashboardPage;
