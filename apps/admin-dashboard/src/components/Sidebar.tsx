import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Users,
  User as UserIcon,
  BarChart3,
  Building2,
  Package,
  Volume2,
  Star,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileBadge,
  Briefcase,
} from 'lucide-react';
import { logout } from '../store/slices/authSlice';
import { useTimeFormat, setTimeFormat, setCalendarFormat } from '../utils/timeFormat';
import type { RootState } from '../store';

interface NavItem {
  to: string;
  icon: any;
  label: string;
  badge?: number;
}

const navItems: NavItem[] = [
  { to: '/', icon: Users, label: 'Doctors' },
  { to: '/patients', icon: UserIcon, label: 'Patients' },
  { to: '/analysis', icon: BarChart3, label: 'Analysis' },
  { to: '/hospitals', icon: Building2, label: 'Hospitals' },
  { to: '/hospital-registrations', icon: FileBadge, label: 'Hospital Registrations' },
  { to: '/applied-hospitals', icon: Briefcase, label: 'Applied Hospitals' },
  { to: '/medical-tools', icon: Package, label: 'Medical Tools' },
  { to: '/announcements', icon: Volume2, label: 'Announcements' },
  { to: '/reviews', icon: Star, label: 'Reviews' },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  pendingRegistrationsCount?: number;
  pendingAppsCount?: number;
}

function Sidebar({
  collapsed,
  onToggle,
  pendingRegistrationsCount = 0,
  pendingAppsCount = 0,
}: SidebarProps) {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const { isEthiopian, isEthiopianCalendar } = useTimeFormat();
  const [showSettings, setShowSettings] = useState(false);

  const getBadge = (to: string): number | undefined => {
    if (to === '/hospital-registrations' && pendingRegistrationsCount > 0) return pendingRegistrationsCount;
    if (to === '/applied-hospitals' && pendingAppsCount > 0) return pendingAppsCount;
    return undefined;
  };

  return (
    <aside
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        width: collapsed ? 64 : 240,
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.2s ease',
        zIndex: 100,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 16px',
          borderBottom: '1px solid var(--border)',
          minHeight: '68px',
        }}
      >
        {!collapsed && (
          <span
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '20px',
              fontWeight: 700,
              color: 'var(--accent-primary)',
            }}
          >
            BM Hub
          </span>
        )}
        <button
          onClick={onToggle}
          style={{
            background: 'transparent',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-secondary)',
            marginLeft: collapsed ? 'auto' : 0,
            marginRight: collapsed ? 'auto' : 0,
          }}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto' }}>
        {navItems.map((item) => {
          const badge = getBadge(item.to);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: collapsed ? '10px' : '10px 12px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: 500,
                color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                background: isActive ? '#E3EFFB' : 'transparent',
                justifyContent: collapsed ? 'center' : 'flex-start',
                position: 'relative',
              })}
            >
              <item.icon size={20} />
              {!collapsed && <span style={{ flex: 1 }}>{item.label}</span>}
              {!collapsed && badge !== undefined && (
                <span
                  style={{
                    backgroundColor: '#D92D20',
                    color: '#FFFFFF',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    borderRadius: '10px',
                    padding: '2px 6px',
                    minWidth: '16px',
                    textAlign: 'center',
                    lineHeight: '14px',
                  }}
                >
                  {badge}
                </span>
              )}
              {collapsed && badge !== undefined && (
                <span
                  style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    backgroundColor: '#D92D20',
                    color: '#FFFFFF',
                    fontSize: '9px',
                    fontWeight: 'bold',
                    borderRadius: '50%',
                    width: '16px',
                    height: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    lineHeight: 1,
                  }}
                >
                  {badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div
        style={{
          padding: '12px 8px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}
      >
        {/* Time format toggle */}
        {!collapsed && (
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowSettings((p) => !p)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                borderRadius: '8px',
                border: 'none',
                background: isEthiopian || isEthiopianCalendar ? '#F3E8FF' : '#EFF6FF',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 500,
                color: isEthiopian || isEthiopianCalendar ? '#7C3AED' : 'var(--accent-primary)',
                width: '100%',
              }}
            >
              <Clock size={16} />
              {isEthiopian ? 'ቀን/ሌሊት' : 'AM/PM'} · {isEthiopianCalendar ? 'Eth. cal' : 'Greg.'}
            </button>
            {showSettings && (
              <>
                <div
                  style={{ position: 'fixed', inset: 0, zIndex: 9 }}
                  onClick={() => setShowSettings(false)}
                />
                <div
                  style={{
                    position: 'absolute',
                    bottom: '100%',
                    left: 0,
                    right: 0,
                    marginBottom: 4,
                    zIndex: 10,
                    background: '#fff',
                    borderRadius: '8px',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                    border: '1px solid var(--border)',
                    padding: 4,
                  }}
                >
                  <div style={{ padding: '6px 12px', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                    Time
                  </div>
                  <div
                    onClick={() => { setTimeFormat('western'); setShowSettings(false); }}
                    style={{ padding: '8px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 13, background: !isEthiopian ? '#EFF6FF' : 'transparent', color: !isEthiopian ? 'var(--accent-primary)' : 'var(--text-secondary)', fontWeight: !isEthiopian ? 600 : 400 }}
                  >
                    Standard (AM/PM)
                  </div>
                  <div
                    onClick={() => { setTimeFormat('ethiopian'); setShowSettings(false); }}
                    style={{ padding: '8px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 13, background: isEthiopian ? '#F3E8FF' : 'transparent', color: isEthiopian ? '#7C3AED' : 'var(--text-secondary)', fontWeight: isEthiopian ? 600 : 400 }}
                  >
                    Ethiopian (ቀን/ሌሊት)
                  </div>
                  <div style={{ height: 1, background: 'var(--border)', margin: '6px 0' }} />
                  <div style={{ padding: '6px 12px', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                    Calendar
                  </div>
                  <div
                    onClick={() => { setCalendarFormat('gregorian'); setShowSettings(false); }}
                    style={{ padding: '8px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 13, background: !isEthiopianCalendar ? '#EFF6FF' : 'transparent', color: !isEthiopianCalendar ? 'var(--accent-primary)' : 'var(--text-secondary)', fontWeight: !isEthiopianCalendar ? 600 : 400 }}
                  >
                    Gregorian
                  </div>
                  <div
                    onClick={() => { setCalendarFormat('ethiopian'); setShowSettings(false); }}
                    style={{ padding: '8px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 13, background: isEthiopianCalendar ? '#F3E8FF' : 'transparent', color: isEthiopianCalendar ? '#7C3AED' : 'var(--text-secondary)', fontWeight: isEthiopianCalendar ? 600 : 400 }}
                  >
                    Ethiopian
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* User info + Logout */}
        {!collapsed && (
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)', padding: '0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.email}
          </span>
        )}
        <button
          onClick={() => dispatch(logout())}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: collapsed ? '10px' : '10px 12px',
            borderRadius: '8px',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
            color: 'var(--status-error)',
            justifyContent: collapsed ? 'center' : 'flex-start',
          }}
        >
          <LogOut size={18} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}

export { Sidebar };
export default Sidebar;
