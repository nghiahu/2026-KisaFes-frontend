import { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Icons } from '../../assets/icons';
import { projectService } from '../../services/project.service';

const navSections = [
  {
    id: "main",
    label: "MAIN",
    items: [
      { id: "inbox", label: "Inbox", icon: Icons.inbox, path: "/workspace/inbox" },
      { id: "my_tasks", label: "My Tasks", icon: Icons.checkSquare, path: "/workspace/my-tasks" },
      { id: "projects", label: "Projects", icon: Icons.folderKanban, path: "/workspace/projects" },
      { id: "teams", label: "Teams", icon: Icons.users, path: "/workspace/teams" },
      { id: "calendar", label: "Calendar", icon: Icons.calendar, path: "/workspace/calendar" }
    ]
  },
  {
    id: "insights",
    label: "INSIGHTS",
    items: [
      { id: "reports", label: "Reports", icon: Icons.barChart3, path: "/workspace/reports" }
    ]
  },
  {
    id: "config",
    label: "CONFIG",
    items: [
      { id: "settings", label: "Settings", icon: Icons.settings, path: "/workspace/settings" }
    ]
  }
];

const getProjectColor = (name: string) => {
  const colors = ['#3B82F6', '#22C55E', '#F97316', '#A855F7', '#EC4899', '#06B6D4', '#EAB308'];
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash % colors.length)];
};

interface WorkspaceSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function WorkspaceSidebar({
  collapsed,
  onToggle,
}: WorkspaceSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await projectService.getAllProjects();
        setProjects(data);
      } catch (err) {
        console.error("Failed to load projects in sidebar:", err);
      }
    };
    fetchProjects();
    
    // Refresh sidebar list when navigating back to the project list or dashboard to keep sync
    const interval = setInterval(fetchProjects, 10000);
    return () => clearInterval(interval);
  }, [location.pathname]);

  const isActive = (path: string) => {
    if (path === '/workspace') return location.pathname === '/workspace';
    return location.pathname.startsWith(path);
  };

  return (
    <>
      <style>{`
        /* Hide scrollbar for Chrome, Safari and Opera */
        .sidebar-nav::-webkit-scrollbar {
          display: none;
        }
        /* Hide scrollbar for IE, Edge and Firefox */
        .sidebar-nav {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
      `}</style>
      <aside 
        style={{ fontFamily: 'Inter, sans-serif' }}
        className={`flex flex-col bg-[#0F172A] border-r border-slate-800/80 h-screen transition-all duration-300 relative z-40 ${
          collapsed ? 'w-[68px]' : 'w-[280px]'
        }`}
      >
        {/* Header */}
        <div className={`flex items-center px-[16px] py-[16px] shrink-0 border-b border-slate-800/30 ${
          collapsed ? 'justify-center px-0' : 'justify-between'
        }`}>
          <div className="flex items-center gap-[12px] min-w-0">
            <div className="w-[32px] h-[32px] rounded-lg bg-[#2563EB] flex items-center justify-center text-white font-black text-[16px] shrink-0 shadow-md shadow-blue-500/20">
              K
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <span className="text-[14px] font-bold text-[#E2E8F0] tracking-tight block truncate">KisaFres</span>
                <span className="text-[11px] font-medium text-[#94A3B8] block">Workspace</span>
              </div>
            )}
          </div>
        </div>

        {/* Collapse Toggle Button */}
        <button
          className="absolute -right-3 top-6 w-6 h-6 bg-[#0F172A] border border-slate-800 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-200 shadow-sm transition-all z-50 hover:border-slate-700"
          onClick={onToggle}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <Icons.chevronLeft
            size={12}
            className={`transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-[16px] py-[14px] sidebar-nav space-y-[16px]">
          {navSections.map((section) => (
            <div key={section.id}>
              {!collapsed && (
                <span className="px-3 text-[10px] font-semibold text-[#64748B] uppercase tracking-widest block mb-[4px]">
                  {section.label}
                </span>
              )}
              <ul className="space-y-[2px]">
                {section.items.map((item) => {
                  const isItemActive = isActive(item.path);
                  return (
                    <li key={item.id}>
                      <NavLink
                        to={item.path}
                        className={`relative flex items-center gap-[12px] h-[34px] px-3 rounded-[8px] font-medium text-[13px] transition-all duration-200 group ${
                          isItemActive
                            ? 'bg-[#1E293B] text-[#E2E8F0]'
                            : 'text-[#94A3B8] hover:bg-[#1E293B] hover:text-[#E2E8F0]'
                        } ${collapsed ? 'justify-center px-0' : ''}`}
                        title={collapsed ? item.label : undefined}
                      >
                        {/* Active Left Border Indicator */}
                        {isItemActive && !collapsed && (
                          <div className="absolute left-0 top-[6px] bottom-[6px] w-[3px] bg-[#3B82F6] rounded-r" />
                        )}
                        
                        <item.icon 
                          size={16} 
                          className={`shrink-0 ${
                            isItemActive ? 'text-[#3B82F6]' : 'text-[#94A3B8] group-hover:text-[#E2E8F0]'
                          }`} 
                        />
                        
                        {!collapsed && (
                          <div className="flex items-center justify-between flex-1 min-w-0">
                            <span className="truncate">{item.label}</span>
                            {(item as any).badge && (
                              <span className="text-[10px] font-bold bg-[#2563EB] text-[#FFFFFF] px-1.5 py-0.5 rounded-md min-w-[1.2rem] text-center">
                                {(item as any).badge}
                              </span>
                            )}
                          </div>
                        )}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          {/* PROJECTS SECTION */}
          <div>
            <div className="flex items-center justify-between px-3 mb-[4px]">
              {!collapsed && (
                <span className="text-[10px] font-semibold text-[#64748B] uppercase tracking-widest">
                  PROJECTS
                </span>
              )}
              {!collapsed && (
                <button 
                  onClick={() => navigate('/workspace/projects/new')}
                  className="text-[#94A3B8] hover:text-[#E2E8F0] transition-colors"
                  title="Create Project"
                >
                  <Icons.plus size={12} />
                </button>
              )}
            </div>
            <ul className="space-y-[2px]">
              {projects.map((project) => {
                const projectPath = `/workspace/projects/${project.id}`;
                const isProjActive = location.pathname === projectPath;
                const shortName = project.code || (project.name ? project.name.substring(0, 2).toUpperCase() : 'PR');
                const displayInitials = shortName.substring(0, 2).toUpperCase();
                const projectColor = getProjectColor(project.name || '');
                return (
                  <li key={project.id}>
                    <NavLink 
                      to={projectPath}
                      className={`relative w-full flex items-center gap-[12px] h-[36px] px-3 rounded-[8px] hover:bg-[#1E293B] hover:text-[#E2E8F0] transition-all duration-200 group ${
                        collapsed ? 'justify-center px-0' : ''
                      } ${isProjActive ? 'bg-[#1E293B] !text-[#E2E8F0]' : 'text-[#94A3B8]'}`}
                      title={collapsed ? project.name : undefined}
                    >
                      {/* Active Left Border Indicator */}
                      {isProjActive && !collapsed && (
                        <div className="absolute left-0 top-[6px] bottom-[6px] w-[3px] bg-[#3B82F6] rounded-r" />
                      )}

                      {/* Compact Avatar Display Style */}
                      <div 
                        className="w-[22px] h-[22px] rounded flex items-center justify-center text-[10px] font-black text-[#FFFFFF] shrink-0 shadow-sm transition-transform duration-200 group-hover:scale-105"
                        style={{ backgroundColor: projectColor }}
                      >
                        {displayInitials}
                      </div>
                      {!collapsed && (
                        <span className={`text-[13px] font-medium truncate ${isProjActive ? '!text-[#E2E8F0]' : 'text-[#94A3B8] group-hover:text-[#E2E8F0]'}`}>
                          {project.name}
                        </span>
                      )}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>
      </aside>
    </>
  );
}
