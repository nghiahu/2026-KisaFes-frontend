import { useState, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { authService } from "../../services/auth.service";
import { clearRegistrationData } from "../../store/slices/authSlice";
import type { RootState } from "../../store";

export default function ProfileUpdateForm() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const regData = useSelector((state: RootState) => state.auth.registrationData);

  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!regData || !regData.email || !regData.verifyToken) {
      navigate('/signup');
      return;
    }
    // Set default username from email
    if (!username) {
      setUsername(regData.email.split('@')[0]);
    }
  }, [regData, navigate]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleRegister = async (isSkip: boolean) => {
    if (!regData) return;
    setLoading(true);
    setErrorMsg("");

    try {
      let avatarUrl = "";
      if (!isSkip && avatarFile) {
        // Upload image
        const uploadRes = await authService.uploadAvatar(avatarFile);
        avatarUrl = uploadRes.data;
      }

      // Check username if user changed it
      const finalUsername = isSkip ? regData.email!.split('@')[0] : username;
      const checkUserRes = await authService.checkUsername(finalUsername);
      if (checkUserRes.data) {
         setErrorMsg("Username already exists. Please choose another one.");
         setLoading(false);
         return;
      }

      await authService.register({
        fullName: regData.fullName,
        email: regData.email,
        password: regData.password,
        verifyToken: regData.verifyToken,
        username: finalUsername,
        bio: isSkip ? "" : bio,
        avatar: avatarUrl
      });

      dispatch(clearRegistrationData());
      navigate('/login');
    } catch (err: any) {
      setErrorMsg(err?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  const nameInitial = regData?.fullName ? regData.fullName.substring(0, 2).toUpperCase() : "NN";

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-3xl rounded-[32px] bg-white p-8 shadow-[0_30px_60px_rgba(15,23,42,0.12)] sm:p-10">
        <div className="flex flex-col gap-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">Cập nhật hồ sơ cá nhân</p>
            </div>
          </div>
          
          {errorMsg && <div className="p-3 bg-red-100 text-red-600 text-sm rounded-lg">{errorMsg}</div>}

          <div className="grid grid-cols-1 gap-6 rounded-[24px] border border-slate-200 bg-slate-50 p-6 sm:grid-cols-[100px_1fr]">
            <div className="flex items-center justify-center">
              <div 
                className="relative flex h-24 w-24 items-center justify-center rounded-full bg-blue-600 text-2xl font-semibold text-white overflow-hidden cursor-pointer"
                onClick={handleAvatarClick}
              >
                {avatarPreview ? (
                   <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                   nameInitial
                )}
                <button
                  type="button"
                  className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-white text-blue-600 shadow-sm ring-1 ring-slate-200"
                >
                  +
                </button>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/*" 
              />
            </div>
            <div className="space-y-3">
              <p className="text-sm text-slate-500">
                Thay đổi ảnh đại diện và thông tin hiển thị của bạn.
              </p>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Tên công khai
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="@tennguoidung"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Tiểu sử
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={5}
                placeholder="Giới thiệu ngắn gọn về bản thân..."
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mt-4">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleRegister(true)}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Thiết lập sau
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleRegister(false)}
              className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Đang xử lý...' : 'Hoàn tất Đăng ký'}
              <span className="ml-2">→</span>
            </button>
          </div>

          <p className="text-center text-xs text-slate-400">
            Dữ liệu cá nhân của bạn được bảo mật theo chuẩn doanh nghiệp.
          </p>
        </div>
      </div>
    </div>
  );
}
