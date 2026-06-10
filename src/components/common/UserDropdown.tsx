import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import type { User } from '../../types/user.interface';
import defaultAvatar from '../../assets/avatar_def_man.png';
import { logout } from '../../store/slices/authSlice';
import { authService } from '../../services/auth.service';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { Icons } from '@/assets/icons';

import type { UserDropdownProps } from '../../types/components.interface';
export default function UserDropdown({ user, variant = 'landing' }: UserDropdownProps) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t } = useLanguage();

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {}
    dispatch(logout());
    navigate('/');
  };

  if (variant === 'workspace') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-muted shadow-sm transition hover:border-primary/20 outline-none">
          <img
            src={user.avatar || defaultAvatar}
            alt="Avatar"
            className="h-full w-full object-cover"
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider truncate">{user.email}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate('/workspace/settings')}>
            <Icons.user className="mr-2 h-4 w-4" />
            <span>{t('header.profile')}</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer">
            <Icons.logOut className="mr-2 h-4 w-4" />
            <span>{t('header.logout')}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Landing variant
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-3 rounded-2xl p-1 border border-border bg-card px-3 shadow-sm cursor-pointer transition hover:border-blue-300 hover:shadow-md outline-none">
        <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-orange-500">
          <img src={user.avatar || defaultAvatar} alt="User Avatar" className="h-full w-full object-cover" />
        </div>
        <span className="hidden text-sm font-semibold text-foreground sm:inline">
          {user.fullName}
        </span>
        <Icons.chevronDown size={16} className="hidden sm:block text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-xs font-bold text-foreground uppercase tracking-wide truncate">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate('/login')}>
          <Icons.users className="mr-2 h-4 w-4" />
          <span>Switch Account</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/profile')}>
          <Icons.user className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer">
          <Icons.logOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
