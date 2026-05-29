import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import { sessionExpiredEvent } from '../../utils/session-expired-event';

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

  if (!visible) return null;

  const handleConfirm = () => {
    setVisible(false);
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="session-expired-overlay" onClick={handleConfirm}>
      <div
        className="session-expired-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        <div className="session-expired-icon">
          <svg
            width="48"
            height="48"
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="24" cy="24" r="22" stroke="#f59e0b" strokeWidth="3" fill="#fef3c7" />
            <path
              d="M24 14v12"
              stroke="#f59e0b"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle cx="24" cy="32" r="2" fill="#f59e0b" />
          </svg>
        </div>

        {/* Title */}
        <h2 className="session-expired-title">Phiên đăng nhập đã hết hạn</h2>

        {/* Message */}
        <p className="session-expired-message">
          Vui lòng đăng nhập lại để tiếp tục sử dụng.
        </p>

        {/* Button */}
        <button
          className="session-expired-btn"
          onClick={handleConfirm}
          id="session-expired-confirm-btn"
        >
          Đăng nhập lại
        </button>
      </div>
    </div>
  );
}
