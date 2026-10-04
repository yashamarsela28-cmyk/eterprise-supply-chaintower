import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import Breadcrumbs from './Breadcrumbs';

/**
 * Enterprise Application Shell
 */
export function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        backgroundColor: 'var(--color-bg-primary)',
        color: 'var(--color-text-primary)'
      }}
      className="app-shell"
    >
      {/* Top Header */}
      <Header onToggleSidebar={toggleSidebar} isSidebarOpen={sidebarOpen} />

      {/* Main Workspace Layout */}
      <div style={{ display: 'flex', flex: 1 }}>
        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} onCloseMobile={() => {}} />

        {/* Dynamic Page Content Area */}
        <main
          style={{
            flex: 1,
            padding: 'var(--space-6)',
            overflowY: 'auto',
            minWidth: 0,
            maxWidth: '1600px',
            margin: '0 auto',
            width: '100%'
          }}
        >
          <Breadcrumbs />
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppShell;
