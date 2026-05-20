import { Icons } from '../../../assets/icons';

interface ProjectSprintProps {
  tasks: any[];
}

export default function ProjectSprint({ tasks }: ProjectSprintProps) {
  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col gap-6 m-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-xs bg-blue-500 text-white font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">Active</span>
            <h3 className="font-extrabold text-slate-800 text-xl">Sprint 1 (Sprint Hạt Nhân)</h3>
          </div>
          <p className="text-slate-400 text-xs font-semibold mt-1">May 15, 2026 - May 29, 2026 • 2 Weeks</p>
        </div>

        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-slate-500 text-xs font-bold bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200/50">
            <Icons.clock size={14} />
            <span>5 days remaining</span>
          </span>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-black transition-colors shadow-md shadow-blue-200">
            Complete Sprint
          </button>
        </div>
      </div>

      {/* Sprint Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100 text-center">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Total Story Points</span>
          <h4 className="text-2xl font-black text-slate-800 mt-1">24</h4>
        </div>
        <div className="bg-blue-50/20 rounded-2xl p-4 border border-blue-100/30 text-center">
          <span className="text-xs text-blue-500 font-bold uppercase tracking-wider block">Completed Points</span>
          <h4 className="text-2xl font-black text-blue-600 mt-1">16</h4>
        </div>
        <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100 text-center">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">In Progress Points</span>
          <h4 className="text-2xl font-black text-slate-800 mt-1">5</h4>
        </div>
        <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100 text-center">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Unstarted Points</span>
          <h4 className="text-2xl font-black text-slate-800 mt-1">3</h4>
        </div>
      </div>

      {/* Sprint tasks list */}
      <div>
        <h4 className="font-bold text-slate-800 text-sm mb-3">Sprint Task List</h4>
        <div className="flex flex-col gap-2">
          {tasks.slice(0, 3).map((task) => (
            <div key={task.id} className="flex items-center justify-between p-3 border border-slate-100 hover:bg-slate-50 rounded-2xl transition-colors">
              <div className="flex items-center gap-3">
                <Icons.checkCircle2 size={16} className={task.status === 'Done' ? 'text-emerald-500' : 'text-slate-300'} />
                <span className="text-xs font-bold text-slate-400">{task.id}</span>
                <span className="text-sm font-bold text-slate-700">{task.title}</span>
              </div>
              <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md font-bold">
                {task.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
