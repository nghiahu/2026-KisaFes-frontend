import React, { useState, useEffect } from 'react';
import { Icons } from '../../assets/icons';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { AlertCircle, Ban, Star, Users, Settings, Trash2 } from 'lucide-react';
import defaultMan from '../../assets/avatar_def_man.png';
import type { Project, ProjectStatus } from '../../types/project.interface';
import type { Category } from '../../types/category.interface';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchProjects } from '../../store/slices/projectSlice';
import { fetchCategories } from '../../store/slices/categorySlice';

export default function Projects() {
  const navigate = useNavigate();
  const [viewType, setViewType] = useState<'grid' | 'list'>('grid');
  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeDropdownProjectId, setActiveDropdownProjectId] = useState<string | null>(null);
  
  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All Statuses');
  const [selectedCategory, setSelectedCategory] = useState<string>('All Categories');
  const [sortBy, setSortBy] = useState<string>('updatedAt-desc');
  
  const user = useSelector((state: any) => state.auth.user);
  
  const dispatch = useAppDispatch();
  const { projects: backendProjects, loading: isProjectsLoading } = useAppSelector((state) => state.project);
  const { categories: backendCategories, loading: isCategoriesLoading } = useAppSelector((state) => state.category);

  useEffect(() => {
    dispatch(fetchProjects());
    dispatch(fetchCategories());
  }, [dispatch]);

  useEffect(() => {
    setCategories(backendCategories);
    if (backendProjects) {
      // Map backend projects to frontend Project interface
      const mappedProjects: Project[] = backendProjects.map((p: any) => ({
        id: p.id,
        name: p.name,
        code: p.code,
        description: p.description,
        category: backendCategories.find(c => c.id === p.categoryId)?.name || 'General',
        status: 'ACTIVE', // Default status as backend doesn't have it yet in root
        progress: p.totalTasksCount > 0 ? Math.round((p.completedTasksCount / p.totalTasksCount) * 100) : 0,
        members: p.members?.map((m: any) => ({
          id: m.id,
          name: m.name,
          avatar: m.avatar || defaultMan
        })) || [],
        isFavorite: p.favoriteBy?.includes(user?.userId),
        dueDate: p.deadlineDisplay || 'Not set',
        updatedAt: new Date(p.updatedAt).toLocaleDateString(),
        lead: p.members?.[0] ? {
          id: p.members[0].id,
          name: p.members[0].name,
          avatar: p.members[0].avatar || defaultMan
        } : undefined,
        activeSprintName: p.activeSprintName || 'No active sprint',
        completedTasksCount: p.completedTasksCount || 0,
        totalTasksCount: p.totalTasksCount || 0,
        blockedTasksCount: p.blockedTasksCount || 0,
        openIssuesCount: p.openIssuesCount || 0,
        deadlineDisplay: p.deadlineDisplay || 'Not set'
      }));

      setProjects(mappedProjects);
    }
  }, [backendProjects, backendCategories, user]);

  useEffect(() => {
    setIsLoading(isProjectsLoading || isCategoriesLoading);
  }, [isProjectsLoading, isCategoriesLoading]);

  const toggleFavorite = (id: string) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, isFavorite: !p.isFavorite } : p));
    // TODO: Call API to toggle favorite
  };

  // Filter and sort projects dynamically
  const filteredAndSortedProjects = projects.filter(project => {
    // 1. Search Query Filter
    const matchesSearch = searchQuery.trim() === '' || 
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase()));

    // 2. Status Filter
    const matchesStatus = selectedStatus === 'All Statuses' || 
      project.status.toLowerCase() === selectedStatus.toLowerCase();

    // 3. Category Filter
    const matchesCategory = selectedCategory === 'All Categories' || 
      project.category === selectedCategory;

    return matchesSearch && matchesStatus && matchesCategory;
  }).sort((a, b) => {
    // 4. Sort
    const [field, order] = sortBy.split('-');
    const isAsc = order === 'asc';
    
    if (field === 'name') {
      return isAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
    } else if (field === 'code') {
      return isAsc ? a.code.localeCompare(b.code) : b.code.localeCompare(a.code);
    } else {
      // Parse dates safely for sorting (format e.g. "DD/MM/YYYY" or standard locale strings)
      const parseDate = (dStr: string) => {
        const parts = dStr.split('/');
        if (parts.length === 3) {
          const d = parseInt(parts[0], 10);
          const m = parseInt(parts[1], 10) - 1;
          const y = parseInt(parts[2], 10);
          return new Date(y, m, d).getTime();
        }
        return new Date(dStr).getTime() || 0;
      };
      const dateA = parseDate(a.updatedAt);
      const dateB = parseDate(b.updatedAt);
      return isAsc ? dateA - dateB : dateB - dateA;
    }
  });

  const favoriteProjects = filteredAndSortedProjects.filter(p => p.isFavorite);
  const otherProjects = filteredAndSortedProjects.filter(p => !p.isFavorite);

  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case 'ACTIVE': return 'bg-emerald-100 text-emerald-600 border-emerald-200';
      case 'ON HOLD': return 'bg-amber-100 text-amber-600 border-amber-200';
      case 'COMPLETED': return 'bg-slate-100 text-slate-600 border-slate-200';
      case 'AT RISK': return 'bg-rose-100 text-rose-600 border-rose-200';
      case 'PLANNING': return 'bg-blue-100 text-blue-600 border-blue-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const getProgressColor = (status: ProjectStatus) => {
    switch (status) {
      case 'ACTIVE': return 'bg-emerald-500';
      case 'ON HOLD': return 'bg-amber-500';
      case 'COMPLETED': return 'bg-blue-600';
      case 'AT RISK': return 'bg-rose-500';
      case 'PLANNING': return 'bg-blue-500';
      default: return 'bg-blue-500';
    }
  };

  return (
    <div className="flex flex-col gap-8 p-6 animate-in fade-in duration-500">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Projects</h1>
          <p className="text-slate-500 mt-1 font-medium">Manage and track your active initiatives</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100/80 p-1 rounded-xl border border-slate-200/50 backdrop-blur-sm">
            <button 
              onClick={() => setViewType('grid')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                viewType === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icons.layoutDashboard size={16} />
              <span>Grid</span>
            </button>
            <button 
              onClick={() => setViewType('list')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                viewType === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icons.listChecks size={16} />
              <span>List</span>
            </button>
          </div>
          
          <button 
            onClick={() => navigate('/workspace/projects/new')}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-200 hover:scale-[1.02] active:scale-95"
          >
            <Icons.plus size={18} />
            Create Project
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-4 bg-white/60 backdrop-blur-md p-4 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex-1 min-w-[240px] relative">
          <Icons.search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by name, code or description..." 
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-700 placeholder:text-slate-400"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-3">
          <select 
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
          >
            <option value="All Statuses">All Statuses</option>
            <option value="Active">Active</option>
            <option value="On Hold">On Hold</option>
            <option value="Completed">Completed</option>
          </select>
          
          <select 
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
          >
            <option value="All Categories">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.name}>{cat.name}</option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <span className="text-[0.75rem] font-bold text-slate-400 uppercase tracking-wider">Sort by:</span>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-50 border border-slate-200 px-3 py-2 text-sm font-bold text-blue-600 outline-none cursor-pointer"
            >
              <option value="updatedAt-desc">Recently Updated</option>
              <option value="updatedAt-asc">Oldest Updated</option>
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
              <option value="code-asc">Project Code</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="flex flex-col gap-10">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-500 font-bold animate-pulse">Loading projects...</p>
          </div>
        ) : (
          <>
            {/* Favorites Row */}
        {favoriteProjects.length > 0 && (
          <section className="flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-400 tracking-[0.2em] uppercase">Favorites</h2>
              <button className="text-sm font-bold text-blue-600 hover:underline">View all</button>
            </div>
            
            <div className={`grid ${viewType === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} gap-6`}>
              {favoriteProjects.map(project => (
                viewType === 'grid' 
                  ? <ProjectCard key={project.id} project={project} onToggleFavorite={toggleFavorite} getStatusColor={getStatusColor} getProgressColor={getProgressColor} activeDropdownProjectId={activeDropdownProjectId} setActiveDropdownProjectId={setActiveDropdownProjectId} setProjects={setProjects} />
                  : <ProjectListItem key={project.id} project={project} onToggleFavorite={toggleFavorite} getStatusColor={getStatusColor} getProgressColor={getProgressColor} activeDropdownProjectId={activeDropdownProjectId} setActiveDropdownProjectId={setActiveDropdownProjectId} setProjects={setProjects} />
              ))}
            </div>
          </section>
        )}

        {/* All Projects Section */}
        <section className="flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-400 tracking-[0.2em] uppercase">All Projects</h2>
          </div>
          
          {filteredAndSortedProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 bg-white/50 backdrop-blur-sm rounded-[2rem] border border-slate-200/50 shadow-sm text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 mb-4 shadow-inner">
                <Icons.folderKanban size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">No projects found</h3>
              <p className="text-sm text-slate-500 max-w-sm mb-6">
                No projects matched your search criteria. Try modifying your filters or search keywords.
              </p>
              <button 
                onClick={() => {
                  setSearchQuery('');
                  setSelectedStatus('All Statuses');
                  setSelectedCategory('All Categories');
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-100 transition-all hover:scale-[1.02] active:scale-95"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className={`grid ${viewType === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} gap-6`}>
              {otherProjects.map(project => (
                viewType === 'grid' 
                  ? <ProjectCard key={project.id} project={project} onToggleFavorite={toggleFavorite} getStatusColor={getStatusColor} getProgressColor={getProgressColor} activeDropdownProjectId={activeDropdownProjectId} setActiveDropdownProjectId={setActiveDropdownProjectId} setProjects={setProjects} />
                  : <ProjectListItem key={project.id} project={project} onToggleFavorite={toggleFavorite} getStatusColor={getStatusColor} getProgressColor={getProgressColor} activeDropdownProjectId={activeDropdownProjectId} setActiveDropdownProjectId={setActiveDropdownProjectId} setProjects={setProjects} />
              ))}
              
              {/* New Project Card (Only in Grid View) */}
              {viewType === 'grid' && (
                <button 
                  onClick={() => navigate('/workspace/projects/new')}
                  className="group flex flex-col items-center justify-center gap-4 min-h-[220px] rounded-[2rem] border-2 border-dashed border-slate-200 hover:border-blue-500 hover:bg-blue-50/30 transition-all duration-300"
                >
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 group-hover:bg-blue-100 flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-colors">
                    <Icons.plus size={28} />
                  </div>
                  <div className="text-center">
                    <h3 className="font-bold text-slate-900">New Project</h3>
                    <p className="text-sm text-slate-500 px-6">Initiate a new workflow and invite your team members.</p>
                  </div>
                </button>
              )}
            </div>
          )}
        </section>
      </>
    )}
  </div>
    </div>
  );
}

interface ProjectViewProps {
  project: Project;
  onToggleFavorite: (id: string) => void;
  getStatusColor: (status: ProjectStatus) => string;
  getProgressColor: (status: ProjectStatus) => string;
  activeDropdownProjectId: string | null;
  setActiveDropdownProjectId: (id: string | null) => void;
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
}

function ProjectCard({ 
  project, 
  onToggleFavorite, 
  getStatusColor, 
  getProgressColor,
  activeDropdownProjectId,
  setActiveDropdownProjectId,
  setProjects
}: ProjectViewProps) {
  const navigate = useNavigate();
  
  // Dynamic metrics populated from MongoDB database state
  const completedTasks = project.completedTasksCount ?? 0;
  const totalTasks = project.totalTasksCount ?? 0;
  const percentage = project.progress ?? 0;
  const sprintName = project.activeSprintName || 'No active sprint';
  const issuesCount = project.openIssuesCount ?? 0;
  const blockedCount = project.blockedTasksCount ?? 0;
  const deadlineDisplay = !project.deadlineDisplay || project.deadlineDisplay === 'Not set' ? 'No active sprint' : project.deadlineDisplay;

  return (
    <div 
      onClick={() => navigate(`/workspace/projects/${project.id}`)}
      className="group bg-white rounded-[2rem] p-6 border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1.5 transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[360px]"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5 shrink-0">
        <span className={`px-3 py-1 rounded-full text-[0.65rem] font-black tracking-widest border ${getStatusColor(project.status)}`}>
          {project.status}
        </span>
        <div className="flex items-center gap-1 relative" onClick={(e) => e.stopPropagation()}>
          <button 
            onClick={() => onToggleFavorite(project.id)}
            className={`p-1.5 rounded-full transition-colors ${project.isFavorite ? 'text-amber-400' : 'text-slate-300 hover:text-slate-400'}`}
          >
            <Icons.star size={20} fill={project.isFavorite ? 'currentColor' : 'none'} />
          </button>
          <button 
            onClick={() => setActiveDropdownProjectId(activeDropdownProjectId === project.id ? null : project.id)}
            className={`p-1.5 rounded-full transition-colors ${activeDropdownProjectId === project.id ? 'text-blue-600 bg-slate-100' : 'text-slate-300 hover:text-slate-600 hover:bg-slate-50'}`}
          >
            <Icons.moreVertical size={20} />
          </button>

          {/* Premium Dynamic Dropdown Menu */}
          {activeDropdownProjectId === project.id && (
            <>
              <div 
                className="fixed inset-0 z-40 cursor-default" 
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveDropdownProjectId(null);
                }} 
              />
              <div className="absolute right-0 top-full mt-1.5 w-52 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-50 text-left animate-in fade-in slide-in-from-top-2 duration-150">
                <button 
                  onClick={() => {
                    onToggleFavorite(project.id);
                    setActiveDropdownProjectId(null);
                  }}
                  className="w-full px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                >
                  <Star size={13} className={project.isFavorite ? 'text-amber-400 fill-amber-400' : 'text-slate-400'} />
                  <span>{project.isFavorite ? 'Remove from starred' : 'Add to starred'}</span>
                </button>

                <button 
                  onClick={() => {
                    setActiveDropdownProjectId(null);
                    alert('Linked teams feature coming soon!');
                  }}
                  className="w-full px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                >
                  <Users size={13} className="text-slate-400" />
                  <span>Linked teams</span>
                </button>

                <button 
                  onClick={() => {
                    setActiveDropdownProjectId(null);
                    navigate(`/workspace/projects/${project.id}`);
                  }}
                  className="w-full px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                >
                  <Settings size={13} className="text-slate-400" />
                  <span>Project settings</span>
                </button>

                <div className="h-px bg-slate-100 my-1" />

                <button 
                  onClick={() => {
                    setActiveDropdownProjectId(null);
                    if (confirm(`Bạn có chắc chắn muốn xóa dự án "${project.name}" không?`)) {
                      alert(`Xóa dự án "${project.name}" thành công!`);
                      setProjects(prev => prev.filter(p => p.id !== project.id));
                    }
                  }}
                  className="w-full px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors"
                >
                  <Trash2 size={13} className="text-rose-500" />
                  <span>Delete project</span>
                </button>

                <div className="h-px bg-slate-100 my-1" />

                <div className="px-3.5 py-1.5 flex items-center gap-2 bg-slate-50/50 rounded-b-xl border-t border-slate-50 shrink-0">
                  <div className="w-[18px] h-[18px] rounded bg-[#2563EB] flex items-center justify-center text-white font-black text-[9px] shrink-0 shadow-sm">
                    K
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[9px] font-bold text-slate-800 leading-tight truncate">
                      {project.category || 'General'} project
                    </span>
                    <span className="text-[8px] font-semibold text-slate-400 leading-none">
                      Team-managed
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Body */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1 mb-0.5">{project.name}</h3>
          <p className="text-[11px] font-bold text-slate-400 mb-4 tracking-tight">{sprintName}</p>
          
          {/* Progress Section */}
          <div className="mb-5">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[0.65rem] font-bold text-slate-400 tracking-wider uppercase">Progress</span>
              <span className="text-xs font-bold text-slate-700">{completedTasks} / {totalTasks} tasks ({percentage}%)</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/10">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ease-out ${getProgressColor(project.status)}`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        </div>
        
        {/* Stats widgets (Issues & Blocked) */}
        <div className="grid grid-cols-2 gap-3 mb-6 shrink-0">
          <div className="flex items-center gap-2 bg-rose-50/50 border border-rose-100/60 rounded-2xl p-2.5">
            <div className="w-6 h-6 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-500 shrink-0">
              <AlertCircle size={13} />
            </div>
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block leading-none mb-0.5">Issues</span>
              <span className="text-xs font-extrabold text-slate-800 leading-none">{issuesCount} Open</span>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-amber-50/50 border border-amber-100/60 rounded-2xl p-2.5">
            <div className="w-6 h-6 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
              <Ban size={13} />
            </div>
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block leading-none mb-0.5">Blocked</span>
              <span className="text-xs font-extrabold text-slate-800 leading-none">{blockedCount} Items</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-100/80 shrink-0">
        <div className="flex items-center -space-x-3">
          {project.members.map((member) => (
            <img 
              key={member.id} 
              src={member.avatar} 
              alt={member.name} 
              className="w-9 h-9 rounded-full border-2 border-white ring-2 ring-slate-50"
              title={member.name}
            />
          ))}
          {project.members.length > 3 && (
            <div className="w-9 h-9 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[0.7rem] font-bold text-slate-500 ring-2 ring-slate-50">
              +{project.members.length - 3}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/50 rounded-xl px-2.5 py-1 text-slate-500 shadow-sm shrink-0">
          <Icons.calendar size={12} className="text-slate-400" />
          <span className="text-[0.75rem] font-bold tracking-tight">{deadlineDisplay}</span>
        </div>
      </div>
    </div>
  );
}

function ProjectListItem({ 
  project, 
  onToggleFavorite, 
  getStatusColor, 
  getProgressColor,
  activeDropdownProjectId,
  setActiveDropdownProjectId,
  setProjects
}: ProjectViewProps) {
  const navigate = useNavigate();
  if (typeof getProgressColor === 'function') {}

  // Dynamic metrics populated from MongoDB database state
  const completedTasks = project.completedTasksCount ?? 0;
  const totalTasks = project.totalTasksCount ?? 0;
  const blockedCount = project.blockedTasksCount ?? 0;
  
  const sprintText = project.activeSprintName || 'No active sprint';
  const hasSprint = sprintText !== 'No active sprint';

  return (
    <div 
      onClick={() => navigate(`/workspace/projects/${project.id}`)}
      className="group bg-white rounded-[1.25rem] p-4 border border-slate-200 hover:border-blue-200 hover:shadow-md hover:shadow-blue-500/5 transition-all duration-200 flex items-center justify-between gap-6 cursor-pointer"
    >
      {/* Left side: Two-line stack (Title on top, Inline Metrics on bottom) */}
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-widest border shrink-0 ${getStatusColor(project.status)}`}>
          {project.status}
        </span>
        <div className="min-w-0 flex flex-col gap-0.5">
          <div className="flex items-baseline gap-2">
            <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
              {project.name}
            </h3>
            <span className="text-[11px] font-bold text-slate-400 shrink-0">
              {project.code}
            </span>
          </div>
          
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-semibold text-slate-500">
            <span className="text-slate-400">{project.category}</span>
            <span className="w-1 h-1 rounded-full bg-slate-300" />
            <span className={hasSprint ? 'text-slate-700' : 'text-slate-400'}>{sprintText}</span>
            <span className="w-1 h-1 rounded-full bg-slate-300" />
            <span className="text-slate-600">{completedTasks}/{totalTasks} Tasks</span>
            <span className="w-1 h-1 rounded-full bg-slate-300" />
            <span className="text-rose-500 font-bold">{blockedCount} Blocked</span>
            <span className="w-1 h-1 rounded-full bg-slate-300" />
            <span className="text-slate-400">{project.deadlineDisplay || 'Not set'}</span>
          </div>
        </div>
      </div>

      {/* Right side: Team Members + Star & Actions */}
      <div className="flex items-center gap-4 shrink-0" onClick={(e) => e.stopPropagation()}>
        {/* Team Members */}
        <div className="flex items-center -space-x-2">
          {project.members.slice(0, 3).map(member => (
            <img 
              key={member.id} 
              src={member.avatar} 
              alt={member.name} 
              className="w-7.5 h-7.5 rounded-full border-2 border-white ring-1 ring-slate-100 shadow-sm"
              title={member.name} 
            />
          ))}
          {project.members.length > 3 && (
            <div className="w-7.5 h-7.5 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[8px] font-bold text-slate-500 shadow-sm ring-1 ring-slate-100">
              +{project.members.length - 3}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-slate-200 hidden sm:block" />

        {/* Star & Options */}
        <div className="flex items-center gap-0.5 relative">
          <button 
            onClick={() => onToggleFavorite(project.id)}
            className={`p-1.5 rounded-full transition-colors ${project.isFavorite ? 'text-amber-400' : 'text-slate-300 hover:text-slate-400'}`}
          >
            <Icons.star size={16} fill={project.isFavorite ? 'currentColor' : 'none'} />
          </button>
          <button 
            onClick={() => setActiveDropdownProjectId(activeDropdownProjectId === project.id ? null : project.id)}
            className={`p-1.5 rounded-full transition-colors ${activeDropdownProjectId === project.id ? 'text-blue-600 bg-slate-100' : 'text-slate-300 hover:text-slate-600 hover:bg-slate-50'}`}
          >
            <Icons.moreVertical size={16} />
          </button>

          {/* Premium Dynamic Dropdown Menu */}
          {activeDropdownProjectId === project.id && (
            <>
              <div 
                className="fixed inset-0 z-40 cursor-default" 
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveDropdownProjectId(null);
                }} 
              />
              <div className="absolute right-0 top-full mt-1.5 w-52 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-50 text-left animate-in fade-in slide-in-from-top-2 duration-150">
                <button 
                  onClick={() => {
                    onToggleFavorite(project.id);
                    setActiveDropdownProjectId(null);
                  }}
                  className="w-full px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                >
                  <Star size={13} className={project.isFavorite ? 'text-amber-400 fill-amber-400' : 'text-slate-400'} />
                  <span>{project.isFavorite ? 'Remove from starred' : 'Add to starred'}</span>
                </button>

                <button 
                  onClick={() => {
                    setActiveDropdownProjectId(null);
                    alert('Linked teams feature coming soon!');
                  }}
                  className="w-full px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                >
                  <Users size={13} className="text-slate-400" />
                  <span>Linked teams</span>
                </button>

                <button 
                  onClick={() => {
                    setActiveDropdownProjectId(null);
                    navigate(`/workspace/projects/${project.id}`);
                  }}
                  className="w-full px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                >
                  <Settings size={13} className="text-slate-400" />
                  <span>Project settings</span>
                </button>

                <div className="h-px bg-slate-100 my-1" />

                <button 
                  onClick={() => {
                    setActiveDropdownProjectId(null);
                    if (confirm(`Bạn có chắc chắn muốn xóa dự án "${project.name}" không?`)) {
                      alert(`Xóa dự án "${project.name}" thành công!`);
                      setProjects(prev => prev.filter(p => p.id !== project.id));
                    }
                  }}
                  className="w-full px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors"
                >
                  <Trash2 size={13} className="text-rose-500" />
                  <span>Delete project</span>
                </button>

                <div className="h-px bg-slate-100 my-1" />

                <div className="px-3.5 py-1.5 flex items-center gap-2 bg-slate-50/50 rounded-b-xl border-t border-slate-50 shrink-0">
                  <div className="w-[18px] h-[18px] rounded bg-[#2563EB] flex items-center justify-center text-white font-black text-[9px] shrink-0 shadow-sm">
                    K
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[9px] font-bold text-slate-800 leading-tight truncate">
                      {project.category || 'General'} project
                    </span>
                    <span className="text-[8px] font-semibold text-slate-400 leading-none">
                      Team-managed
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
