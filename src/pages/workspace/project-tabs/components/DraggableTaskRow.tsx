import React, { useState, useEffect, useRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Edit3, ChevronDown, Check, X, Search, User, Trash2, MoreHorizontal, Zap, AlertCircle, CheckSquare, MoveRight } from 'lucide-react';
import { createPortal } from 'react-dom';
import { taskService } from '../../../../services/task.service';
import defaultMan from '../../../../assets/avatar_def_man.png';

const getTypeInfo = (type?: string) => {
  const t = (type || '').toLowerCase();
  switch (t) {
    case 'epic': return { icon: <Zap size={10} className="fill-current" />, bg: 'bg-violet-100', color: 'text-violet-600', label: 'Epic' };
    case 'story': return { icon: <Zap size={10} className="fill-current" />, bg: 'bg-emerald-100', color: 'text-emerald-600', label: 'Story' };
    case 'incident':
    case 'bug': return { icon: <AlertCircle size={10} />, bg: 'bg-rose-100', color: 'text-rose-600', label: 'Incident' };
    case 'service request': return { icon: <AlertCircle size={10} />, bg: 'bg-amber-100', color: 'text-amber-600', label: 'Service Request' };
    case 'task':
    default: return { icon: <CheckSquare size={10} />, bg: 'bg-blue-100', color: 'text-blue-600', label: 'Task' };
  }
};

// ─── Draggable Task Row ────────────────────────────────────────────────────
export function DraggableTaskRow({ task, project, onMoveToSprint, onDeleteTask, sprints, isSelected, onToggle, onTaskUpdated, isOverlay = false, onTaskClick }: {
  task: any; project: any; onMoveToSprint?: (taskId: string, sprintId: string | null) => void; onDeleteTask?: (taskId: string) => void; sprints?: any[]; isSelected?: boolean; onToggle?: (id: string) => void; onTaskUpdated?: () => void; isOverlay?: boolean; onTaskClick?: (task: any) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id, data: { type: 'task', task, sprintId: task.sprintId || null },
  });
  const style = { transform: CSS.Transform.toString(transform), transition, ...(isOverlay ? {} : { opacity: 1 }) };



  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [showMoveModal, setShowMoveModal] = useState(false);

  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const statusRef = useRef<HTMLDivElement>(null);

  const [showAssigneeMenu, setShowAssigneeMenu] = useState(false);
  const assigneeRef = useRef<HTMLDivElement>(null);
  const [assigneeSearch, setAssigneeSearch] = useState('');
  const assigneeSearchRef = useRef<HTMLInputElement>(null);

  const [showStoryPointEditor, setShowStoryPointEditor] = useState(false);
  const [storyPointValue, setStoryPointValue] = useState<number | ''>('');
  const storyPointRef = useRef<HTMLDivElement>(null);

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(task.title || '');
  const titleInputRef = useRef<HTMLInputElement>(null);

  const filteredMembers = project?.members?.filter((m: any) =>
    !assigneeSearch.trim() || m.name.toLowerCase().includes(assigneeSearch.toLowerCase()) || m.email?.toLowerCase().includes(assigneeSearch.toLowerCase())
  ) || [];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setShowMenu(false);
      if (statusRef.current && !statusRef.current.contains(event.target as Node)) setShowStatusMenu(false);
      if (assigneeRef.current && !assigneeRef.current.contains(event.target as Node)) setShowAssigneeMenu(false);
      if (storyPointRef.current && !storyPointRef.current.contains(event.target as Node)) setShowStoryPointEditor(false);
      if (titleInputRef.current && !titleInputRef.current.contains(event.target as Node) && isEditingTitle) {
        setIsEditingTitle(false);
        setTitleValue(task.title);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isEditingTitle, task.title]);

  const statusObj = project?.statuses?.find((s: any) => s.statusId === task.statusId);
  const statusColor = statusObj?.color || '#94a3b8';

  if (isDragging && !isOverlay) {
    return (
      <div
        ref={setNodeRef}
        style={{ ...style, height: '44px' }}
        className="border-2 border-dashed border-blue-400 bg-blue-50/50 rounded-md my-0.5 opacity-50 transition-all duration-200"
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="group flex items-center gap-2 px-1 py-1.5 hover:bg-slate-50 border-b border-slate-100 bg-white relative cursor-grab active:cursor-grabbing"
    >
      <div className="w-5 flex items-center justify-center shrink-0">
        <button className="text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100">
          <GripVertical size={14} />
        </button>
      </div>

      <input
        type="checkbox"
        checked={!!isSelected}
        onChange={() => onToggle?.(task.id)}
        className="w-3.5 h-3.5 border-slate-300 rounded-[2px] text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0 group-hover:border-blue-400"
      />

      <span className="shrink-0 flex items-center justify-center">
        {(() => {
          const info = getTypeInfo(task.type);
          return (
            <span className={`w-4 h-4 rounded ${info.bg} flex items-center justify-center ${info.color} font-black shadow-sm`} title={info.label}>
              {info.icon}
            </span>
          );
        })()}
      </span>

      <span 
        className="text-xs font-semibold text-slate-500 hover:underline cursor-pointer shrink-0"
        onClick={(e) => {
          e.stopPropagation();
          onTaskClick?.(task);
        }}
      >
        {task.taskKey}
      </span>

      {isEditingTitle ? (
        <div className="flex-1 flex items-center gap-1 min-w-0" ref={titleInputRef}>
          <input
            type="text"
            value={titleValue}
            onChange={(e) => setTitleValue(e.target.value)}
            className="flex-1 text-[13px] text-slate-800 border-2 border-blue-500 rounded-[3px] px-2 py-1 outline-none min-w-0 bg-white"
            autoFocus
            onKeyDown={async (e) => {
              if (e.key === 'Enter') {
                if (titleValue.trim() && titleValue.trim() !== task.title) {
                  setIsEditingTitle(false);
                  try {
                    await taskService.updateTaskTitle(task.id || task.dbId, titleValue.trim());
                    onTaskUpdated?.();
                  } catch (err) { console.error(err); }
                } else {
                  setIsEditingTitle(false);
                  setTitleValue(task.title);
                }
              }
              if (e.key === 'Escape') {
                setIsEditingTitle(false);
                setTitleValue(task.title);
              }
            }}
          />
          <button
            onClick={async (e) => {
              e.stopPropagation();
              if (titleValue.trim() && titleValue.trim() !== task.title) {
                setIsEditingTitle(false);
                try {
                  await taskService.updateTaskTitle(task.id || task.dbId, titleValue.trim());
                  onTaskUpdated?.();
                } catch (err) { console.error(err); }
              } else {
                setIsEditingTitle(false);
                setTitleValue(task.title);
              }
            }}
            className="flex items-center justify-center w-7 h-7 shrink-0 rounded bg-slate-50 hover:bg-green-50 text-slate-600 hover:text-green-600 border border-slate-200 transition-colors"
          >
            <Check size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsEditingTitle(false);
              setTitleValue(task.title);
            }}
            className="flex items-center justify-center w-7 h-7 shrink-0 rounded bg-slate-50 hover:bg-red-50 text-slate-600 hover:text-red-600 border border-slate-200 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <div className="flex-1 flex items-center gap-2 min-w-0 group/title">
          <span
            className="text-[13px] text-slate-800 truncate hover:underline cursor-pointer font-medium"
            onClick={() => {
              setTitleValue(task.title);
              setIsEditingTitle(true);
            }}
          >
            {task.title}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setTitleValue(task.title);
              setIsEditingTitle(true);
            }}
            className="w-5 h-5 flex items-center justify-center rounded bg-slate-200/50 text-slate-500 hover:bg-slate-200 opacity-0 group-hover/title:opacity-100 transition-opacity shrink-0"
          >
            <Edit3 size={11} />
          </button>
        </div>
      )}

      <div className="flex items-center gap-5 shrink-0 pr-2">
        <div className="relative" ref={statusRef}>
          <div
            onClick={(e) => { e.stopPropagation(); setShowStatusMenu(p => !p); setShowAssigneeMenu(false); setShowMenu(false); }}
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-black tracking-wider uppercase transition-colors shadow-sm cursor-pointer ${task.status === 'Done' || task.status?.toLowerCase().includes('done') || task.status?.toLowerCase().includes('hoàn thành')
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
              : task.status === 'In Progress' || task.status?.toLowerCase().includes('progress') || task.status?.toLowerCase().includes('đang')
                ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
          >
            <span className="truncate">{statusObj?.label || task.status || 'TO DO'}</span>
            <ChevronDown size={12} className="text-slate-400 shrink-0" />
          </div>
          {showStatusMenu && (
            <div className="absolute right-0 top-7 z-[9999] bg-white border border-slate-200 rounded-[4px] shadow-xl py-1.5 w-44 text-sm overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="px-1 max-h-[250px] overflow-y-auto">
                {project?.statuses?.map((s: any) => (
                  <button
                    key={s.statusId}
                    onClick={async () => {
                      setShowStatusMenu(false);
                      if (s.statusId === task.statusId) return;
                      try {
                        await taskService.updateTaskStatus(task.id || task.dbId, s.statusId);
                        onTaskUpdated?.();
                      } catch (e) { console.error(e); }
                    }}
                    className={`w-full flex items-center justify-between px-3 py-1.5 text-left text-[12px] font-semibold rounded-[3px] hover:bg-slate-50 ${s.statusId === task.statusId ? 'text-blue-600 bg-blue-50' : 'text-slate-700'}`}
                  >
                    <span className="truncate">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="relative" ref={storyPointRef}>
          <div
            className="w-5 h-5 flex items-center justify-center rounded-full bg-slate-200 text-[11px] font-bold text-slate-700 cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all"
            onClick={(e) => {
              e.stopPropagation();
              setStoryPointValue(task.storyPoints != null ? task.storyPoints : '');
              setShowStoryPointEditor(p => !p);
              setShowAssigneeMenu(false);
              setShowStatusMenu(false);
              setShowMenu(false);
            }}
          >
            {task.storyPoints != null ? task.storyPoints : '-'}
          </div>

          {showStoryPointEditor && (
            <div className="absolute top-7 left-1/2 -translate-x-1/2 z-[9999] bg-white border border-slate-200 shadow-xl rounded-lg p-1.5 flex flex-col gap-1.5 min-w-[80px]" onClick={e => e.stopPropagation()}>
              <input
                type="number"
                value={storyPointValue}
                onChange={e => setStoryPointValue(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full text-center text-[12px] font-bold text-slate-700 border border-slate-300 rounded px-1 py-1 focus:outline-none focus:border-blue-500"
                autoFocus
                onKeyDown={async (e) => {
                  if (e.key === 'Enter') {
                    setShowStoryPointEditor(false);
                    try {
                      await taskService.updateTaskStoryPoints(task.id || task.dbId, storyPointValue === '' ? null : Number(storyPointValue));
                      onTaskUpdated?.();
                    } catch (err) { console.error(err); }
                  }
                  if (e.key === 'Escape') setShowStoryPointEditor(false);
                }}
              />
              <div className="flex items-center gap-1">
                <button
                  onClick={async () => {
                    setShowStoryPointEditor(false);
                    try {
                      await taskService.updateTaskStoryPoints(task.id || task.dbId, storyPointValue === '' ? null : Number(storyPointValue));
                      onTaskUpdated?.();
                    } catch (err) { console.error(err); }
                  }}
                  className="flex-1 flex justify-center items-center py-1 rounded bg-slate-50 hover:bg-green-50 text-slate-600 hover:text-green-600 border border-slate-200 transition-colors"
                >
                  <Check size={14} />
                </button>
                <button
                  onClick={() => setShowStoryPointEditor(false)}
                  className="flex-1 flex justify-center items-center py-1 rounded bg-slate-50 hover:bg-red-50 text-slate-600 hover:text-red-600 border border-slate-200 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="relative" ref={assigneeRef}>
          <img
            src={task.assigneeAvatar || defaultMan}
            alt={task.assigneeName || 'Unassigned'}
            className="w-5 h-5 rounded-full shrink-0 cursor-pointer object-cover border border-slate-200 hover:ring-2 hover:ring-blue-400 transition-all"
            title={task.assigneeName || 'Unassigned'}
            onClick={(e) => {
              e.stopPropagation();
              setShowAssigneeMenu(p => {
                if (!p) {
                  setAssigneeSearch('');
                  setTimeout(() => assigneeSearchRef.current?.focus(), 50);
                }
                return !p;
              });
              setShowStatusMenu(false);
              setShowMenu(false);
            }}
          />
          {showAssigneeMenu && (
            <div className="absolute right-0 top-7 z-[9999] bg-white border border-slate-200 shadow-2xl rounded-xl py-2 w-[230px] overflow-hidden" onClick={e => e.stopPropagation()}>
              {/* Search bar */}
              <div className="px-3 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus-within:border-blue-400 focus-within:bg-white transition-all">
                  <Search size={12} className="text-slate-400 shrink-0" />
                  <input
                    ref={assigneeSearchRef}
                    type="text"
                    placeholder="Tìm người dùng..."
                    value={assigneeSearch}
                    onChange={(e) => setAssigneeSearch(e.target.value)}
                    className="flex-1 text-[12px] text-slate-700 bg-transparent outline-none placeholder:text-slate-400"
                  />
                  {assigneeSearch && (
                    <button
                      onClick={() => setAssigneeSearch('')}
                      className="text-slate-400 hover:text-slate-600 shrink-0"
                    >
                      <X size={11} />
                    </button>
                  )}
                </div>
              </div>

              {/* Member list */}
              <div className="max-h-[220px] overflow-y-auto py-1">
                {(!assigneeSearch.trim() || 'unassigned'.includes(assigneeSearch.toLowerCase())) && (
                  <button
                    onClick={async () => {
                      setShowAssigneeMenu(false);
                      if (!task.assigneeId) return;
                      try {
                        await taskService.updateTaskAssignee(task.id || task.dbId, null);
                        onTaskUpdated?.();
                      } catch (e) { console.error(e); }
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-medium transition-colors text-left ${!task.assigneeId ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    <div className="w-6 h-6 rounded-full bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center text-slate-400 shrink-0">
                      <User size={11} />
                    </div>
                    <span>Unassigned</span>
                    {!task.assigneeId && <Check size={12} className="ml-auto text-blue-500 shrink-0" />}
                  </button>
                )}

                {filteredMembers.length > 0 && (
                  <>
                    {!assigneeSearch.trim() && (
                      <div className="px-3 py-1 mt-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Thành viên dự án</span>
                      </div>
                    )}
                    {filteredMembers.map((m: any) => {
                      const isSelected = m.id === task.assigneeId;
                      return (
                        <button
                          key={m.id}
                          onClick={async () => {
                            setShowAssigneeMenu(false);
                            if (isSelected) return;
                            try {
                              await taskService.updateTaskAssignee(task.id || task.dbId, m.id);
                              onTaskUpdated?.();
                            } catch (e) { console.error(e); }
                          }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-medium transition-colors text-left ${isSelected ? 'bg-blue-50 text-blue-600' : 'text-slate-700 hover:bg-slate-50'}`}
                        >
                          <img src={m.avatar || defaultMan} alt={m.name} className="w-6 h-6 rounded-full object-cover shrink-0 border border-slate-200" />
                          <div className="flex flex-col min-w-0">
                            <span className={`truncate ${isSelected ? 'font-bold' : 'font-semibold'}`}>{m.name}</span>
                            {m.email && <span className="truncate text-[10px] text-slate-400 font-normal">{m.email}</span>}
                          </div>
                          {isSelected && <Check size={12} className="ml-auto text-blue-500 shrink-0" />}
                        </button>
                      );
                    })}
                  </>
                )}

                {filteredMembers.length === 0 && assigneeSearch.trim() && (
                  <div className="px-3 py-4 text-center">
                    <p className="text-[11px] text-slate-400">Không tìm thấy người dùng</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* More menu */}
      <div className="relative shrink-0" ref={menuRef}>
        <button
          onClick={(e) => { e.stopPropagation(); setShowMenu(p => !p); }}
          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-600 rounded-md transition-all"
        >
          <MoreHorizontal size={14} />
        </button>
        {showMenu && (
          <div className="absolute right-0 top-6 z-20 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 w-36 text-sm" onClick={() => setShowMenu(false)}>
            <button
              onClick={(e) => { e.stopPropagation(); setShowMoveModal(true); setShowMenu(false); }}
              className="w-full px-3 py-1.5 text-left text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2 mb-1"
            >
              <MoveRight size={11} />
              Di chuyển
            </button>
            <button
              onClick={() => onDeleteTask?.(task.id)}
              className="w-full px-3 py-1.5 text-left text-xs font-semibold text-slate-700 hover:bg-rose-50 hover:text-rose-600 flex items-center gap-2"
            >
              <Trash2 size={11} />
              Xóa
            </button>
          </div>
        )}
      </div>

      {showMoveModal && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/40 backdrop-blur-[2px]" onClick={() => setShowMoveModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-[400px] overflow-hidden border border-slate-200" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-extrabold text-slate-800 text-sm">Di chuyển Task</h3>
              <button onClick={() => setShowMoveModal(false)} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"><X size={14}/></button>
            </div>
            <div className="p-3 max-h-[350px] overflow-y-auto flex flex-col gap-1.5">
              <button 
                onClick={() => { onMoveToSprint?.(task.id, null); setShowMoveModal(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-bold transition-all ${!task.sprintId ? 'bg-blue-50 text-blue-600 ring-1 ring-blue-200' : 'text-slate-700 hover:bg-slate-100'}`}
              >
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 shrink-0 border border-slate-200/60">
                  <CheckSquare size={14} />
                </div>
                Backlog
                {!task.sprintId && <Check size={14} className="ml-auto" />}
              </button>
              
              {sprints?.length ? (
                <div className="px-3 py-2 mt-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sprints</span>
                </div>
              ) : null}

              {sprints?.map(sprint => (
                <button 
                  key={sprint.id}
                  onClick={() => { onMoveToSprint?.(task.id, sprint.id); setShowMoveModal(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-bold transition-all ${task.sprintId === sprint.id ? 'bg-violet-50 text-violet-700 ring-1 ring-violet-200' : 'text-slate-700 hover:bg-slate-100'}`}
                >
                  <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center text-violet-500 shrink-0 border border-violet-200/60">
                    <Zap size={14} className="fill-current" />
                  </div>
                  {sprint.name}
                  {task.sprintId === sprint.id && <Check size={14} className="ml-auto" />}
                </button>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
