import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import type { User } from '../../types/user.interface';
import defaultAvatar from '../../assets/avatar_def_man.png';
import { logout } from '../../store/slices/authSlice';
import { authService } from '../../services/auth.service';
import { useLanguage } from '../../contexts/LanguageContext';

interface UserDropdownProps {
  user: User;
  variant?: 'landing' | 'workspace';
}

export default function UserDropdown({ user, variant = 'landing' }: UserDropdownProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t } = useLanguage();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {}
    dispatch(logout());
    setDropdownOpen(false);
    navigate('/');
  };

  if (variant === 'workspace') {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-muted shadow-sm transition hover:border-blue-200"
          onClick={() => setDropdownOpen(!dropdownOpen)}
        >
          <img
            src={user.avatar || defaultAvatar}
            alt="Avatar"
            className="h-full w-full object-cover"
          />
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-card py-2 shadow-lg animate-fade-in z-50">
            <div className="px-4 py-3 border-b border-border">
              <p className="text-[0.7rem] font-bold text-muted-foreground uppercase tracking-wider truncate">{user.email}</p>
            </div>
            <div className="py-1">
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  navigate('/workspace/settings');
                }}
                className="flex w-full items-center px-4 py-2 text-sm text-foreground hover:bg-background transition-colors"
              >
                {t('header.profile')}
              </button>
            </div>
            <div className="border-t border-border pt-1">
              <button
                onClick={handleLogout}
                className="flex w-full items-center px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors"
              >
                {t('header.logout')}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Landing variant
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-3 rounded-2xl p-1 border border-border bg-card px-3 shadow-sm cursor-pointer transition hover:border-blue-300 hover:shadow-md"
      >
        <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-orange-500">
          <img src={user.avatar || defaultAvatar} alt="User Avatar" className="h-full w-full object-cover"/>
        </div>
        <span className="hidden text-sm font-semibold text-foreground sm:inline">
          {user.fullName}
        </span>
        <svg
          className={`hidden sm:block h-4 w-4 text-muted-foreground transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-xl border border-border bg-card py-2 shadow-lg animate-fade-in z-50">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-xs font-bold text-foreground uppercase tracking-wide">
              {user.email}
            </p>
          </div>
          <div className="py-1">
            <button
              type="button"
              onClick={() => {
                setDropdownOpen(false);
                navigate("/login");
              }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-foreground transition hover:bg-background"
            >
              Switch Account
            </button>

            <button
              type="button"
              onClick={() => {
                setDropdownOpen(false);
                navigate("/profile");
              }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-foreground transition hover:bg-background"
            >
              Profile
            </button>
          </div>

          {/* Logout */}
          <div className="border-t border-border pt-1">
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 transition hover:bg-red-50"
            >
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
