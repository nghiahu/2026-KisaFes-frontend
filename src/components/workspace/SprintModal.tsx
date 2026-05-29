import { useState } from 'react';
import { Icons } from '../../assets/icons';
import { sprintService, type Sprint, type SprintCreateRequest } from '../../services/sprint.service';

interface SprintModalProps {
  projectId: string;
  sprint?: Sprint | null;
  onClose: () => void;
  onSuccess: (sprint: Sprint) => void;
}

export default function SprintModal({ projectId, sprint, onClose, onSuccess }: SprintModalProps) {
  const isEdit = !!sprint;
  const [name, setName] = useState(sprint?.name || '');
  const [goal, setGoal] = useState(sprint?.goal || '');
  const [startDate, setStartDate] = useState(sprint?.startDate?.substring(0, 10) || '');
  const [endDate, setEndDate] = useState(sprint?.endDate?.substring(0, 10) || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Tên sprint không được để trống'); return; }
    if (startDate && endDate && startDate >= endDate) {
      setError('Ngày bắt đầu phải trước ngày kết thúc');
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      const payload: SprintCreateRequest = {
        name: name.trim(),
        goal: goal.trim() || undefined,
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
      };
      let result: Sprint;
      if (isEdit && sprint) {
        result = await sprintService.updateSprint(projectId, sprint.id, payload);
      } else {
        result = await sprintService.createSprint(projectId, payload);
      }
      onSuccess(result);
    } catch (e: any) {
      setError(e?.message || 'Có lỗi xảy ra');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-violet-50 to-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center">
              <Icons.zap size={15} className="text-violet-600" />
            </div>
            <h2 className="text-base font-black text-slate-800">{isEdit ? 'Chỉnh sửa Sprint' : 'Tạo Sprint mới'}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition-colors">
            <Icons.x size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          {/* Sprint name */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Tên Sprint <span className="text-rose-500">*</span></label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Sprint 1, Sprint 2..."
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 font-semibold"
              autoFocus
            />
          </div>

          {/* Goal */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Sprint Goal</label>
            <textarea
              value={goal}
              onChange={e => setGoal(e.target.value)}
              placeholder="Mục tiêu của sprint này..."
              rows={2}
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 font-semibold resize-none"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Ngày bắt đầu</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Ngày kết thúc</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 font-semibold"
              />
            </div>
          </div>

          {error && <p className="text-xs text-rose-600 font-semibold bg-rose-50 px-3 py-2 rounded-lg">{error}</p>}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-black transition-colors disabled:bg-violet-300"
            >
              {isSubmitting ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Tạo Sprint'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl text-sm font-bold transition-colors"
            >
              Hủy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
