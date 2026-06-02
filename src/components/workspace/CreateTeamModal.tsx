import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Icons } from '../../assets/icons';
import type { CreateTeamPayload } from '../../types/team.interface';
import { teamService } from '../../services/team.service';
import { authService } from '../../services/auth.service';

const createTeamSchema = z.object({
  name: z.string().min(1, 'Team name is required'),
  description: z.string().optional()
});

interface CreateTeamModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateTeamModal({ onClose, onSuccess }: CreateTeamModalProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<CreateTeamPayload>({
    resolver: zodResolver(createTeamSchema),
    defaultValues: { name: '', description: '' }
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  const onSubmit = async (data: CreateTeamPayload) => {
    try {
      setIsSubmitting(true);
      setError(null);

      let finalAvatar = avatarPreview;
      let finalCover = coverPreview;

      if (avatarFile) {
        const uploadRes: any = await authService.uploadAvatar(avatarFile);
        finalAvatar = uploadRes.data || uploadRes;
      }
      if (coverFile) {
        const uploadRes: any = await authService.uploadAvatar(coverFile);
        finalCover = uploadRes.data || uploadRes;
      }

      const payload = {
        ...data,
        avatar: finalAvatar || undefined,
        coverImage: finalCover || undefined
      };
      await teamService.createTeam(payload);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create team');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
              <Icons.users size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Create new team</h3>
              <p className="text-sm text-slate-500">Group people to work on projects together.</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <Icons.x size={20} />
          </button>
        </div>

        <div className="p-6">
          <form id="create-team-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            
            {/* Images Section */}
            <div className="relative mb-8">
              {/* Cover */}
              <label className="block w-full h-28 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-colors cursor-pointer overflow-hidden group relative">
                <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.size > 5 * 1024 * 1024) {
                      setError('Kích thước ảnh bìa tối đa là 5MB');
                      return;
                    }
                    setCoverFile(file);
                    setCoverPreview(URL.createObjectURL(file));
                    setError(null);
                  }
                }} />
                {coverPreview ? (
                  <img src={coverPreview} className="w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 group-hover:text-blue-500">
                    <Icons.image size={24} className="mb-2" />
                    <span className="text-xs font-semibold">Upload Cover Image</span>
                  </div>
                )}
              </label>

              {/* Avatar */}
              <label className="absolute -bottom-5 left-6 w-16 h-16 bg-white rounded-xl shadow-sm border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-colors cursor-pointer overflow-hidden group z-10 flex items-center justify-center">
                <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.size > 5 * 1024 * 1024) {
                      setError('Kích thước ảnh đại diện tối đa là 5MB');
                      return;
                    }
                    setAvatarFile(file);
                    setAvatarPreview(URL.createObjectURL(file));
                    setError(null);
                  }
                }} />
                {avatarPreview ? (
                  <img src={avatarPreview} className="w-full h-full object-cover" />
                ) : (
                  <Icons.camera size={20} className="text-slate-400 group-hover:text-blue-500" />
                )}
              </label>
            </div>

            <div className="pt-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Team Name</label>
              <input
                type="text"
                placeholder="e.g. Frontend Guild"
                className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${errors.name ? 'border-rose-500 focus:ring-rose-500/20' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/20'}`}
                {...register('name')}
              />
              {errors.name && <p className="text-rose-500 text-xs mt-1 font-medium">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Description</label>
              <textarea
                placeholder="What is this team working on?"
                rows={3}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
                {...register('description')}
              />
            </div>

            {error && (
              <div className="p-3 bg-rose-50 text-rose-600 text-sm font-medium rounded-xl flex items-center gap-2 border border-rose-100">
                <Icons.alertCircle size={16} />
                {error}
              </div>
            )}
          </form>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="create-team-form"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-blue-600/20"
          >
            {isSubmitting ? 'Creating...' : 'Create Team'}
          </button>
        </div>
      </div>
    </div>
  );
}
