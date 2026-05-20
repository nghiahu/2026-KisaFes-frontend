import { Icons } from '../../../assets/icons';
import defaultMan from '../../../assets/avatar_def_man.png';

interface ProjectBacklogProps {
  tasks: any[];
  setActiveTab: (tab: any) => void;
}

export default function ProjectBacklog({ tasks, setActiveTab }: ProjectBacklogProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'highest': return 'text-rose-600 bg-rose-50 border-rose-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'lowest': return 'text-slate-600 bg-slate-50 border-slate-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col gap-4 m-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h3 className="font-bold text-slate-800 text-lg">Product Backlog</h3>
          <p className="text-slate-400 text-xs font-semibold mt-0.5">Collect, organize and prioritize requirements</p>
        </div>
        <button
          onClick={() => setActiveTab('board')}
          className="flex items-center gap-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 px-3 py-2 rounded-xl text-xs font-extrabold text-slate-600 transition-colors"
        >
          <Icons.plus size={14} />
          <span>Create Backlog Item</span>
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {tasks.map((task) => (
          <div key={task.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 hover:bg-slate-50/80 rounded-2xl border border-slate-100 hover:border-slate-200 transition-all gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <input type="checkbox" className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500/20" checked={task.status === 'Done'} readOnly />
              <span className="text-xs font-extrabold text-slate-400 shrink-0 select-all">{task.id}</span>
              <span className="text-sm font-bold text-slate-700 truncate">{task.title}</span>
            </div>

            <div className="flex items-center justify-end gap-3 shrink-0">
              <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider border ${getPriorityColor(task.priority)}`}>
                {task.priority}
              </span>
              <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md font-bold">
                {task.status}
              </span>
              <img src={defaultMan} alt="Assignee" className="w-6 h-6 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
