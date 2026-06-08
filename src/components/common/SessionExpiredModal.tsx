import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import { sessionExpiredEvent } from '../../utils/session-expired-event';
import ConfirmModal from './ConfirmModal';
import { useNavigate } from 'react-router-dom';

export default function SessionExpiredModal() {
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const unsubscribe = sessionExpiredEvent.subscribe(() => {
      setVisible(true);
    });
    return unsubscribe;
  }, []);

  const handleConfirm = () => {
    setVisible(false);
    dispatch(logout());
    navigate('/login');
  };

  return (
    <ConfirmModal
      isOpen={visible}
      title="Phiên đăng nhập đã hết hạn"
      message="Phiên làm việc của bạn đã hết hạn do không hoạt động hoặc đăng nhập từ nơi khác. Vui lòng đăng nhập lại để tiếp tục."
      confirmText="Đăng nhập lại"
      onConfirm={handleConfirm}
      onClose={() => { }}
      showCancel={false}
      isDestructive={true}
    />
  );
}
