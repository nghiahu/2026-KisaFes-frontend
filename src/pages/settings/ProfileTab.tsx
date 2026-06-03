import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { UpdateProfilePayload } from '../../services/userService';
import { useAppDispatch } from '../../store/hooks';
import { useUserProfileQuery, useUpdateUserProfileMutation } from '../../hooks/api/useUser';
import { authService } from '../../services/auth.service';
import defaultAvatar from '../../assets/avatar_def_man.png';
import type { User } from '../../types/user.interface';
import { loginSuccess } from '../../store/slices/authSlice';
import { useLanguage } from '../../contexts/LanguageContext';

const profileSchema = z.object({
  fullName: z.string().min(1, 'Họ và tên không được để trống'),
  userName: z.string().min(3, 'Tên người dùng phải có ít nhất 3 ký tự'),
  bio: z.string().max(500, 'Giới thiệu tối đa 500 ký tự').optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfileTab() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dispatch = useAppDispatch();

  const { data: apiUser, isLoading: isProfileLoading } = useUserProfileQuery();
  const updateProfileMutation = useUpdateUserProfileMutation();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
  });

  const bioValue = watch('bio') || '';

  useEffect(() => {
    if (apiUser) {
      const mappedUser: User = {
        id: apiUser.id,
        email: apiUser.email,
        fullName: apiUser.fullName,
        userName: apiUser.userName,
        avatar: apiUser.avatar,
        bio: apiUser.bio,
        isPublic: apiUser.isPublic,
        roles: []
      };

      setUser(mappedUser);
      setIsPublic(apiUser.isPublic ?? false);
      setAvatarPreview(apiUser.avatar || null);

      reset({
        fullName: apiUser.fullName,
        userName: apiUser.userName,
        bio: apiUser.bio || '',
      });
      setLoading(false);
    } else if (!isProfileLoading) {
      setLoading(false);
    }
  }, [apiUser, isProfileLoading, reset]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Kích thước ảnh tối đa là 5MB');
      return;
    }

    try {
      setUploadingAvatar(true);
      setErrorMsg('');
      const response = await authService.uploadAvatar(file);
      const responseData = response as any;
      const url = responseData.data as string;
      setAvatarPreview(url);
    } catch (err) {
      setErrorMsg('Lỗi khi tải ảnh lên. Vui lòng thử lại.');
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      setSaving(true);
      setErrorMsg('');
      setSuccessMsg('');

      const payload: UpdateProfilePayload = {
        fullName: data.fullName,
        userName: data.userName,
        bio: data.bio,
        isPublic,
        avatar: avatarPreview,
      };

      const updatedApiUser = await updateProfileMutation.mutateAsync(payload);

      const mappedUpdatedUser: User = {
        id: updatedApiUser.id,
        email: updatedApiUser.email,
        fullName: updatedApiUser.fullName,
        userName: updatedApiUser.userName,
        avatar: updatedApiUser.avatar,
        bio: updatedApiUser.bio,
        isPublic: updatedApiUser.isPublic,
        roles: []
      };

      setUser(mappedUpdatedUser);
      setSuccessMsg(t('settings.profile.success'));
      localStorage.setItem('user', JSON.stringify(mappedUpdatedUser));
      dispatch(loginSuccess({ user: mappedUpdatedUser, token: localStorage.getItem('token') || '' }));

      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || t('settings.profile.error'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

      {/* Left Column - Avatar Card */}
      <div className="lg:col-span-1">
        <div className="bg-card rounded-2xl p-6 shadow-sm border border-border flex flex-col items-center text-center dark:bg-slate-800 dark:border-slate-700">
          <div className="relative mb-4 group">
            <div className="h-32 w-32 rounded-full overflow-hidden border-4 border-white shadow-lg bg-muted dark:border-slate-700 dark:bg-slate-700">
              {uploadingAvatar ? (
                <div className="h-full w-full flex items-center justify-center bg-muted dark:bg-slate-700">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <img
                  src={avatarPreview || defaultAvatar}
                  alt="Avatar"
                  className="h-full w-full object-cover"
                />
              )}
            </div>
          </div>

          <h2 className="text-xl font-bold text-foreground dark:text-white">{user?.fullName}</h2>
          {bioValue && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2 dark:text-muted-foreground">{bioValue}</p>
          )}

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleAvatarChange}
            accept="image/*"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingAvatar}
            className="mt-6 w-full py-2.5 px-4 border border-border rounded-xl text-sm font-semibold text-foreground hover:bg-background transition-colors disabled:opacity-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            {t('settings.profile.upload_avatar')}
          </button>
        </div>
      </div>

      {/* Right Column - Forms */}
      <div className="lg:col-span-2 space-y-6">

        {errorMsg && (
          <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="p-4 bg-green-50 text-green-600 rounded-xl text-sm border border-green-100 dark:bg-green-900/30 dark:border-green-800 dark:text-green-400">
            {successMsg}
          </div>
        )}

        {/* Basic Info Form */}
        <div className="bg-card rounded-2xl shadow-sm border border-border dark:bg-slate-800 dark:border-slate-700">
          <div className="p-6 border-b border-border dark:border-slate-700">
            <h3 className="text-lg font-bold text-foreground dark:text-white">{t('settings.profile.basic_info')}</h3>
            <p className="text-sm text-muted-foreground mt-1 dark:text-muted-foreground">{t('settings.profile.basic_info.desc')}</p>
          </div>

          <div className="p-6">
            <form id="profile-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2 dark:text-slate-300">{t('settings.profile.fullname')}</label>
                  <input
                    type="text"
                    {...register('fullName')}
                    className={`w-full px-4 py-2.5 rounded-xl border ${errors.fullName ? 'border-red-500' : 'border-border dark:border-slate-600'} bg-card dark:bg-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors dark:text-white`}
                  />
                  {errors.fullName && <p className="mt-1.5 text-xs text-red-500">{errors.fullName.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2 dark:text-slate-300">{t('settings.profile.username')}</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                    <input
                      type="text"
                      {...register('userName')}
                      className={`w-full pl-8 pr-4 py-2.5 rounded-xl border ${errors.userName ? 'border-red-500' : 'border-border dark:border-slate-600'} bg-card dark:bg-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors dark:text-white`}
                    />
                  </div>
                  {errors.userName && <p className="mt-1.5 text-xs text-red-500">{errors.userName.message}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2 dark:text-slate-300">{t('settings.profile.email')}</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-muted-foreground text-sm cursor-not-allowed dark:bg-slate-800 dark:border-slate-700 dark:text-muted-foreground"
                />
                <p className="mt-2 text-xs text-muted-foreground italic dark:text-muted-foreground">{t('settings.profile.email.desc')}</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2 dark:text-slate-300">{t('settings.profile.bio')}</label>
                <textarea
                  {...register('bio')}
                  rows={4}
                  className={`w-full px-4 py-3 rounded-xl border ${errors.bio ? 'border-red-500' : 'border-border dark:border-slate-600'} bg-card dark:bg-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors resize-none dark:text-white`}
                  placeholder={t('settings.profile.bio.placeholder')}
                ></textarea>
                <div className="flex justify-between items-center mt-1.5">
                  {errors.bio ? (
                    <p className="text-xs text-red-500">{errors.bio.message}</p>
                  ) : <div></div>}
                  <p className="text-xs text-muted-foreground text-right">{bioValue.length} / 500 ký tự</p>
                </div>
              </div>
            </form>
          </div>

          <div className="px-6 py-4 border-t border-border bg-background/50 flex justify-end gap-3 rounded-b-2xl dark:border-slate-700 dark:bg-slate-800/50">
            <button
              type="button"
              onClick={() => {
                reset({
                  fullName: user?.fullName,
                  userName: user?.userName,
                  bio: user?.bio || '',
                });
                setIsPublic(user?.isPublic ?? false);
                setAvatarPreview(user?.avatar || null);
              }}
              className="px-5 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-muted rounded-xl transition-colors dark:text-slate-300 dark:hover:bg-slate-700"
            >
              {t('settings.profile.cancel')}
            </button>
            <button
              form="profile-form"
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
              {t('settings.profile.save')}
            </button>
          </div>
        </div>

        {/* Privacy Card */}
        <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden dark:bg-slate-800 dark:border-slate-700">
          <div className="p-6 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-foreground dark:text-white">{t('settings.profile.privacy')}</h3>
              <p className="text-sm text-muted-foreground mt-1 dark:text-muted-foreground">{t('settings.profile.privacy.desc')}</p>
            </div>

            {/* Toggle Switch */}
            <button
              type="button"
              role="switch"
              aria-checked={isPublic}
              onClick={() => setIsPublic(!isPublic)}
              className={`${isPublic ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-600'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2`}
            >
              <span className="sr-only">Chế độ công khai</span>
              <span className={`${isPublic ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-card shadow ring-0 transition duration-200 ease-in-out`}></span>
            </button>
          </div>

          <div className="px-6 pb-6">
            <div className="bg-background rounded-xl p-4 flex gap-4 dark:bg-slate-700/50">
              <div className="mt-0.5 text-blue-600 dark:text-blue-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground dark:text-white">{t('settings.profile.public_mode')}</h4>
                <p className="text-xs text-muted-foreground mt-1 dark:text-muted-foreground">{t('settings.profile.public_mode.desc')}</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
