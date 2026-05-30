import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import WorkspaceHeader from '../components/workspace/WorkspaceHeader';
import WorkspaceSidebar from '../components/workspace/WorkspaceSidebar';

export default function WorkspaceLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 relative">
      <WorkspaceSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Overlay for mobile when sidebar is open */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-30 md:hidden transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <div className={`flex flex-col flex-1 min-w-0 overflow-hidden transition-all duration-300`}>
        <WorkspaceHeader onOpenMobileMenu={() => setMobileMenuOpen(true)} />
        <main className="flex-1 overflow-y-auto p-2 md:p-2">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
