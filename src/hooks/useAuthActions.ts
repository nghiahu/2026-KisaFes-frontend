import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { loginSuccess, setRegistrationData, clearRegistrationData } from '../store/slices/authSlice';
import type { RootState } from '../store';

export const useAuthActions = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const regData = useSelector((state: RootState) => state.auth.registrationData);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const loginUser = async (payload: any) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await authService.login(payload);
      const authData = res.data;
      // Normalize user data to fix field name mismatches (API may return fullname vs fullName)
      const rawUser = authData.user;
      const normalizedUser = {
        ...rawUser,
        fullName: rawUser.fullName || rawUser.fullname || rawUser.full_name || '',
        userName: rawUser.userName || rawUser.username || rawUser.user_name || '',
        avatar: rawUser.avatar || rawUser.avatarUrl || rawUser.avatar_url || null,
      };
      // Block admin accounts from User portal
      if (!normalizedUser.roles.includes('USER')) {
        throw new Error('Tài khoản không có quyền truy cập trang User.');
      }

      dispatch(loginSuccess({
        user: normalizedUser,
        token: authData.accessToken,
      }));
      navigate('/');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Invalid credentials');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const registerInit = async (data: any) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const checkRes = await authService.checkEmail(data.email);
      if (checkRes.data) {
        setErrorMsg('Email already exists');
        return false;
      }
      await authService.sendOtp(data.email);
      dispatch(setRegistrationData({
        fullName: data.fullName,
        email: data.email,
        password: data.password,
      }));
      navigate('/signup/otp');
      return true;
    } catch (err: any) {
      setErrorMsg(err?.message || 'Something went wrong');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (email: string, otpValue: string, onExpired: () => void) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await authService.verifyOtp(email, otpValue);
      const verifyToken = res.data;
      dispatch(setRegistrationData({ verifyToken }));
      navigate('/signup/profile');
    } catch (err: any) {
      const responseMessage = err?.response?.data?.message || err?.message || 'Mã OTP không hợp lệ.';
      const expiredIndicators = ['expired', 'hết hạn', 'invalid or expired', 'token'];
      const isExpired =
        err?.response?.status === 401 ||
        err?.response?.status === 403 ||
        expiredIndicators.some((keyword) => responseMessage.toLowerCase().includes(keyword));

      if (isExpired) {
        onExpired();
        setErrorMsg('Mã xác thực đã hết hạn. Bạn sẽ được chuyển về trang đăng ký.');
        dispatch(clearRegistrationData());
      } else {
        setErrorMsg(responseMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async (email: string, onSuccess: () => void) => {
    setLoading(true);
    setErrorMsg('');
    try {
      await authService.sendOtp(email);
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Gửi lại mã thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const completeProfile = async (
    username: string, 
    bio: string, 
    avatarFile: File | null, 
    isSkip: boolean,
    onExpired: () => void
  ) => {
    if (!regData) return;
    setLoading(true);
    setErrorMsg('');

    try {
      let avatarUrl = "";
      if (!isSkip && avatarFile) {
        const uploadRes = await authService.uploadAvatar(avatarFile);
        avatarUrl = uploadRes.data;
      }

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
      const errorMessage = err?.message || "Registration failed.";
      if (err?.response?.status === 401 || err?.response?.status === 403 || errorMessage.includes("token") || errorMessage.includes("expired")) {
        setErrorMsg("Quá thời gian xác thực, vui lòng đăng ký lại.");
        onExpired();
      } else {
        setErrorMsg(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };
  
  const sendResetPasswordOtp = async (email: string) => {
  setLoading(true);
  setErrorMsg('');

  try {
    await authService.sendResetPasswordOtp(email);
    return true;
  } catch (err: any) {
    setErrorMsg(
      err?.response?.data?.message ||
      err?.message ||
      'Gửi OTP thất bại.'
    );
    return false;
  } finally {
    setLoading(false);
  }
};

  const verifyResetPasswordOtp = async (
    email: string,
    otp: string
  ) => {
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await authService.verifyResetPasswordOtp(email, otp);

      // token reset password backend trả về
      return res.data;
    } catch (err: any) {
      setErrorMsg(
        err?.response?.data?.message ||
        err?.message ||
        'OTP không hợp lệ.'
      );

      throw err;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (
    email: string,
    token: string,
    newPassword: string
  ) => {
    setLoading(true);
    setErrorMsg('');

    try {
      await authService.resetPassword({
        email,
        token,
        newPassword,
      });

      navigate('/login');

      return true;
    } catch (err: any) {
      setErrorMsg(
        err?.response?.data?.message ||
        err?.message ||
        'Đổi mật khẩu thất bại.'
      );

      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    errorMsg,
    setErrorMsg,
    loginUser,
    registerInit,
    verifyOtp,
    resendOtp,
    completeProfile,
    sendResetPasswordOtp,
    verifyResetPasswordOtp,
    resetPassword
  };
};
