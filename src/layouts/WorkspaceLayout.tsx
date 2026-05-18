import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import WorkspaceHeader from '../components/workspace/WorkspaceHeader';
import WorkspaceSidebar from '../components/workspace/WorkspaceSidebar';

export default function WorkspaceLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <WorkspaceSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <div className={`flex flex-col flex-1 min-w-0 overflow-hidden transition-all duration-300`}>
        <WorkspaceHeader />
        <main className="flex-1 overflow-y-auto p-5 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
