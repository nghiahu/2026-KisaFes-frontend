import { useState } from 'react';
import { ArchiveRestore, X } from 'lucide-react';
import { sprintService, type Sprint } from '../../services/sprint.service';



import type { CompleteSprintModalProps } from '../../types/components.interface';
export default function CompleteSprintModal({ projectId, sprint, sprints, onClose, onSuccess }: CompleteSprintModalProps) {
  const [isCompleting, setIsCompleting] = useState(false);
  const incompleteTasks = sprint.totalTasks - sprint.completedTasks;

  const handleComplete = async () => {
    setIsCompleting(true);
    try {
      await sprintService.completeSprint(projectId, sprint.id, undefined);
      onSuccess();
    } catch (e: any) {
      console.error('Failed to complete sprint', e);
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-gradient-to-r from-emerald-50 to-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
              <ArchiveRestore size={15} className="text-emerald-600" />
            </div>
            <h2 className="text-base font-black text-foreground">Hoàn thành Sprint</h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-4">
          {/* Sprint info */}
          <div className="bg-violet-50 border border-violet-100 rounded-xl p-4">
            <p className="text-sm font-black text-foreground">{sprint.name}</p>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                {sprint.completedTasks} hoàn thành
              </span>
              <span className="text-xs font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                {incompleteTasks} chưa xong
              </span>
            </div>
          </div>

          {/* Incomplete task migration */}
          {incompleteTasks > 0 && (
            <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-3 flex gap-3 items-start">
              <ArchiveRestore size={16} className="text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  <span className="text-amber-600 font-bold">{incompleteTasks} nhiệm vụ</span> chưa hoàn thành sẽ được chuyển về Backlog.
                </p>
                <p className="text-[10px] text-muted-foreground font-semibold mt-1">
                  Các task đã Done sẽ được giữ lại trong sprint này.
                </p>
              </div>
            </div>
          )}

          {incompleteTasks === 0 && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-sm text-emerald-700 font-semibold">
              🎉 Tất cả task đã hoàn thành! Sprint sẽ được đóng lại.
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleComplete}
              disabled={isCompleting}
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-black transition-colors disabled:bg-emerald-300"
            >
              {isCompleting ? 'Đang hoàn thành...' : 'Hoàn thành Sprint'}
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-muted-foreground hover:bg-muted rounded-xl text-sm font-bold transition-colors"
            >
              Hủy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
