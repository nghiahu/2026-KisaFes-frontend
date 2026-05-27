import { Outlet } from 'react-router-dom';
import SessionExpiredModal from '../components/common/SessionExpiredModal';
import PermissionDeniedToast from '../components/common/PermissionDeniedToast';

/**
 * Root layout bao toàn bộ app.
 * Dùng để mount các component global cần router context (ví dụ: SessionExpiredModal).
 */
export default function RootLayout() {
  return (
    <>
      <Outlet />
      <SessionExpiredModal />
      <PermissionDeniedToast />
    </>
  );
}
