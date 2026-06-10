import { Outlet, NavLink } from 'react-router-dom';
import Header from '../components/landing/Header';

export default function ProfileLayout() {
  const navItems = [
    { name: 'Hồ sơ cá nhân', path: '/profile' },
    { name: 'Bảo mật', path: '/profile/security' },
    { name: 'Thông báo', path: '/profile/notifications' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      
      <main className="flex-1 w-full bg-slate-50 dark:bg-slate-900">
        <Outlet />
      </main>
    </div>
  );
}
