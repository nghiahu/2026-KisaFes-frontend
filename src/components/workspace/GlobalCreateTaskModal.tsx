import { useState, useEffect, useRef } from 'react';
import { Icons } from '../../assets/icons';
import { useProjects, useProject } from '../../hooks/api/useProjects';
import { taskService } from '../../services/task.service';
import { useQueryClient } from '@tanstack/react-query';
import { createPortal } from 'react-dom';
import defaultMan from '../../assets/avatar_def_man.png';

interface GlobalCreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TASK_TYPES = [
  { id: 'epic', label: 'Epic', icon: <Icons.zap size={14} className="text-purple-500 fill-current" /> },
  { id: 'task', label: 'Task', icon: <Icons.checkSquare size={14} className="text-blue-500" /> },
  { id: 'incident', label: 'Incident', icon: <Icons.alertCircle size={14} className="text-rose-500" /> },
  { id: 'service', label: 'Service Request', icon: <Icons.helpCircle size={14} className="text-orange-500" /> },
  { id: 'support', label: 'Support', icon: <Icons.settings size={14} className="text-fuchsia-500" /> },
];

export default function GlobalCreateTaskModal({ isOpen, onClose }: GlobalCreateTaskModalProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState(TASK_TYPES[1]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assigneeId, setAssigneeId] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState('');
  const [createAnother, setCreateAnother] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dropdowns state
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [projectSearch, setProjectSearch] = useState('');

  const { data: projects = [] } = useProjects();
  const { data: selectedProject } = useProject(selectedProjectId || '');
  const queryClient = useQueryClient();

  const typeDropdownRef = useRef<HTMLDivElement>(null);
  const projectDropdownRef = useRef<HTMLDivElement>(null);
  const assigneeDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(e.target as Node)) {
        setShowTypeDropdown(false);
      }
      if (projectDropdownRef.current && !projectDropdownRef.current.contains(e.target as Node)) {
        setShowProjectDropdown(false);
      }
      if (assigneeDropdownRef.current && !assigneeDropdownRef.current.contains(e.target as Node)) {
        setShowAssigneeDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isOpen) return null;

  const currentProjectObj = projects.find((p: any) => p.id === selectedProjectId);
  const filteredProjects = projects.filter((p: any) => p.name.toLowerCase().includes(projectSearch.toLowerCase()));

  const handleCreate = async () => {
    if (!title.trim() || !selectedProjectId) return;
    setIsSubmitting(true);
    try {
      const firstStatusId = selectedProject?.statuses?.[0]?.statusId || '';
      await taskService.createTask({
        projectId: selectedProjectId,
        title: title.trim(),
        description: description.trim(),
        type: selectedType.id,
        assigneeId: assigneeId,
        statusId: firstStatusId,
        dueDate: dueDate ? `${dueDate}T00:00:00` : null
      });

      queryClient.invalidateQueries({ queryKey: ['project', selectedProjectId] });
      queryClient.invalidateQueries({ queryKey: ['tasks', selectedProjectId] });
      queryClient.invalidateQueries({ queryKey: ['projectBacklog', selectedProjectId] });

      if (createAnother) {
        setTitle('');
        setDescription('');
      } else {
        onClose();
      }
    } catch (error) {
      console.error('Failed to create task:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedAssigneeObj = selectedProject?.members?.find((m: any) => m.id === assigneeId);

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-card rounded-xl shadow-2xl w-full max-w-[700px] flex flex-col overflow-visible animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header Options */}
        <div className="px-5 py-3 border-b border-border flex items-center justify-between bg-background rounded-t-xl">
          <div className="flex items-center gap-2">
            {/* Project Selector */}
            <div className="relative" ref={projectDropdownRef}>
              <button 
                onClick={() => setShowProjectDropdown(!showProjectDropdown)}
                className="flex items-center gap-2 p-1.5 hover:bg-slate-200 rounded-md transition-colors"
              >
                <div className="w-5 h-5 bg-blue-500 rounded text-white flex items-center justify-center shrink-0">
                  <Icons.cloud size={12} className="fill-white" />
                </div>
                <Icons.chevronDown size={14} className="text-muted-foreground" />
              </button>
              
              {showProjectDropdown && (
                <div className="absolute top-full left-0 mt-1 w-[260px] bg-card rounded-lg shadow-xl border border-border py-1 z-50">
                  <div className="px-2 py-1.5">
                    <div className="relative">
                      <Icons.search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input 
                        autoFocus
                        value={projectSearch}
                        onChange={e => setProjectSearch(e.target.value)}
                        placeholder="Search spaces" 
                        className="w-full text-xs pl-8 pr-3 py-1.5 bg-background border border-border rounded outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div className="px-3 py-1 mt-1 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    Recent Spaces
                  </div>
                  <div className="max-h-[200px] overflow-y-auto pb-1">
                    {filteredProjects.map((p: any) => (
                      <button 
                        key={p.id}
                        onClick={() => {
                          setSelectedProjectId(p.id);
                          setShowProjectDropdown(false);
                          setAssigneeId(null);
                        }}
                        className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-left transition-colors ${selectedProjectId === p.id ? 'bg-blue-50 text-blue-700' : 'hover:bg-background text-foreground'}`}
                      >
                        <div className="w-5 h-5 bg-blue-500 rounded text-white flex items-center justify-center shrink-0">
                          <Icons.cloud size={12} className="fill-white" />
                        </div>
                        <span className="truncate">{p.name} ({p.key || p.name.substring(0,2).toUpperCase()})</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Task Type Selector */}
            <div className="relative" ref={typeDropdownRef}>
              <button 
                onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                className="flex items-center gap-2 p-1.5 hover:bg-slate-200 rounded-md transition-colors border border-transparent"
              >
                {selectedType.icon}
                <Icons.chevronDown size={14} className="text-muted-foreground" />
              </button>
              
              {showTypeDropdown && (
                <div className="absolute top-full left-0 mt-1 w-[160px] bg-card rounded-lg shadow-xl border border-border py-1 z-50">
                  {TASK_TYPES.map(type => (
                    <button
                      key={type.id}
                      onClick={() => { setSelectedType(type); setShowTypeDropdown(false); }}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-left transition-colors ${selectedType.id === type.id ? 'bg-blue-50 text-blue-700 border-l-2 border-blue-500' : 'hover:bg-background text-foreground border-l-2 border-transparent'}`}
                    >
                      {type.icon}
                      {type.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <div className="text-xs font-semibold text-muted-foreground ml-2">
              in {currentProjectObj?.name || '...'}
            </div>
          </div>
          
          <div className="flex items-center gap-1.5">
            <button className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-slate-200 rounded-md transition-colors">
              <Icons.minimize2 size={16} />
            </button>
            <button className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-slate-200 rounded-md transition-colors">
              <Icons.maximize2 size={16} />
            </button>
            <button onClick={onClose} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-slate-200 rounded-md transition-colors">
              <Icons.x size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col gap-4">
          <input
            autoFocus
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Title"
            className="text-2xl font-bold text-foreground placeholder:text-slate-300 outline-none w-full"
          />
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="We support markdown! Try **bold**, `inline code`, or ``` for code blocks."
            className="w-full text-sm text-muted-foreground placeholder:text-muted-foreground outline-none resize-none min-h-[120px]"
          />

          <div className="flex flex-wrap items-center gap-2 mt-4">
            {/* Assignee */}
            <div className="relative" ref={assigneeDropdownRef}>
              <button 
                onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
                className="flex items-center gap-2 px-3 py-1.5 border border-border rounded hover:bg-background transition-colors text-xs font-medium text-foreground"
              >
                {selectedAssigneeObj ? (
                  <img  src={selectedAssigneeObj.avatar || defaultMan} alt="" className="w-4 h-4 rounded-full" />
                ) : (
                  <Icons.user size={14} className="text-muted-foreground" />
                )}
                {selectedAssigneeObj ? selectedAssigneeObj.name : 'Automatic'}
              </button>
              
              {showAssigneeDropdown && (
                <div className="absolute top-full left-0 mt-1 w-[200px] bg-card rounded-lg shadow-xl border border-border py-1 z-50">
                  <button
                    onClick={() => { setAssigneeId(null); setShowAssigneeDropdown(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-background text-left text-xs text-foreground"
                  >
                    <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center border border-dashed border-slate-300">
                      <Icons.user size={10} className="text-muted-foreground" />
                    </div>
                    Automatic
                  </button>
                  {selectedProject?.members?.map((m: any) => (
                    <button
                      key={m.id}
                      onClick={() => { setAssigneeId(m.id); setShowAssigneeDropdown(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-background text-left text-xs text-foreground"
                    >
                      <img  src={m.avatar || defaultMan} alt="" className="w-5 h-5 rounded-full" />
                      <span className="truncate">{m.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Due Date */}
            <div className="relative flex items-center">
              <button 
                onClick={(e) => {
                  const input = e.currentTarget.nextElementSibling as HTMLInputElement;
                  if (input) {
                    try { input.showPicker(); } catch (err) { input.focus(); }
                  }
                }}
                className="flex items-center gap-2 px-3 py-1.5 border border-border rounded hover:bg-background transition-colors text-xs font-medium text-foreground"
              >
                <Icons.calendar size={14} className="text-muted-foreground" /> 
                {dueDate ? new Date(dueDate).toLocaleDateString() : 'Due date'}
              </button>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="absolute w-0 h-0 opacity-0 pointer-events-none"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border flex items-center justify-end gap-4 bg-card rounded-b-xl">
          <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-muted-foreground">
            <input 
              type="checkbox" 
              checked={createAnother}
              onChange={e => setCreateAnother(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            Create another
          </label>
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-bold text-muted-foreground hover:bg-muted rounded-md transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleCreate}
            disabled={!title.trim() || !selectedProjectId || isSubmitting}
            className="px-6 py-2 bg-blue-600 text-white text-sm font-bold rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
