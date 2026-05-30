import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Icons } from '../../assets/icons';
import { sprintService, type Sprint, type SprintCreateRequest } from '../../services/sprint.service';

interface SprintModalProps {
  projectId: string;
  sprint?: Sprint | null;
  onClose: () => void;
  onSuccess: (sprint: Sprint) => void;
}

const sprintSchema = z.object({
  name: z.string().min(1, 'Tên sprint không được để trống'),
  goal: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional()
}).refine(data => {
  if (data.startDate && data.endDate) {
    return new Date(data.startDate) <= new Date(data.endDate);
  }
  return true;
}, {
  message: 'Ngày kết thúc phải sau ngày bắt đầu',
  path: ['endDate']
});

type SprintFormValues = z.infer<typeof sprintSchema>;

export default function SprintModal({ projectId, sprint, onClose, onSuccess }: SprintModalProps) {
  const isEdit = !!sprint;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<SprintFormValues>({
    resolver: zodResolver(sprintSchema),
    defaultValues: {
      name: sprint?.name || '',
      goal: sprint?.goal || '',
      startDate: sprint?.startDate?.substring(0, 10) || '',
      endDate: sprint?.endDate?.substring(0, 10) || ''
    }
  });

  const onSubmit = async (data: SprintFormValues) => {
    setIsSubmitting(true);
    setError('');
    try {
      const payload: SprintCreateRequest = {
        name: data.name.trim(),
        goal: data.goal?.trim() || undefined,
        startDate: data.startDate ? new Date(data.startDate).toISOString() : undefined,
        endDate: data.endDate ? new Date(data.endDate).toISOString() : undefined,
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

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 flex flex-col gap-4">
          {/* Sprint name */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Tên Sprint <span className="text-rose-500">*</span></label>
            <input
              type="text"
              {...register('name')}
              placeholder="Sprint 1, Sprint 2..."
              className={`w-full px-3 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 font-semibold ${errors.name ? 'border-rose-500 focus:ring-rose-400/30 focus:border-rose-500' : 'border-slate-200 focus:ring-violet-400/30 focus:border-violet-400'}`}
              autoFocus
            />
            {errors.name && <p className="text-rose-500 text-xs mt-1 font-medium">{errors.name.message}</p>}
          </div>

          {/* Goal */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Sprint Goal</label>
            <textarea
              {...register('goal')}
              placeholder="Mục tiêu của sprint này..."
              rows={2}
              className={`w-full px-3 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 font-semibold resize-none ${errors.goal ? 'border-rose-500 focus:ring-rose-400/30 focus:border-rose-500' : 'border-slate-200 focus:ring-violet-400/30 focus:border-violet-400'}`}
            />
            {errors.goal && <p className="text-rose-500 text-xs mt-1 font-medium">{errors.goal.message}</p>}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Ngày bắt đầu</label>
              <input
                type="date"
                {...register('startDate')}
                className={`w-full px-3 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 font-semibold ${errors.startDate ? 'border-rose-500 focus:ring-rose-400/30 focus:border-rose-500' : 'border-slate-200 focus:ring-violet-400/30 focus:border-violet-400'}`}
              />
              {errors.startDate && <p className="text-rose-500 text-xs mt-1 font-medium">{errors.startDate.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Ngày kết thúc</label>
              <input
                type="date"
                {...register('endDate')}
                className={`w-full px-3 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 font-semibold ${errors.endDate ? 'border-rose-500 focus:ring-rose-400/30 focus:border-rose-500' : 'border-slate-200 focus:ring-violet-400/30 focus:border-violet-400'}`}
              />
              {errors.endDate && <p className="text-rose-500 text-xs mt-1 font-medium">{errors.endDate.message}</p>}
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
