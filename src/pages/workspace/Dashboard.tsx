import { useEffect, useState } from 'react';
import { Icons } from '../../assets/icons';
import type { User } from '../../types/user.interface';
import defaultAvatar from '../../assets/avatar_def_man.png';

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const raw = JSON.parse(userData);
      // Normalize to handle API field naming inconsistency
      setUser({
        ...raw,
        fullName: raw.fullName || raw.fullname || raw.full_name || '',
        userName: raw.userName || raw.username || raw.user_name || '',
      });
    }
  }, []);

  const firstName = user?.fullName?.split(' ').slice(-1)[0] || 'User';

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[0.82rem] font-medium text-slate-400">
        <span>Workspaces</span>
        <span className="text-slate-300">›</span>
        <span>Dashboard</span>
      </div>

      {/* Greeting */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl sm:text-[1.4rem] font-bold text-slate-900 leading-tight">
          {getGreeting()}, {firstName}
        </h1>
        <p className="text-[0.9rem] text-slate-500 max-w-2xl leading-relaxed">
          You have 4 focus tasks today and 2 project updates since you last
          checked in. Breathe deep, let's start.
        </p>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
        {/* Main Column */}
        <div className="flex flex-col">
          {/* Recent Projects */}
          <section className="flex flex-col gap-4 mb-8">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800">Recent Projects</h2>
              <a href="#" className="text-[0.82rem] font-semibold text-blue-500 hover:underline">
                View All
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Project Card 1 */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-50 text-blue-500">
                    <Icons.leaf size={20} strokeWidth={2} />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[0.7rem] font-bold bg-blue-50 text-blue-600 border border-blue-100">
                    Active
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">
                  Garden App Redesign
                </h3>
                <p className="text-[0.82rem] text-slate-500 mb-5 line-clamp-2">
                  A soft interface for organic gardeners and hobbyists.
                </p>
                <div className="mb-5">
                  <div className="flex justify-between text-[0.7rem] font-bold text-slate-400 mb-1.5 uppercase">
                    <span>Progress</span>
                    <span className="text-slate-600">75%</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: '75%' }}
                    />
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="flex -space-x-2 mr-3">
                    <img src={defaultAvatar} alt="" className="w-7 h-7 rounded-full border-2 border-white bg-slate-50" />
                    <img src={defaultAvatar} alt="" className="w-7 h-7 rounded-full border-2 border-white bg-slate-50" />
                    <img src={defaultAvatar} alt="" className="w-7 h-7 rounded-full border-2 border-white bg-slate-50" />
                  </div>
                  <span className="text-[0.7rem] font-bold text-slate-400">+2</span>
                </div>
              </div>

              {/* Project Card 2 */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-purple-50 text-purple-500">
                    <Icons.star size={20} strokeWidth={2} />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[0.7rem] font-bold bg-orange-50 text-orange-600 border border-orange-100">
                    Planning
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1 group-hover:text-purple-600 transition-colors">
                  Nebula Branding
                </h3>
                <p className="text-[0.82rem] text-slate-500 mb-5 line-clamp-2">
                  Visual identity for a space-themed mindfulness app.
                </p>
                <div className="mb-5">
                  <div className="flex justify-between text-[0.7rem] font-bold text-slate-400 mb-1.5 uppercase">
                    <span>Progress</span>
                    <span className="text-slate-600">12%</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-orange-500 rounded-full"
                      style={{ width: '12%' }}
                    />
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="flex -space-x-2">
                    <img src={defaultAvatar} alt="" className="w-7 h-7 rounded-full border-2 border-white bg-slate-50" />
                    <img src={defaultAvatar} alt="" className="w-7 h-7 rounded-full border-2 border-white bg-slate-50" />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Tasks Section */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800">Assigned to You</h2>
              <div className="flex items-center gap-1">
                <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors" title="Filter">
                  <Icons.slidersHorizontal size={16} />
                </button>
                <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors" title="More">
                  <Icons.moreHorizontal size={16} />
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {/* Task Item 1 */}
              <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:border-slate-200 transition-colors group">
                <div className="w-5 h-5 rounded-md border-2 border-slate-200 cursor-pointer group-hover:border-blue-400 transition-colors" />
                <div className="flex-1 flex flex-col">
                  <span className="text-[0.9rem] font-semibold text-slate-800 group-hover:text-slate-900">
                    Refine color palette for 'Nebula'
                  </span>
                  <span className="text-[0.75rem] text-slate-400 font-medium">
                    Due in 2 days • Project Space
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[0.65rem] font-bold bg-rose-50 text-rose-600 uppercase border border-rose-100">
                  High
                </span>
              </div>

              {/* Task Item 2 */}
              <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:border-slate-200 transition-colors group">
                <div className="w-5 h-5 rounded-md border-2 border-slate-200 cursor-pointer" />
                <div className="flex-1 flex flex-col">
                  <span className="text-[0.9rem] font-semibold text-slate-800">
                    Weekly team sync preparation
                  </span>
                  <span className="text-[0.75rem] text-slate-400 font-medium">
                    Tomorrow, 10:00 AM
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[0.65rem] font-bold bg-sky-50 text-sky-600 uppercase border border-sky-100">
                  Med
                </span>
              </div>

              {/* Task Item 3 */}
              <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:border-slate-200 transition-colors group opacity-70">
                <div className="w-5 h-5 rounded-md bg-emerald-500 border-2 border-emerald-500 flex items-center justify-center">
                  <Icons.plus size={12} color="#fff" className="rotate-45" />
                </div>
                <div className="flex-1 flex flex-col">
                  <span className="text-[0.9rem] font-semibold text-slate-500 line-through">
                    Review feedback on 'Garden App'
                  </span>
                  <span className="text-[0.75rem] text-slate-400 font-medium">
                    Done • 2 hours ago
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[0.65rem] font-bold bg-slate-100 text-slate-500 uppercase border border-slate-200">
                  Low
                </span>
              </div>
            </div>
          </section>
        </div>

        {/* Aside Column */}
        <div className="flex flex-col md:flex-row lg:flex-col gap-6">
          <div className="flex-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-6">Team Activity</h3>

            <div className="flex flex-col gap-6">
              <div className="flex gap-3">
                <img src={defaultAvatar} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[0.82rem] text-slate-600 leading-snug">
                    <strong className="text-slate-900 font-bold">Jordan</strong> commented on{' '}
                    <a href="#" className="text-blue-500 font-bold hover:underline">User Flow</a>
                  </p>
                  <p className="text-[0.78rem] text-slate-500 italic pl-2 border-l-2 border-slate-100 mt-1">
                    "The transition feels so smooth now! Great work on the easing curves."
                  </p>
                  <span className="block mt-2 text-[0.68rem] font-bold text-slate-400 uppercase tracking-wider">
                    🕐 12 MINUTES AGO
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <img src={defaultAvatar} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[0.82rem] text-slate-600 leading-snug">
                    <strong className="text-slate-900 font-bold">Sarah</strong> completed{' '}
                    <a href="#" className="text-blue-500 font-bold hover:underline">Icon Export</a>
                  </p>
                  <span className="block mt-2 text-[0.68rem] font-bold text-slate-400 uppercase tracking-wider">
                    🔴 1 HOUR AGO
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <img src={defaultAvatar} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[0.82rem] text-slate-600 leading-snug">
                    <strong className="text-slate-900 font-bold">Liam</strong> added a new file to{' '}
                    <a href="#" className="text-blue-500 font-bold hover:underline">Nebula Assets</a>
                  </p>
                  <span className="block mt-2 text-[0.68rem] font-bold text-slate-400 uppercase tracking-wider">
                    🔵 3 HOURS AGO
                  </span>
                </div>
              </div>
            </div>

            <button className="w-full mt-6 p-2.5 text-[0.82rem] font-semibold text-slate-700 bg-transparent border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all">
              View History
            </button>
          </div>

          {/* Inspiration Corner */}
          <div className="flex-1 relative h-44 rounded-2xl overflow-hidden bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800 border border-white/5 shadow-lg group cursor-pointer">
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent p-5 flex flex-col justify-end group-hover:from-black/70 transition-all">
              <h3 className="text-base font-bold text-white mb-1 group-hover:translate-x-1 transition-transform">
                Inspiration Corner
              </h3>
              <p className="text-[0.78rem] text-white/70">
                Curated trends for your next sprint.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
