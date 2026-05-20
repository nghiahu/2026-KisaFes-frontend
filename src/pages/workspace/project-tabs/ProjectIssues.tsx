import { Icons } from '../../../assets/icons';
import defaultMan from '../../../assets/avatar_def_man.png';

interface ProjectIssuesProps {
  tasks: any[];
}

export default function ProjectIssues({ tasks }: ProjectIssuesProps) {
  const issuesList = tasks.filter(t => t.type === 'bug' || t.title.toLowerCase().includes('bug') || t.title.toLowerCase().includes('fix'));

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col gap-4 m-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="font-bold text-slate-800 text-lg">Issues & Bugs</h3>
          <p className="text-slate-400 text-xs font-semibold mt-0.5">Filter, track and debug items across the project scope</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Icons.search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search issues"
              className="pl-8 pr-3 py-1.5 w-44 bg-slate-50/50 border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:bg-white rounded-lg text-xs font-semibold text-slate-700 outline-none transition-all shadow-sm"
            />
          </div>
          <button className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 transition-colors shadow-sm">
            <Icons.filter size={13} />
            <span>Filter</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {issuesList.length > 0 ? issuesList.map((issue) => (
          <div key={issue.id} className="flex items-center justify-between p-4 bg-rose-50/30 border border-rose-100/50 rounded-2xl hover:border-rose-200 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Icons.bug size={14} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-rose-400">{issue.id}</span>
                  <span className="text-[10px] bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">{issue.priority}</span>
                </div>
                <h4 className="text-sm font-bold text-slate-700 mt-0.5">{issue.title}</h4>
              </div>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg font-bold">{issue.status}</span>
              <img src={defaultMan} alt="Assignee" className="w-8 h-8 rounded-full border-2 border-white shadow-sm" />
            </div>
          </div>
        )) : (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-3 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
            <Icons.alertCircle size={32} className="text-slate-300" />
            <span className="text-sm font-bold text-slate-500">No active issues found</span>
            <button className="text-xs font-bold text-blue-600 hover:underline">Report an issue</button>
          </div>
        )}
      </div>
    </div>
  );
}
