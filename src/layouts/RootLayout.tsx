import { Outlet } from 'react-router-dom';
import SessionExpiredModal from '../components/common/SessionExpiredModal';
import PermissionDeniedToast from '../components/common/PermissionDeniedToast';
import { Toaster } from '@/components/ui/Sonner';

/**
 * Root layout bao toàn bộ app.
 * Dùng để mount các component global cần router context (ví dụ: SessionExpiredModal).
 */
export default function RootLayout() {
  return (
    <>
      <Outlet />
      <Toaster position="top-center" richColors />
      <SessionExpiredModal />
      <PermissionDeniedToast />
    </>
  );
}
