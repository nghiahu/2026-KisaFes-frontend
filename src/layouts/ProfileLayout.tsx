import { Outlet, NavLink } from 'react-router-dom';
import Header from '../components/landing/Header';

export default function ProfileLayout() {
  const navItems = [
    { name: 'Hồ sơ cá nhân', path: '/profile' },
    { name: 'Bảo mật', path: '/profile/security' },
    { name: 'Thông báo', path: '/profile/notifications' },
  ];

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col">
      <Header />
      
      <main className="flex-1 container-custom max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Cài đặt tài khoản</h1>
          <p className="mt-1 text-sm text-slate-500">Quản lý thông tin cá nhân và thiết lập bảo mật của bạn.</p>
        </div>

        <div className="mb-8 border-b border-slate-200">
          <nav className="-mb-px flex gap-6" aria-label="Tabs">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                end={item.path === '/profile'}
                className={({ isActive }) =>
                  `flex items-center gap-2 whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors ${
                    isActive
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                  }`
                }
              >
                {item.name}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="bg-transparent">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
