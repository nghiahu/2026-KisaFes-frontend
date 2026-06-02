import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Icons } from '../../../assets/icons';
import { teamService } from '../../../services/team.service';
import { authService } from '../../../services/auth.service';
import type { Team } from '../../../types/team.interface';

const editTeamSchema = z.object({
  name: z.string().min(1, 'Team name is required'),
  description: z.string().optional()
});

interface EditTeamFormValues {
  name: string;
  description?: string;
}

interface TeamSettingsProps {
  team: Team;
  onUpdate: (updatedTeam: Team) => void;
  onClose: () => void;
}

export default function TeamSettings({ team, onUpdate, onClose }: TeamSettingsProps) {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<EditTeamFormValues>({
    resolver: zodResolver(editTeamSchema),
    defaultValues: { name: team.name, description: team.description || '' }
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [avatarPreview, setAvatarPreview] = useState<string | null>(team.avatar || null);
  const [coverPreview, setCoverPreview] = useState<string | null>(team.coverImage || null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  useEffect(() => {
    reset({ name: team.name, description: team.description || '' });
    setAvatarPreview(team.avatar || null);
    setCoverPreview(team.coverImage || null);
  }, [team, reset]);

  const onSubmit = async (data: EditTeamFormValues) => {
    try {
      setIsSubmitting(true);
      setError(null);
      setSuccess(false);

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

      const updated = await teamService.updateTeam(team.id, payload);
      onUpdate(updated);
      setSuccess(true);
      
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update team settings');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-20">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Team Settings</h2>
          <p className="text-sm text-slate-500 mt-1">Manage team profile, preferences, and identity.</p>
        </div>
        <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors">
          <Icons.x size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto w-full px-8 py-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Images Section */}
            <div className="relative mb-16">
          {/* Cover */}
          <label className="block w-full h-32 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-colors cursor-pointer overflow-hidden group relative">
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
              <img src={coverPreview} className="w-full h-full object-cover group-hover:opacity-75 transition-opacity" />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 group-hover:text-blue-500">
                <Icons.image size={24} className="mb-2" />
                <span className="text-xs font-semibold">Upload Cover Image</span>
              </div>
            )}
            {coverPreview && (
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="px-3 py-1.5 bg-slate-900/60 backdrop-blur-sm text-white text-xs font-bold rounded-lg flex items-center gap-2">
                  <Icons.camera size={14} /> Change Cover
                </div>
              </div>
            )}
          </label>

          {/* Avatar */}
          <label className="absolute -bottom-6 left-6 w-20 h-20 bg-white rounded-xl shadow-sm border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-colors cursor-pointer overflow-hidden group z-10 flex items-center justify-center">
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
              <img src={avatarPreview} className="w-full h-full object-cover group-hover:opacity-75 transition-opacity" />
            ) : (
              <Icons.camera size={24} className="text-slate-400 group-hover:text-blue-500" />
            )}
            {avatarPreview && (
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-8 h-8 bg-slate-900/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white">
                  <Icons.camera size={14} />
                </div>
              </div>
            )}
          </label>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Team Name</label>
          <input
            type="text"
            className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${errors.name ? 'border-rose-500 focus:ring-rose-500/20' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/20'}`}
            {...register('name')}
          />
          {errors.name && <p className="text-rose-500 text-xs mt-1 font-medium">{errors.name.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Description</label>
          <textarea
            rows={4}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
            {...register('description')}
          />
        </div>

        {error && (
          <div className="p-3 bg-rose-50 text-rose-600 text-sm font-medium rounded-xl flex items-center gap-2 border border-rose-100">
            <Icons.alertTriangle size={16} />
            {error}
          </div>
        )}

          {success && (
            <div className="p-4 bg-emerald-50 text-emerald-700 text-sm font-semibold rounded-xl flex items-center gap-2 border border-emerald-100">
              <Icons.check size={18} />
              Team settings updated successfully!
            </div>
          )}

          <div className="pt-6 border-t border-slate-100 flex items-center justify-between mt-8">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-blue-600/20"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}
