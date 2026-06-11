import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Icons } from '../../assets/icons';
import type { CreateTeamPayload } from '../../types/team.interface';
import { teamService } from '../../services/team.service';
import { authService } from '../../services/auth.service';
import { useLanguage } from '../../contexts/LanguageContext';

import { Button } from '@/components/ui/Button';
import type { CreateTeamModalProps } from '../../types/components.interface';
const createTeamSchema = z.object({
  name: z.string().min(1, 'Team name is required'),
  description: z.string().optional()
});



export default function CreateTeamModal({ onClose, onSuccess }: CreateTeamModalProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<CreateTeamPayload>({
    resolver: zodResolver(createTeamSchema),
    defaultValues: { name: '', description: '' }
  });

  const { t } = useLanguage();
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
      <div className="bg-card w-full max-w-lg rounded-2xl shadow-xl border border-border overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
              <Icons.users size={20} />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-lg">{t('teams.create_new')}</h3>
              <p className="text-sm text-muted-foreground">{t('teams.create_desc')}</p>
            </div>
          </div>
          <Button 
            onClick={onClose}
            className="text-muted-foreground hover:text-muted-foreground p-2 rounded-xl hover:bg-muted transition-colors"
          >
            <Icons.x size={20} />
          </Button>
        </div>

        <div className="p-6">
          <form id="create-team-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            
            {/* Images Section */}
            <div className="relative mb-8">
              {/* Cover */}
              <label className="block w-full h-28 bg-background rounded-xl border-2 border-dashed border-border hover:border-blue-400 hover:bg-primary/10/50 transition-colors cursor-pointer overflow-hidden group relative">
                <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.size > 5 * 1024 * 1024) {
                      setError(t('teams.err_cover_size'));
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
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground group-hover:text-primary">
                    <Icons.image size={24} className="mb-2" />
                    <span className="text-xs font-semibold">{t('teams.upload_cover')}</span>
                  </div>
                )}
              </label>

              {/* Avatar */}
              <label className="absolute -bottom-5 left-6 w-16 h-16 bg-card rounded-xl shadow-sm border border-border hover:border-blue-400 hover:bg-primary/10/50 transition-colors cursor-pointer overflow-hidden group z-10 flex items-center justify-center">
                <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.size > 5 * 1024 * 1024) {
                      setError(t('teams.err_avatar_size'));
                      return;
                    }
                    setAvatarFile(file);
                    setAvatarPreview(URL.createObjectURL(file));
                    setError(null);
                  }
                }} />
                {avatarPreview ? (
                  <img  src={avatarPreview} className="w-full h-full object-cover" />
                ) : (
                  <Icons.camera size={20} className="text-muted-foreground group-hover:text-primary" />
                )}
              </label>
            </div>

            <div className="pt-2">
              <label className="block text-sm font-semibold text-foreground mb-1.5">{t('teams.team_name')}</label>
              <input
                type="text"
                placeholder={t('teams.name_placeholder')}
                className={`w-full px-4 py-2.5 bg-background border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${errors.name ? 'border-rose-500 focus:ring-rose-500/20' : 'border-border focus:border-primary focus:ring-primary/20'}`}
                {...register('name')}
              />
              {errors.name && <p className="text-destructive text-xs mt-1 font-medium">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">{t('teams.description')}</label>
              <textarea
                placeholder={t('teams.desc_placeholder')}
                rows={3}
                className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
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

        <div className="px-6 py-4 border-t border-border bg-background/50 flex items-center justify-end gap-3">
          <Button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors"
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            form="create-team-form"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-blue-600/20"
          >
            {isSubmitting ? t('teams.creating') : t('teams.create_team')}
          </Button>
        </div>
      </div>
    </div>
  );
}
