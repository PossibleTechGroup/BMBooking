import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Toast from './Toast';

function Layout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
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
      <Toast />
    </div>
  );
}

export default Layout;
