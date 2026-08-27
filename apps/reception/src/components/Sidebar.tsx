import { NavLink } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { Calendar, Stethoscope, Wrench, LogOut, LayoutDashboard, ChevronLeft, ChevronRight, Building2, UserRound, Scale, Bell } from 'lucide-react';
import { logout } from '../store/slices/authSlice';
import { fetchUnreadCount } from '../store/slices/notificationSlice';
import type { RootState } from '../store';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/doctors', icon: UserRound, label: 'Doctors' },
  { to: '/schedules', icon: Calendar, label: 'Schedules' },
  { to: '/appointments', icon: Stethoscope, label: 'Appointments' },
  { to: '/equipment', icon: Wrench, label: 'Equipment' },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
  { to: '/hospital', icon: Building2, label: 'Hospital' },
  { to: '/legal', icon: Scale, label: 'Legal' },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const { unreadCount } = useSelector((state: RootState) => state.notifications);

  useEffect(() => {
    dispatch(fetchUnreadCount());
    const interval = setInterval(() => dispatch(fetchUnreadCount()), 15000);
    return () => clearInterval(interval);
  }, [dispatch]);

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
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: 700, color: 'var(--accent-primary)' }}>
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

      <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {navItems.map((item) => (
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
            })}
          >
            <item.icon size={20} />
            {!collapsed && <span>{item.label}</span>}
            {item.to === '/notifications' && unreadCount > 0 && (
              <span
                style={{
                  marginLeft: 'auto',
                  background: '#DC2626',
                  color: '#fff',
                  borderRadius: '999px',
                  fontSize: 11,
                  fontWeight: 700,
                  minWidth: 18,
                  height: 18,
                  padding: '0 5px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div
        style={{
          padding: '12px 8px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        {!collapsed && (
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)', padding: '0 4px' }}>
            {user?.username}
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
