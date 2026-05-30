import React, { useState, useEffect } from 'react';
import { Icons } from '../../assets/icons';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import defaultMan from '../../assets/avatar_def_man.png';
import type { Project, ProjectStatus } from '../../types/project.interface';
import type { Category } from '../../types/category.interface';
import { useAppDispatch } from '../../store/hooks';
import { useProjects } from '../../hooks/api/useProjects';
import { useCategories } from '../../hooks/api/useCategories';
import { Skeleton } from '../../components/ui/Skeleton';
import { projectService } from '../../services/project.service';

export default function Projects() {
  const navigate = useNavigate();
  const [viewType, setViewType] = useState<'grid' | 'list'>('grid');
  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeDropdownProjectId, setActiveDropdownProjectId] = useState<string | null>(null);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [editFormData, setEditFormData] = useState({ name: '', description: '', categoryId: '' });
  const [isUpdating, setIsUpdating] = useState(false);
  const [deletingProject, setDeletingProject] = useState<any>(null);
  const [deleteInput, setDeleteInput] = useState('');

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All Statuses');
  const [selectedCategory, setSelectedCategory] = useState<string>('All Categories');
  const [sortBy, setSortBy] = useState<string>('updatedAt-desc');

  const user = useSelector((state: any) => state.auth.user);

  const { data: backendProjects, isLoading: isProjectsLoading, refetch: refetchProjects } = useProjects();
  const { data: backendCategories = [], isLoading: isCategoriesLoading } = useCategories();

  // Global click listener to close dropdowns
  useEffect(() => {
    const handleClickOutside = () => {
      setActiveDropdownProjectId(null);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    setCategories(backendCategories);
    if (backendProjects) {
      // Map backend projects to frontend Project interface
      const mappedProjects: Project[] = backendProjects.map((p: any) => ({
        id: p.id,
        name: p.name,
        code: p.code,
        description: p.description,
        categoryId: p.categoryId,
        category: backendCategories.find(c => c.id === p.categoryId)?.name || 'General',
        status: 'ACTIVE', // Default status as backend doesn't have it yet in root
        methodology: (p.methodology as 'SCRUM' | 'KANBAN') || 'KANBAN',
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

  const isLoading = isProjectsLoading || isCategoriesLoading;

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

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;
    try {
      setIsUpdating(true);
      await projectService.updateProjectInfo(editingProject.id, editFormData);
      refetchProjects(); // reload
      setEditingProject(null);
    } catch (err) {
      console.error(err);
      alert('Failed to update project info');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deletingProject) return;
    if (deleteInput !== `delete ${deletingProject.code}`) {
      alert(`Vui lòng nhập đúng "delete ${deletingProject.code}" để xác nhận.`);
      return;
    }
    
    try {
      setIsUpdating(true);
      await projectService.deleteProject(deletingProject.id);
      refetchProjects();
      setDeletingProject(null);
      setDeleteInput('');
    } catch (err) {
      console.error(err);
      alert('Failed to delete project');
    } finally {
      setIsUpdating(false);
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
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 ${viewType === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              <Icons.layoutDashboard size={16} />
              <span>Grid</span>
            </button>
            <button
              onClick={() => setViewType('list')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 ${viewType === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
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
          <>
            {/* Skeleton section header */}
            <div className="flex flex-col gap-5">
              <Skeleton className="h-3 w-20 bg-slate-200" />
              <div className={`grid ${viewType === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} gap-6`}>
                {Array.from({ length: 6 }).map((_, i) =>
                  viewType === 'grid' ? (
                    <div key={i} className="bg-white rounded-2xl p-5 border border-slate-200/80 flex flex-col gap-4 h-full min-h-[300px]">
                      {/* Badge row */}
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-5 w-16 rounded-full bg-slate-100" />
                        <Skeleton className="w-7 h-7 rounded-lg bg-slate-100" />
                      </div>
                      {/* Title + description */}
                      <div className="flex flex-col gap-2 flex-1">
                        <Skeleton className="h-5 w-3/4 bg-slate-200" />
                        <Skeleton className="h-3 w-full bg-slate-100" />
                        <Skeleton className="h-3 w-5/6 bg-slate-100" />
                      </div>
                      {/* Progress */}
                      <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between">
                          <Skeleton className="h-3 w-16 bg-slate-100" />
                          <Skeleton className="h-3 w-8 bg-slate-100" />
                        </div>
                        <Skeleton className="h-[5px] w-full rounded-full bg-slate-100" />
                      </div>
                      {/* Stat chips */}
                      <div className="grid grid-cols-2 gap-2">
                        <Skeleton className="h-12 rounded-xl bg-slate-100" />
                        <Skeleton className="h-12 rounded-xl bg-slate-100" />
                      </div>
                      {/* Footer */}
                      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                        <div className="flex -space-x-2">
                          {[0,1,2].map(j => <Skeleton key={j} className="w-7 h-7 rounded-full bg-slate-200 border-2 border-white" />)}
                        </div>
                        <Skeleton className="h-3 w-16 bg-slate-100" />
                      </div>
                    </div>
                  ) : (
                    <div key={i} className="bg-white rounded-2xl px-6 py-4 border border-slate-100 flex items-center justify-between gap-8">
                      <Skeleton className="h-10 w-20 rounded-xl bg-slate-100" />
                      <div className="flex flex-col flex-1 gap-2">
                        <Skeleton className="h-4 w-48 bg-slate-200" />
                        <Skeleton className="h-3 w-32 bg-slate-100" />
                      </div>
                      <Skeleton className="h-10 w-20 bg-slate-100" />
                      <Skeleton className="h-10 w-36 bg-slate-100" />
                      <Skeleton className="h-10 w-24 bg-slate-100" />
                      <div className="flex -space-x-2">
                        {[0,1].map(j => <Skeleton key={j} className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white" />)}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          </>
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
                      ? <ProjectCard key={project.id} project={project} onToggleFavorite={toggleFavorite} getStatusColor={getStatusColor} getProgressColor={getProgressColor} activeDropdownProjectId={activeDropdownProjectId} setActiveDropdownProjectId={setActiveDropdownProjectId} setProjects={setProjects} setEditingProject={(p) => { setEditingProject(p); setEditFormData({ name: p.name, description: p.description || '', categoryId: (p as any).categoryId || '' }); }} setDeletingProject={(p) => { setDeletingProject(p); setDeleteInput(''); }} />
                      : <ProjectListItem key={project.id} project={project} onToggleFavorite={toggleFavorite} getStatusColor={getStatusColor} getProgressColor={getProgressColor} activeDropdownProjectId={activeDropdownProjectId} setActiveDropdownProjectId={setActiveDropdownProjectId} setProjects={setProjects} setEditingProject={(p) => { setEditingProject(p); setEditFormData({ name: p.name, description: p.description || '', categoryId: (p as any).categoryId || '' }); }} setDeletingProject={(p) => { setDeletingProject(p); setDeleteInput(''); }} />
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
                      ? <ProjectCard key={project.id} project={project} onToggleFavorite={toggleFavorite} getStatusColor={getStatusColor} getProgressColor={getProgressColor} activeDropdownProjectId={activeDropdownProjectId} setActiveDropdownProjectId={setActiveDropdownProjectId} setProjects={setProjects} setEditingProject={(p) => { setEditingProject(p); setEditFormData({ name: p.name, description: p.description || '', categoryId: (p as any).categoryId || '' }); }} setDeletingProject={(p) => { setDeletingProject(p); setDeleteInput(''); }} />
                      : <ProjectListItem key={project.id} project={project} onToggleFavorite={toggleFavorite} getStatusColor={getStatusColor} getProgressColor={getProgressColor} activeDropdownProjectId={activeDropdownProjectId} setActiveDropdownProjectId={setActiveDropdownProjectId} setProjects={setProjects} setEditingProject={(p) => { setEditingProject(p); setEditFormData({ name: p.name, description: p.description || '', categoryId: (p as any).categoryId || '' }); }} setDeletingProject={(p) => { setDeletingProject(p); setDeleteInput(''); }} />
                  ))}

                  {/* New Project Card (Only in Grid View) */}
                  {viewType === 'grid' && (
                    <button
                      onClick={() => navigate('/workspace/projects/new')}
                      className="group flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-slate-300 hover:border-slate-400 hover:bg-slate-50 transition-all duration-200 h-full min-h-[300px]"
                    >
                      <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 group-hover:scale-105 transition-transform duration-200">
                        <Icons.plus size={24} strokeWidth={2.5} />
                      </div>
                      <h3 className="font-medium text-slate-600 group-hover:text-slate-800 text-lg">New Project</h3>
                    </button>
                  )}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      {/* Edit Project Modal */}
      {editingProject && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 border border-slate-100 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Edit Project</h3>
            <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700">Project Name</label>
                <input required type="text" className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  value={editFormData.name} onChange={e => setEditFormData({ ...editFormData, name: e.target.value })} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700">Category</label>
                <select required className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  value={editFormData.categoryId} onChange={e => setEditFormData({ ...editFormData, categoryId: e.target.value })}>
                  <option value="" disabled>Select category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700">Description</label>
                <textarea className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none" rows={3}
                  value={editFormData.description} onChange={e => setEditFormData({ ...editFormData, description: e.target.value })} />
              </div>
              <div className="flex items-center justify-end gap-3 mt-4">
                <button type="button" onClick={() => setEditingProject(null)} className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
                <button type="submit" disabled={isUpdating} className="px-4 py-2 text-sm font-bold bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors">
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Project Modal */}
      {deletingProject && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4 text-rose-600">
              <Icons.alertCircle size={24} />
              <h3 className="text-xl font-bold text-slate-900">Delete Project</h3>
            </div>
            <p className="text-sm text-slate-600 mb-6">
              Bạn sắp xóa dự án <strong>{deletingProject.name}</strong>. Hành động này không thể hoàn tác. Để xác nhận, vui lòng nhập <code className="bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded border border-rose-100 font-bold">delete {deletingProject.code}</code> vào ô bên dưới.
            </p>
            <form onSubmit={handleDeleteSubmit} className="flex flex-col gap-4">
              <input required type="text" className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                placeholder={`delete ${deletingProject.code}`} value={deleteInput} onChange={e => setDeleteInput(e.target.value)} />
              <div className="flex items-center justify-end gap-3 mt-2">
                <button type="button" onClick={() => { setDeletingProject(null); setDeleteInput(''); }} className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
                <button type="submit" disabled={deleteInput !== `delete ${deletingProject.code}`} className="px-4 py-2 text-sm font-bold bg-rose-600 text-white rounded-xl hover:bg-rose-700 disabled:opacity-50 transition-colors">
                  Confirm Delete
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
  setEditingProject: (project: Project) => void;
  setDeletingProject: (project: Project) => void;
}

function ProjectCard({
  project,
  onToggleFavorite,
  getStatusColor,
  getProgressColor,
  activeDropdownProjectId,
  setActiveDropdownProjectId,
  setProjects,
  setEditingProject,
  setDeletingProject
}: ProjectViewProps) {
  const navigate = useNavigate();

  const totalTasks = project.totalTasksCount ?? 0;
  const completedTasks = project.completedTasksCount ?? 0;
  const percentage = project.progress ?? 0;
  const sprintName = project.activeSprintName && project.activeSprintName !== 'No active sprint'
    ? project.activeSprintName : 'Sprint';
  const issuesCount = project.openIssuesCount ?? 0;
  const blockedCount = project.blockedTasksCount ?? 0;
  const deadlineDisplay = !project.deadlineDisplay || project.deadlineDisplay === 'Not set'
    ? 'Not set' : project.deadlineDisplay;
  const isScrum = project.methodology === 'SCRUM';

  return (
    <div
      onClick={() => navigate(`/workspace/projects/${project.id}`)}
      className="group bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-lg hover:shadow-slate-200/60 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col gap-4 h-full"
    >
      {/* Row 1 — Methodology badge + ··· */}
      <div className="flex items-center justify-between">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${isScrum ? 'bg-violet-50 text-violet-600 border-violet-200' : 'bg-teal-50 text-teal-600 border-teal-200'
          }`}>
          {isScrum
            ? <Icons.zap size={11} className="text-violet-500" />
            : <Icons.kanbanSquare size={11} className="text-teal-500" />}
          {isScrum ? 'Scrum' : 'Kanban'}
        </span>

        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setActiveDropdownProjectId(activeDropdownProjectId === project.id ? null : project.id)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <Icons.moreHorizontal size={16} />
          </button>
          {activeDropdownProjectId === project.id && (
            <>
              <div className="absolute right-0 top-full mt-1.5 w-52 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <button onClick={() => { onToggleFavorite(project.id); setActiveDropdownProjectId(null); }}
                  className="w-full px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors">
                  <Icons.star size={13} className={project.isFavorite ? 'text-amber-400' : 'text-slate-400'} fill={project.isFavorite ? 'currentColor' : 'none'} />
                  <span>{project.isFavorite ? 'Remove from starred' : 'Add to starred'}</span>
                </button>
                <button onClick={() => { setActiveDropdownProjectId(null); setEditingProject(project); }}
                  className="w-full px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors">
                  <Icons.settings size={13} className="text-slate-400" />
                  <span>Edit project</span>
                </button>
                <div className="h-px bg-slate-100 my-1" />
                <button onClick={() => {
                  setActiveDropdownProjectId(null);
                  setDeletingProject(project);
                }}
                  className="w-full px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors">
                  <Icons.alertCircle size={13} className="text-rose-500" />
                  <span>Delete project</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Row 2 — Title + description */}
      <div className="flex-1">
        <h3 className="text-[17px] font-bold text-slate-900 group-hover:text-slate-700 transition-colors line-clamp-1 leading-snug">
          {project.name}
        </h3>
        <p className="text-[12.5px] text-slate-500 font-normal mt-0.5 line-clamp-2 leading-relaxed">
          {project.description || 'No description provided.'}
        </p>
      </div>

      {/* Row 3 — Progress bar */}
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.12em]">
            {isScrum ? sprintName : 'Active Board'}
          </span>
          <span className="text-[11px] font-bold text-slate-600">{percentage}%</span>
        </div>
        <div className="h-[5px] bg-slate-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-700 ${getProgressColor(project.status)}`} style={{ width: `${percentage}%` }} />
        </div>
      </div>

      {/* Row 4 — Stat chips */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/70 rounded-xl px-3 py-2">
          <Icons.listChecks size={13} className="text-slate-400 shrink-0" />
          <div>
            <p className="text-[11px] font-bold text-slate-700 leading-none">{totalTasks} Total</p>
            <p className="text-[10px] text-slate-400 leading-none mt-0.5">Tasks</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
          <Icons.checkCircle2 size={13} className="text-emerald-500 shrink-0" />
          <div>
            <p className="text-[11px] font-bold text-emerald-600 leading-none">{completedTasks} Done</p>
            <p className="text-[10px] text-emerald-400 leading-none mt-0.5">Tasks</p>
          </div>
        </div>
      </div>

      {/* Row 5 — Footer: avatars + deadline / CONTINUOUS DELIVERY */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-auto">
        <div className="flex items-center -space-x-2">
          {project.members.slice(0, 3).map((member) => (
            <img key={member.id} src={member.avatar} alt={member.name}
              className="w-7 h-7 rounded-full border-2 border-white object-cover" title={member.name} />
          ))}
          {project.members.length > 3 && (
            <div className="w-7 h-7 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[9px] font-bold text-slate-500">
              +{project.members.length - 3}
            </div>
          )}
        </div>
        {isScrum && (
          <div className="flex items-center gap-1 text-slate-500">
            <Icons.clock size={12} className="text-slate-400" />
            <span className="text-[11px] font-semibold">{deadlineDisplay}</span>
          </div>
        )}
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
  setProjects,
  setEditingProject,
  setDeletingProject
}: ProjectViewProps) {
  const navigate = useNavigate();
  if (typeof getProgressColor === 'function') { }

  // Dynamic metrics
  const completedTasks = project.completedTasksCount ?? 0;
  const totalTasks = project.totalTasksCount ?? 0;
  const blockedCount = project.blockedTasksCount ?? 0;
  const percentage = project.progress ?? 0;
  const issuesCount = project.openIssuesCount ?? 0;

  const sprintName = project.activeSprintName && project.activeSprintName !== 'No active sprint'
    ? project.activeSprintName : 'Sprint';
  const isScrum = project.methodology === 'SCRUM';

  // Custom format for deadline
  let deadlineDisplay = project.deadlineDisplay;
  if (!deadlineDisplay || deadlineDisplay === 'Not set') {
    deadlineDisplay = isScrum ? 'Not set' : 'Continuous';
  } else if (deadlineDisplay.includes('Ends in')) {
    deadlineDisplay = deadlineDisplay;
  } else {
    deadlineDisplay = deadlineDisplay;
  }

  return (
    <div
      onClick={() => navigate(`/workspace/projects/${project.id}`)}
      className="group bg-white rounded-2xl px-6 py-4 border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all duration-200 flex items-center justify-between gap-8 cursor-pointer"
    >
      {/* 1. Badges */}
      <div className="flex flex-col items-start gap-2 shrink-0 w-[80px]">
        <span className="px-2.5 py-1 rounded-full text-[9px] font-black tracking-widest bg-emerald-50 text-emerald-600">
          {project.status.toUpperCase()}
        </span>
        <span className={`px-2.5 py-1 rounded-full text-[9px] font-black tracking-widest ${isScrum
          ? 'bg-indigo-50 text-indigo-500'
          : 'bg-teal-50 text-teal-500'
          }`}>
          {isScrum ? 'SCRUM' : 'KANBAN'}
        </span>
      </div>

      {/* 2. Main Info (Title, Code, Category, Sprint) */}
      <div className="flex flex-col flex-1 min-w-[200px]">
        <div className="flex items-baseline gap-2 mb-1">
          <h3 className="text-base font-bold text-slate-800 group-hover:text-blue-600 transition-colors truncate">
            {project.name}
          </h3>
          <span className="text-[11px] font-bold text-slate-400">
            {project.code}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[12px] font-medium text-slate-400">
          <span className="truncate">{project.category || 'Software Development'}</span>
          <span className="w-1 h-1 rounded-full bg-slate-300" />
          <span className={isScrum ? 'text-slate-600' : ''}>
            {isScrum ? sprintName : 'Active Board'}
          </span>
        </div>
      </div>

      {/* 3. Task Stats (Vertical text) */}
      <div className="flex flex-col justify-center items-start shrink-0 w-[80px] border-l border-slate-100 pl-6 h-10">
        <span className="text-[13px] font-bold text-slate-700 leading-tight">{totalTasks} Total</span>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Tasks</span>
      </div>

      {/* 4. Progress / Blocked */}
      <div className="flex flex-col shrink-0 w-[140px] pl-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-bold text-emerald-500">{completedTasks} Done</span>
          <span className="text-[10px] font-bold text-slate-400">{percentage}%</span>
        </div>
        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${isScrum ? 'bg-slate-800' : 'bg-teal-500'}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* 5. Clock & Deadline */}
      <div className="flex items-center gap-2 shrink-0 w-[120px] pl-6 text-slate-500">
        <Icons.clock size={14} className="text-slate-400 shrink-0" />
        <span className="text-[12px] font-medium leading-tight">
          {deadlineDisplay.includes('Ends in') ? (
            <>
              Ends in <br /> {deadlineDisplay.split('Ends in ')[1]}
            </>
          ) : deadlineDisplay.includes('Starts in') ? (
            <>
              Starts in <br /> {deadlineDisplay.split('Starts in ')[1]}
            </>
          ) : (
            deadlineDisplay
          )}
        </span>
      </div>

      {/* 6. Avatars */}
      <div className="flex items-center -space-x-2 shrink-0 w-[80px]">
        {project.members.slice(0, 2).map(member => (
          <img
            key={member.id}
            src={member.avatar}
            alt={member.name}
            className="w-8 h-8 rounded-full border-2 border-white object-cover shadow-sm"
            title={member.name}
          />
        ))}
        {project.members.length > 2 && (
          <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[9px] font-bold text-slate-500 shadow-sm">
            +{project.members.length - 2}
          </div>
        )}
      </div>

      {/* 7. Actions */}
      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => onToggleFavorite(project.id)}
          className={`p-2 rounded-xl transition-colors ${project.isFavorite ? 'text-amber-400' : 'text-slate-300 hover:text-slate-400 hover:bg-slate-50'}`}
        >
          <Icons.star size={18} fill={project.isFavorite ? 'currentColor' : 'none'} />
        </button>
        <div className="relative">
          <button
            onClick={() => setActiveDropdownProjectId(activeDropdownProjectId === project.id ? null : project.id)}
            className={`p-2 rounded-xl transition-colors ${activeDropdownProjectId === project.id ? 'text-blue-600 bg-slate-100' : 'text-slate-300 hover:text-slate-600 hover:bg-slate-50'}`}
          >
            <Icons.moreVertical size={18} />
          </button>

          {activeDropdownProjectId === project.id && (
            <>
              <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-50 text-left animate-in fade-in slide-in-from-top-2 duration-150">
                <button onClick={() => { onToggleFavorite(project.id); setActiveDropdownProjectId(null); }}
                  className="w-full px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5">
                  <Icons.star size={13} className={project.isFavorite ? 'text-amber-400' : 'text-slate-400'} fill={project.isFavorite ? 'currentColor' : 'none'} />
                  <span>{project.isFavorite ? 'Remove from starred' : 'Add to starred'}</span>
                </button>
                <button onClick={() => { setActiveDropdownProjectId(null); setEditingProject(project); }}
                  className="w-full px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5">
                  <Icons.settings size={13} className="text-slate-400" />
                  <span>Edit project</span>
                </button>
                <div className="h-px bg-slate-100 my-1" />
                <button onClick={() => {
                  setActiveDropdownProjectId(null);
                  setDeletingProject(project);
                }}
                  className="w-full px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5">
                  <Icons.alertCircle size={13} className="text-rose-500" />
                  <span>Delete project</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
