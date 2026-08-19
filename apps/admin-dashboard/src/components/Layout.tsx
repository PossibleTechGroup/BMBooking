import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [pendingRegistrationsCount, setPendingRegistrationsCount] = useState(0);
  const [pendingAppsCount, setPendingAppsCount] = useState(0);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const { default: apiClient } = await import('../api/client');
        const [appsRes, regsRes] = await Promise.all([
          apiClient.get('/admin/hospital-applications'),
          apiClient.get('/admin/hospital-registrations'),
        ]);
        setPendingAppsCount(
          (appsRes.data.data || []).filter((app: any) => app.status === 'PENDING').length
        );
        setPendingRegistrationsCount(
          (regsRes.data.data || []).filter((reg: any) => reg.status === 'PENDING').length
        );
      } catch { /* ignore */ }
    };
    fetchCounts();
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
        pendingRegistrationsCount={pendingRegistrationsCount}
        pendingAppsCount={pendingAppsCount}
      />
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          marginLeft: collapsed ? 64 : 240,
          transition: 'margin-left 0.2s ease',
        }}
      >
        <div
          style={{
            flex: 1,
            padding: '24px',
            background: 'var(--bg-primary)',
          }}
        >
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default Layout;
