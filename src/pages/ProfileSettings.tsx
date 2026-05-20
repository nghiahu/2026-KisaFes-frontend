import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch } from 'react-redux';
import type { UpdateProfilePayload } from '../services/userService';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchProfile, updateProfile } from '../store/slices/userSlice';
import { authService } from '../services/auth.service';
import defaultAvatar from '../assets/avatar_def_man.png';
import type { User } from '../types/user.interface';
import { loginSuccess } from '../store/slices/authSlice';

const profileSchema = z.object({
  fullName: z.string().min(1, 'Họ và tên không được để trống'),
  userName: z.string().min(3, 'Tên người dùng phải có ít nhất 3 ký tự'),
  bio: z.string().max(500, 'Giới thiệu tối đa 500 ký tự').optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfileSettings() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dispatch = useAppDispatch();
  const { profile: apiUser, loading: isProfileLoading } = useAppSelector(state => state.user);

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
    dispatch(fetchProfile());
  }, [dispatch]);

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
        roles: [] // Mặc định không dùng trong UI này
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

      const updatedApiUser = await dispatch(updateProfile(payload)).unwrap();

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
      setSuccessMsg('Cập nhật thông tin thành công!');
      localStorage.setItem('user', JSON.stringify(mappedUpdatedUser));
      dispatch(loginSuccess({ user: mappedUpdatedUser, token: localStorage.getItem('token') || '' })); // Assuming we can just update the user part

      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Có lỗi xảy ra khi lưu thông tin');
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
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col items-center text-center">
          <div className="relative mb-4 group">
            <div className="h-32 w-32 rounded-full overflow-hidden border-4 border-white shadow-lg bg-slate-100">
              {uploadingAvatar ? (
                <div className="h-full w-full flex items-center justify-center bg-slate-100">
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

          <h2 className="text-xl font-bold text-slate-900">{user?.fullName}</h2>
          {bioValue && (
            <p className="text-sm text-slate-500 mt-1 line-clamp-2">{bioValue}</p>
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
            className="mt-6 w-full py-2.5 px-4 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Tải ảnh mới
          </button>
        </div>
      </div>

      {/* Right Column - Forms */}
      <div className="lg:col-span-2 space-y-6">

        {errorMsg && (
          <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="p-4 bg-green-50 text-green-600 rounded-xl text-sm border border-green-100">
            {successMsg}
          </div>
        )}

        {/* Basic Info Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-900">Thông tin cơ bản</h3>
            <p className="text-sm text-slate-500 mt-1">Cập nhật thông tin định danh của bạn trong hệ thống.</p>
          </div>

          <div className="p-6">
            <form id="profile-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Họ và Tên</label>
                  <input
                    type="text"
                    {...register('fullName')}
                    className={`w-full px-4 py-2.5 rounded-xl border ${errors.fullName ? 'border-red-500' : 'border-slate-200'} bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors`}
                  />
                  {errors.fullName && <p className="mt-1.5 text-xs text-red-500">{errors.fullName.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Tên người dùng</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">@</span>
                    <input
                      type="text"
                      {...register('userName')}
                      className={`w-full pl-8 pr-4 py-2.5 rounded-xl border ${errors.userName ? 'border-red-500' : 'border-slate-200'} bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors`}
                    />
                  </div>
                  {errors.userName && <p className="mt-1.5 text-xs text-red-500">{errors.userName.message}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Địa chỉ Email</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-sm cursor-not-allowed"
                />
                <p className="mt-2 text-xs text-slate-500 italic">Vui lòng liên hệ quản trị viên để thay đổi email tổ chức.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Giới thiệu bản thân (Bio)</label>
                <textarea
                  {...register('bio')}
                  rows={4}
                  className={`w-full px-4 py-3 rounded-xl border ${errors.bio ? 'border-red-500' : 'border-slate-200'} bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors resize-none`}
                  placeholder="Tôi là một Product Designer đam mê xây dựng những công cụ giúp tăng hiệu suất làm việc cho các nhóm công nghệ."
                ></textarea>
                <div className="flex justify-between items-center mt-1.5">
                  {errors.bio ? (
                    <p className="text-xs text-red-500">{errors.bio.message}</p>
                  ) : <div></div>}
                  <p className="text-xs text-slate-400 text-right">{bioValue.length} / 500 ký tự</p>
                </div>
              </div>
            </form>
          </div>

          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3 rounded-b-2xl">
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
              className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              form="profile-form"
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
              Lưu thay đổi
            </button>
          </div>
        </div>

        {/* Privacy Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Quyền riêng tư</h3>
              <p className="text-sm text-slate-500 mt-1">Kiểm soát ai có thể nhìn thấy hồ sơ của bạn.</p>
            </div>

            {/* Toggle Switch */}
            <button
              type="button"
              role="switch"
              aria-checked={isPublic}
              onClick={() => setIsPublic(!isPublic)}
              className={`${isPublic ? 'bg-blue-600' : 'bg-slate-200'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2`}
            >
              <span className="sr-only">Chế độ công khai</span>
              <span className={`${isPublic ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}></span>
            </button>
          </div>

          <div className="px-6 pb-6">
            <div className="bg-slate-50 rounded-xl p-4 flex gap-4">
              <div className="mt-0.5 text-blue-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-900">Chế độ công khai</h4>
                <p className="text-xs text-slate-500 mt-1">Mọi người trong tổ chức có thể tìm thấy bạn qua tìm kiếm.</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
