import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { useLanguage } from '../../contexts/LanguageContext';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { BaseDataTable } from '@/components/ui/BaseDataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import type { ColumnDef } from '@tanstack/react-table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/DropdownMenu";

const editProjectSchema = z.object({
  name: z.string().min(1, 'Tên dự án không được để trống'),
  categoryId: z.string().min(1, 'Category không được để trống'),
  description: z.string().optional()
});

type EditProjectFormValues = z.infer<typeof editProjectSchema>;

export default function Projects() {
  const navigate = useNavigate();
  const [viewType, setViewType] = useState<'grid' | 'list'>('grid');
  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeDropdownProjectId, setActiveDropdownProjectId] = useState<string | null>(null);
  const [editingProject, setEditingProject] = useState<any>(null);
  
  const { register: registerEdit, handleSubmit: handleEditSubmitWrapper, reset: resetEditForm, formState: { errors: editErrors } } = useForm<EditProjectFormValues>({
    resolver: zodResolver(editProjectSchema),
    defaultValues: { name: '', description: '', categoryId: '' }
  });
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [deletingProject, setDeletingProject] = useState<any>(null);
  const [deleteInput, setDeleteInput] = useState('');

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All Statuses');
  const [selectedCategory, setSelectedCategory] = useState<string>('All Categories');
  const [sortBy, setSortBy] = useState<string>('updatedAt-desc');

  const user = useSelector((state: any) => state.auth.user);
  const { t } = useLanguage();

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
      case 'COMPLETED': return 'bg-muted text-muted-foreground border-border';
      case 'AT RISK': return 'bg-rose-100 text-rose-600 border-rose-200';
      case 'PLANNING': return 'bg-primary/20 text-primary border-primary/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getStatusText = (status: ProjectStatus, t: any) => {
    switch (status) {
      case 'ACTIVE': return t('projects.status_active') || 'ACTIVE';
      case 'ON HOLD': return t('projects.status_onhold') || 'ON HOLD';
      case 'COMPLETED': return t('projects.status_completed') || 'COMPLETED';
      case 'AT RISK': return t('projects.status_atrisk') || 'AT RISK';
      case 'PLANNING': return t('projects.status_planning') || 'PLANNING';
      default: return status;
    }
  };

  const getProgressColor = (status: ProjectStatus) => {
    switch (status) {
      case 'ACTIVE': return 'bg-emerald-500';
      case 'ON HOLD': return 'bg-amber-500';
      case 'COMPLETED': return 'bg-primary';
      case 'AT RISK': return 'bg-rose-500';
      case 'PLANNING': return 'bg-primary';
      default: return 'bg-primary';
    }
  };

  const onEditSubmit = async (data: EditProjectFormValues) => {
    if (!editingProject) return;
    try {
      setIsUpdating(true);
      await projectService.updateProjectInfo(editingProject.id, data as any);
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

  const columns = React.useMemo<ColumnDef<Project>[]>(() => [
    {
      accessorKey: "name",
      header: t('projects.project_name'),
      cell: ({ row }) => {
        const p = row.original;
        return (
          <div className="flex flex-col min-w-[200px] cursor-pointer" onClick={() => navigate(`/workspace/projects/${p.id}`)}>
             <div className="flex items-baseline gap-2 mb-1">
               <span className="font-bold text-foreground hover:text-primary transition-colors truncate">{p.name}</span>
               <span className="text-[11px] font-bold text-muted-foreground">{p.code}</span>
             </div>
             <div className="flex items-center gap-2 text-[12px] font-medium text-muted-foreground">
               <span className="truncate">{p.category || 'Software Development'}</span>
             </div>
          </div>
        )
      }
    },
    {
      accessorKey: "status",
      header: t('projects.status') || "Trạng thái",
      cell: ({ row }) => {
        const p = row.original;
        return (
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${getStatusColor(p.status)}`}>
             {getStatusText(p.status, t)}
          </span>
        )
      }
    },
    {
      id: "tasks",
      header: t('projects.tasks'),
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-[13px] font-bold text-foreground leading-tight">{row.original.totalTasksCount || 0}</span>
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{t('projects.total_tasks') || 'Tasks'}</span>
        </div>
      )
    },
    {
      id: "progress",
      header: t('projects.progress') || "Tiến độ",
      cell: ({ row }) => {
        const p = row.original;
        const pct = p.progress || 0;
        return (
          <div className="flex flex-col w-[120px]">
            <div className="flex justify-between mb-1">
               <span className="text-[11px] font-bold text-emerald-500">{p.completedTasksCount || 0} {t('projects.done')}</span>
               <span className="text-[10px] font-bold text-muted-foreground">{pct}%</span>
            </div>
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
               <div className={`h-full rounded-full transition-all bg-emerald-500`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        )
      }
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const p = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex shrink-0 items-center justify-center rounded-lg hover:bg-muted hover:text-foreground transition-colors size-8 outline-none">
              <Icons.moreVertical size={16} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
               <DropdownMenuItem onClick={() => toggleFavorite(p.id)} className="cursor-pointer">
                 <Icons.star size={14} className="mr-2" /> {p.isFavorite ? t('projects.remove_starred') || 'Bỏ yêu thích' : t('projects.add_starred') || 'Yêu thích'}
               </DropdownMenuItem>
               <DropdownMenuItem onClick={() => { setEditingProject(p); resetEditForm({ name: p.name, description: p.description || '', categoryId: (p as any).categoryId || '' }); }} className="cursor-pointer">
                 <Icons.settings size={14} className="mr-2" /> {t('common.edit') || 'Sửa'}
               </DropdownMenuItem>
               <DropdownMenuSeparator />
               <DropdownMenuItem onClick={() => { setDeletingProject(p); setDeleteInput(''); }} className="text-destructive focus:bg-destructive focus:text-destructive-foreground cursor-pointer">
                 <Icons.trash2 size={14} className="mr-2" /> {t('common.delete') || 'Xóa'}
               </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      }
    }
  ], [navigate, setDeletingProject, setEditingProject, resetEditForm, t, toggleFavorite]);

  return (
    <div className="flex flex-col gap-8 p-6 animate-in fade-in duration-500">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">{t('projects.title')}</h1>
          <p className="text-muted-foreground mt-1 font-medium">{t('projects.desc')}</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-muted/80 p-1 rounded-xl border border-border/50 backdrop-blur-sm">
            <Button
              variant={viewType === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewType('grid')}
              className={`gap-2 rounded-lg ${viewType === 'grid' ? 'shadow-sm' : 'text-muted-foreground'}`}
            >
              <Icons.layoutDashboard size={16} />
              <span>{t('projects.view_grid')}</span>
            </Button>
            <Button
              variant={viewType === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewType('list')}
              className={`gap-2 rounded-lg ${viewType === 'list' ? 'shadow-sm' : 'text-muted-foreground'}`}
            >
              <Icons.listChecks size={16} />
              <span>{t('projects.view_list')}</span>
            </Button>
          </div>

          <Button
            variant="kisafres"
            onClick={() => navigate('/workspace/projects/new')}
            className="gap-2"
          >
            <Icons.plus size={18} />
            {t('projects.create_project')}
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-4 bg-card/60 backdrop-blur-md p-4 rounded-2xl border border-border/80 shadow-sm">
        <div className="flex-1 min-w-[240px] relative">
          <Icons.search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            type="text"
            placeholder={t('projects.search_placeholder')}
            className="w-full pl-10 pr-4 py-5"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-background border border-border px-3 py-2.5 rounded-xl text-sm font-bold text-foreground outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
          >
            <option value="All Statuses">{t('projects.all_statuses')}</option>
            <option value="Active">{t('projects.status_active')}</option>
            <option value="On Hold">{t('projects.status_onhold')}</option>
            <option value="Completed">{t('projects.status_completed')}</option>
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-background border border-border px-3 py-2.5 rounded-xl text-sm font-bold text-foreground outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
          >
            <option value="All Categories">{t('projects.all_categories')}</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.name}>{cat.name}</option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <span className="text-[0.75rem] font-bold text-muted-foreground uppercase tracking-wider">{t('projects.sort_by')}</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-background border border-border px-3 py-2 text-sm font-bold text-primary outline-none cursor-pointer"
            >
              <option value="updatedAt-desc">{t('projects.sort_updated_desc')}</option>
              <option value="updatedAt-asc">{t('projects.sort_updated_asc')}</option>
              <option value="name-asc">{t('projects.sort_name_asc')}</option>
              <option value="name-desc">{t('projects.sort_name_desc')}</option>
              <option value="code-asc">{t('projects.sort_code_asc')}</option>
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
                    <div key={i} className="bg-card rounded-2xl p-5 border border-border/80 flex flex-col gap-4 h-full min-h-[300px]">
                      {/* Badge row */}
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-5 w-16 rounded-full bg-muted" />
                        <Skeleton className="w-7 h-7 rounded-lg bg-muted" />
                      </div>
                      {/* Title + description */}
                      <div className="flex flex-col gap-2 flex-1">
                        <Skeleton className="h-5 w-3/4 bg-slate-200" />
                        <Skeleton className="h-3 w-full bg-muted" />
                        <Skeleton className="h-3 w-5/6 bg-muted" />
                      </div>
                      {/* Progress */}
                      <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between">
                          <Skeleton className="h-3 w-16 bg-muted" />
                          <Skeleton className="h-3 w-8 bg-muted" />
                        </div>
                        <Skeleton className="h-[5px] w-full rounded-full bg-muted" />
                      </div>
                      {/* Stat chips */}
                      <div className="grid grid-cols-2 gap-2">
                        <Skeleton className="h-12 rounded-xl bg-muted" />
                        <Skeleton className="h-12 rounded-xl bg-muted" />
                      </div>
                      {/* Footer */}
                      <div className="flex items-center justify-between pt-3 border-t border-border">
                        <div className="flex -space-x-2">
                          {[0,1,2].map(j => <Skeleton key={j} className="w-7 h-7 rounded-full bg-slate-200 border-2 border-white" />)}
                        </div>
                        <Skeleton className="h-3 w-16 bg-muted" />
                      </div>
                    </div>
                  ) : (
                    <div key={i} className="bg-card rounded-2xl px-6 py-4 border border-border flex items-center justify-between gap-8">
                      <Skeleton className="h-10 w-20 rounded-xl bg-muted" />
                      <div className="flex flex-col flex-1 gap-2">
                        <Skeleton className="h-4 w-48 bg-slate-200" />
                        <Skeleton className="h-3 w-32 bg-muted" />
                      </div>
                      <Skeleton className="h-10 w-20 bg-muted" />
                      <Skeleton className="h-10 w-36 bg-muted" />
                      <Skeleton className="h-10 w-24 bg-muted" />
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
                  <h2 className="text-sm font-bold text-muted-foreground tracking-[0.2em] uppercase">{t('projects.favorites')}</h2>
                  <button className="text-sm font-bold text-primary hover:underline">{t('projects.view_all')}</button>
                </div>

                {viewType === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {favoriteProjects.map(project => (
                      <ProjectCard key={project.id} project={project} onToggleFavorite={toggleFavorite} getStatusColor={getStatusColor} getProgressColor={getProgressColor} activeDropdownProjectId={activeDropdownProjectId} setActiveDropdownProjectId={setActiveDropdownProjectId} setProjects={setProjects} setEditingProject={(p) => { setEditingProject(p); resetEditForm({ name: p.name, description: p.description || '', categoryId: (p as any).categoryId || '' }); }} setDeletingProject={(p) => { setDeletingProject(p); setDeleteInput(''); }} t={t} />
                    ))}
                  </div>
                ) : (
                  <BaseDataTable columns={columns} data={favoriteProjects} />
                )}
              </section>
            )}

            {/* All Projects Section */}
            <section className="flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-muted-foreground tracking-[0.2em] uppercase">{t('projects.all_projects')}</h2>
              </div>

              {filteredAndSortedProjects.length === 0 ? (
                <EmptyState
                  title={t('projects.no_projects')}
                  description={t('projects.no_projects_desc')}
                  icon={<Icons.folderKanban size={32} className="text-muted-foreground" />}
                  actionLabel={t('projects.reset_filters')}
                  onAction={() => {
                    setSearchQuery('');
                    setSelectedStatus('All Statuses');
                    setSelectedCategory('All Categories');
                  }}
                />
              ) : viewType === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {otherProjects.map(project => (
                      <ProjectCard key={project.id} project={project} onToggleFavorite={toggleFavorite} getStatusColor={getStatusColor} getProgressColor={getProgressColor} activeDropdownProjectId={activeDropdownProjectId} setActiveDropdownProjectId={setActiveDropdownProjectId} setProjects={setProjects} setEditingProject={(p) => { setEditingProject(p); resetEditForm({ name: p.name, description: p.description || '', categoryId: (p as any).categoryId || '' }); }} setDeletingProject={(p) => { setDeletingProject(p); setDeleteInput(''); }} t={t} />
                    ))}
                    <button
                      onClick={() => navigate('/workspace/projects/new')}
                      className="group flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-slate-300 hover:border-slate-400 hover:bg-background transition-all duration-200 h-full min-h-[300px]"
                    >
                      <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center text-muted-foreground group-hover:scale-105 transition-transform duration-200">
                        <Icons.plus size={24} strokeWidth={2.5} />
                      </div>
                      <h3 className="font-medium text-muted-foreground group-hover:text-foreground text-lg">{t('projects.new_project')}</h3>
                    </button>
                  </div>
                ) : (
                  <BaseDataTable columns={columns} data={otherProjects} />
                )}
            </section>
          </>
        )}
      </div>

      {/* Edit Project Modal */}
      {editingProject && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card rounded-2xl shadow-xl w-full max-w-md p-6 border border-border animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-foreground mb-4">{t('projects.edit_project')}</h3>
            <form onSubmit={handleEditSubmitWrapper(onEditSubmit)} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-foreground">{t('projects.project_name')}</label>
                <Input type="text" className={editErrors.name ? 'border-destructive focus-visible:ring-destructive' : ''}
                  {...registerEdit('name')} />
                {editErrors.name && <p className="text-rose-500 text-xs font-medium">{editErrors.name.message}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-foreground">{t('projects.category')}</label>
                <select className={`bg-background border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 ${editErrors.categoryId ? 'border-rose-500 focus:ring-rose-500/20 focus:border-rose-500' : 'border-border focus:ring-primary/20 focus:border-primary'}`}
                  {...registerEdit('categoryId')}>
                  <option value="" disabled>{t('projects.select_category')}</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {editErrors.categoryId && <p className="text-rose-500 text-xs font-medium">{editErrors.categoryId.message}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-foreground">{t('projects.description')}</label>
                <textarea className="bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none" rows={3}
                  {...registerEdit('description')} />
              </div>
              <div className="flex items-center justify-end gap-3 mt-4">
                <Button type="button" variant="ghost" onClick={() => setEditingProject(null)} className="px-4 py-2">
                  {t('common.cancel')}
                </Button>
                <Button type="submit" variant="kisafres" disabled={isUpdating} className="px-4 py-2">
                  {isUpdating ? t('projects.saving') : t('common.save')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Project Modal */}
      {deletingProject && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card rounded-2xl shadow-xl w-full max-w-md p-6 border border-border animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4 text-rose-600">
              <Icons.alertCircle size={24} />
              <h3 className="text-xl font-bold text-foreground">{t('projects.delete_project')}</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-6" dangerouslySetInnerHTML={{
              __html: t('projects.delete_confirm_desc')
                .replace('{projectName}', deletingProject.name)
                .replace('{projectCode}', deletingProject.code)
            }}>
            </p>
            <form onSubmit={handleDeleteSubmit} className="flex flex-col gap-4">
              <Input required type="text" className="mb-2"
                placeholder={`delete ${deletingProject.code}`} value={deleteInput} onChange={e => setDeleteInput(e.target.value)} />
              <div className="flex items-center justify-end gap-3 mt-2">
                <Button type="button" variant="ghost" onClick={() => { setDeletingProject(null); setDeleteInput(''); }} className="px-4 py-2">
                  {t('common.cancel')}
                </Button>
                <Button type="submit" variant="destructive" disabled={deleteInput !== `delete ${deletingProject.code}`} className="px-4 py-2">
                  {t('projects.confirm_delete')}
                </Button>
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
  t: any;
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
  setDeletingProject,
  t
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
      className="group bg-card rounded-2xl p-5 border border-border/80 shadow-sm hover:shadow-lg hover:shadow-slate-200/60 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col gap-4 h-full"
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
            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Icons.moreHorizontal size={16} />
          </button>
          {activeDropdownProjectId === project.id && (
            <>
              <div className="absolute right-0 top-full mt-1.5 w-52 bg-card rounded-xl shadow-xl border border-border py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <button onClick={() => { onToggleFavorite(project.id); setActiveDropdownProjectId(null); }}
                  className="w-full px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-background flex items-center gap-2.5 transition-colors">
                  <Icons.star size={13} className={project.isFavorite ? 'text-amber-400' : 'text-muted-foreground'} fill={project.isFavorite ? 'currentColor' : 'none'} />
                  <span>{project.isFavorite ? t('projects.remove_starred') : t('projects.add_starred')}</span>
                </button>
                <button onClick={() => { setActiveDropdownProjectId(null); setEditingProject(project); }}
                  className="w-full px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-background flex items-center gap-2.5 transition-colors">
                  <Icons.settings size={13} className="text-muted-foreground" />
                  <span>{t('projects.edit_project')}</span>
                </button>
                <div className="h-px bg-muted my-1" />
                <button onClick={() => {
                  setActiveDropdownProjectId(null);
                  setDeletingProject(project);
                }}
                  className="w-full px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors">
                  <Icons.alertCircle size={13} className="text-rose-500" />
                  <span>{t('projects.delete_project')}</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Row 2 — Title + description */}
      <div className="flex-1">
        <h3 className="text-[17px] font-bold text-foreground group-hover:text-foreground transition-colors line-clamp-1 leading-snug">
          {project.name}
        </h3>
        <p className="text-[12.5px] text-muted-foreground font-normal mt-0.5 line-clamp-2 leading-relaxed">
          {project.description || t('projects.no_description')}
        </p>
      </div>

      {/* Row 3 — Progress bar */}
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.12em]">
            {isScrum ? sprintName : 'Active Board'}
          </span>
          <span className="text-[11px] font-bold text-muted-foreground">{percentage}%</span>
        </div>
        <div className="h-[5px] bg-muted rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-700 ${getProgressColor(project.status)}`} style={{ width: `${percentage}%` }} />
        </div>
      </div>

      {/* Row 4 — Stat chips */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center gap-2 bg-background border border-border/70 rounded-xl px-3 py-2">
          <Icons.listChecks size={13} className="text-muted-foreground shrink-0" />
          <div>
            <p className="text-[11px] font-bold text-foreground leading-none">{totalTasks} {t('projects.total')}</p>
            <p className="text-[10px] text-muted-foreground leading-none mt-0.5">{t('projects.tasks')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
          <Icons.checkCircle2 size={13} className="text-emerald-500 shrink-0" />
          <div>
            <p className="text-[11px] font-bold text-emerald-600 leading-none">{completedTasks} {t('projects.done')}</p>
            <p className="text-[10px] text-emerald-400 leading-none mt-0.5">{t('projects.tasks')}</p>
          </div>
        </div>
      </div>

      {/* Row 5 — Footer: avatars + deadline / CONTINUOUS DELIVERY */}
      <div className="flex items-center justify-between pt-3 border-t border-border mt-auto">
        <div className="flex items-center -space-x-2">
          {project.members.slice(0, 3).map((member) => (
            <img  key={member.id} src={member.avatar} alt={member.name}
              className="w-7 h-7 rounded-full border-2 border-white object-cover" title={member.name} />
          ))}
          {project.members.length > 3 && (
            <div className="w-7 h-7 rounded-full bg-muted border-2 border-white flex items-center justify-center text-[9px] font-bold text-muted-foreground">
              +{project.members.length - 3}
            </div>
          )}
        </div>
        {isScrum && (
          <div className="flex items-center gap-1 text-muted-foreground">
            <Icons.clock size={12} className="text-muted-foreground" />
            <span className="text-[11px] font-semibold">{deadlineDisplay}</span>
          </div>
        )}
      </div>
    </div>
  );
}


