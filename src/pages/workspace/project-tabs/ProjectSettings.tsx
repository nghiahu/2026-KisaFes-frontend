import React, { useState, useEffect } from 'react';
import { Icons } from '../../../assets/icons';
import { useLanguage } from '../../../contexts/LanguageContext';

interface ProjectSettingsProps {
  currentProject: any;
  onUpdate: () => void;
}

export default function ProjectSettings({ currentProject, onUpdate }: ProjectSettingsProps) {
  const [statuses, setStatuses] = useState<any[]>([]);
  const [boardColumns, setBoardColumns] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    if (currentProject) {
      setStatuses(currentProject.statuses || []);
      setBoardColumns(currentProject.boardColumns || []);
    }
  }, [currentProject]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // TODO: Call actual API to update project workflow settings
      console.log('Update project settings:', { id: currentProject.id, statuses, boardColumns });
      await new Promise(r => setTimeout(r, 1000));
      onUpdate();
    } catch (err) {
      console.error("Failed to update project settings:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const removeStatus = (idx: number) => {
    setStatuses(statuses.filter((_, i) => i !== idx));
  };

  return (
    <div className="flex flex-col gap-8 p-6 animate-in fade-in duration-300 overflow-y-auto h-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-foreground tracking-tight">{t('project_settings.title')}</h2>
          <p className="text-muted-foreground font-medium">{t('project_settings.subtitle')}</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-md shadow-blue-200 dark:shadow-none dark:shadow-none disabled:opacity-70"
        >
          {isSaving ? t('project_settings.saving') : t('project_settings.save')}
        </button>
      </div>

      <div className="flex flex-col gap-4">
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t('project_settings.active_statuses')}</label>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statuses.map((status, idx) => (
            <div key={status.statusId || idx} className="flex items-center gap-3 bg-card border border-border p-4 rounded-2xl shadow-sm group">
              <div className={`w-3 h-3 rounded-full ${status.color || 'bg-slate-500'}`} />
              <input
                className="flex-1 min-w-0 font-bold text-foreground bg-transparent outline-none"
                value={status.label}
                onChange={(e) => {
                  const newStatus = [...statuses];
                  newStatus[idx] = { ...newStatus[idx], label: e.target.value };
                  setStatuses(newStatus);
                }}
              />
              <button 
                onClick={() => removeStatus(idx)}
                className="text-slate-300 hover:text-rose-500 transition-colors shrink-0"
              >
                <Icons.trash2 size={16} />
              </button>
            </div>
          ))}
          <button 
            onClick={() => setStatuses([...statuses, { statusId: crypto.randomUUID(), label: t('project_settings.new_status'), category: 'TO_DO', color: 'bg-slate-500' }])}
            className="flex items-center justify-center bg-background border border-dashed border-slate-300 p-4 rounded-2xl text-muted-foreground hover:bg-muted transition-all"
          >
            <Icons.plus size={20} />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t('project_settings.unmapped_statuses')}</label>
        <div 
          className="min-h-[60px] p-4 bg-muted border-2 border-dashed border-slate-300 rounded-2xl flex flex-wrap gap-2"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const statusId = e.dataTransfer.getData('statusId');
            if (!statusId) return;
            const newCols = boardColumns.map(col => {
              if (!col.mappedStatusIds?.includes(statusId)) return col;
              const newMapped = col.mappedStatusIds.filter((id: string) => id !== statusId);
              return {
                ...col,
                mappedStatusIds: newMapped,
                defaultStatusId: col.defaultStatusId === statusId ? (newMapped[0] || '') : col.defaultStatusId
              };
            });
            setBoardColumns(newCols);
          }}
        >
          {statuses.filter(s => !boardColumns.some(c => c.mappedStatusIds?.includes(s.statusId))).length === 0 && (
            <span className="text-muted-foreground text-sm font-semibold italic">{t('project_settings.all_statuses_mapped')}</span>
          )}
          {statuses.filter(s => !boardColumns.some(c => c.mappedStatusIds?.includes(s.statusId))).map(st => (
            <div
              key={st.statusId}
              draggable
              onDragStart={(e) => e.dataTransfer.setData('statusId', st.statusId)}
              className="px-3 py-1.5 bg-card border border-border shadow-sm rounded-lg text-xs font-bold text-foreground cursor-grab active:cursor-grabbing hover:border-blue-400 hover:shadow-md transition-all flex items-center gap-2"
            >
              <div className={`w-2 h-2 rounded-full ${st.color || 'bg-slate-500'}`} />
              {st.label}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t('project_settings.board_columns')}</label>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {boardColumns.map((column, idx) => (
            <div key={column.id || idx} className="flex flex-col gap-2 bg-background/50 border border-border p-4 rounded-2xl">
              <div className="flex items-center justify-between gap-2">
                <input 
                  className="flex-1 min-w-0 font-bold text-foreground bg-transparent outline-none"
                  value={column.name}
                  onChange={(e) => {
                    const newCols = [...boardColumns];
                    newCols[idx] = { ...newCols[idx], name: e.target.value };
                    setBoardColumns(newCols);
                  }}
                />
                <button 
                  onClick={() => setBoardColumns(boardColumns.filter((_, i) => i !== idx))}
                  className="text-muted-foreground hover:text-rose-500 transition-colors shrink-0"
                >
                  <Icons.trash2 size={14} />
                </button>
              </div>
              
              <div 
                className={`flex flex-col gap-2 mt-2 min-h-[60px] bg-card border border-dashed rounded-xl p-2 transition-colors ${(!column.mappedStatusIds || column.mappedStatusIds.length === 0) ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300 hover:border-blue-400'}`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const statusId = e.dataTransfer.getData('statusId');
                  if (!statusId) return;
                  
                  const newCols = boardColumns.map((c, i) => {
                    if (i === idx) {
                      if (c.mappedStatusIds?.includes(statusId)) return c;
                      const mapped = [...(c.mappedStatusIds || []), statusId];
                      return { ...c, mappedStatusIds: mapped, defaultStatusId: c.defaultStatusId || statusId };
                    } else {
                      if (!c.mappedStatusIds?.includes(statusId)) return c;
                      const mapped = c.mappedStatusIds.filter((id: string) => id !== statusId);
                      return { ...c, mappedStatusIds: mapped, defaultStatusId: c.defaultStatusId === statusId ? (mapped[0] || '') : c.defaultStatusId };
                    }
                  });
                  setBoardColumns(newCols);
                }}
              >
                <span className={`text-[10px] font-bold uppercase tracking-wider px-1 ${(!column.mappedStatusIds || column.mappedStatusIds.length === 0) ? 'text-rose-500' : 'text-muted-foreground'}`}>{t('project_settings.mapped_statuses')}</span>
                <div className="flex flex-wrap gap-1">
                  {column.mappedStatusIds?.map((sid: string) => {
                    const st = statuses.find(s => s.statusId === sid);
                    if (!st) return null;
                    return (
                      <div
                        key={st.statusId}
                        draggable
                        onDragStart={(e) => e.dataTransfer.setData('statusId', st.statusId)}
                        className="px-2 py-1 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-[10px] font-bold cursor-grab active:cursor-grabbing flex items-center gap-1.5 shadow-sm hover:shadow-md transition-all"
                      >
                        <div className={`w-1.5 h-1.5 rounded-full ${st.color || 'bg-slate-500'}`} />
                        {st.label}
                      </div>
                    );
                  })}
                  {(!column.mappedStatusIds || column.mappedStatusIds.length === 0) && (
                    <div className="flex items-center gap-1 text-rose-500 p-1">
                      <Icons.alertCircle size={12} />
                      <span className="text-[10px] italic font-bold">{t('project_settings.drag_instruction')}</span>
                    </div>
                  )}
                </div>
              </div>
              
            </div>
          ))}
          <button 
            onClick={() => setBoardColumns([...boardColumns, { id: crypto.randomUUID(), name: t('project_settings.new_column'), mappedStatusIds: [], defaultStatusId: '', position: boardColumns.length }])}
            className="flex items-center justify-center bg-card border border-dashed border-slate-300 p-4 rounded-2xl text-muted-foreground hover:bg-background transition-all min-h-[150px]"
          >
            <Icons.plus size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
