import { useState, useEffect } from 'react';
import { Icons } from '../../../assets/icons';
import { sprintService, type Sprint } from '../../../services/sprint.service';
import { Plus, Target, Zap, CheckCircle2, Clock } from 'lucide-react';

interface ProjectSprintProps {
  projectId: string;
  tasks: any[];
}

export default function ProjectSprint({ projectId, tasks }: ProjectSprintProps) {
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [activeSprint, setActiveSprint] = useState<Sprint | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newSprintName, setNewSprintName] = useState('');
  const [newSprintGoal, setNewSprintGoal] = useState('');

  useEffect(() => {
    if (!projectId) return;
    loadSprints();
  }, [projectId]);

  const loadSprints = async () => {
    setIsLoading(true);
    try {
      const data = await sprintService.getSprintsByProject(projectId);
      setSprints(data);
      const active = data.find(s => s.status === 'ACTIVE') ?? null;
      setActiveSprint(active);
    } catch (e) {
      console.error('Failed to load sprints', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSprint = async () => {
    if (!newSprintName.trim()) return;
    setIsCreating(true);
    try {
      const sprint = await sprintService.createSprint(projectId, {
        name: newSprintName.trim(),
        goal: newSprintGoal.trim() || undefined,
      });
      setSprints(prev => [...prev, sprint]);
      setNewSprintName('');
      setNewSprintGoal('');
      setShowCreateForm(false);
    } catch (e) {
      console.error('Failed to create sprint', e);
    } finally {
      setIsCreating(false);
    }
  };

  const handleStartSprint = async (sprintId: string) => {
    try {
      const updated = await sprintService.startSprint(projectId, sprintId);
      setSprints(prev => prev.map(s => s.id === sprintId ? updated : s));
      setActiveSprint(updated);
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Không thể bắt đầu sprint.');
    }
  };

  const handleCompleteSprint = async (sprintId: string) => {
    if (!confirm('Bạn có chắc muốn hoàn thành sprint này?')) return;
    try {
      const updated = await sprintService.completeSprint(projectId, sprintId);
      setSprints(prev => prev.map(s => s.id === sprintId ? updated : s));
      setActiveSprint(null);
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Không thể hoàn thành sprint.');
    }
  };

  const getRemainingDays = (endDate?: string) => {
    if (!endDate) return null;
    const diff = Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000);
    if (diff < 0) return 'Đã kết thúc';
    if (diff === 0) return 'Hôm nay';
    return `${diff} ngày còn lại`;
  };

  const getStatusBadge = (status: Sprint['status']) => {
    switch (status) {
      case 'ACTIVE': return 'bg-emerald-500 text-white';
      case 'PLANNING': return 'bg-blue-500 text-white';
      case 'COMPLETED': return 'bg-slate-400 text-white';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 m-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-bold text-slate-400">Đang tải Sprint...</span>
        </div>
      </div>
    );
  }

  const sprintTasks = activeSprint
    ? tasks.filter(t => t.sprintId === activeSprint.id || t.dbId)
    : tasks.slice(0, 5);

  return (
    <div className="flex flex-col gap-6 m-6">

      {/* Active Sprint Card */}
      {activeSprint ? (
        <div className="bg-white rounded-3xl p-6 border border-violet-100 shadow-lg shadow-violet-500/5">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-5">
            <div>
              <div className="flex items-center gap-2.5">
                <span className={`text-xs font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${getStatusBadge('ACTIVE')}`}>
                  Active
                </span>
                <h3 className="font-extrabold text-slate-800 text-xl">{activeSprint.name}</h3>
              </div>
              {activeSprint.goal && (
                <p className="text-slate-400 text-xs font-semibold mt-1 flex items-center gap-1.5">
                  <Target size={12} /> {activeSprint.goal}
                </p>
              )}
              <p className="text-slate-400 text-xs font-semibold mt-1">
                {activeSprint.startDate ? new Date(activeSprint.startDate).toLocaleDateString('vi-VN') : '—'}
                {' → '}
                {activeSprint.endDate ? new Date(activeSprint.endDate).toLocaleDateString('vi-VN') : '—'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {activeSprint.endDate && (
                <span className="flex items-center gap-1 text-slate-500 text-xs font-bold bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200/50">
                  <Clock size={14} />
                  <span>{getRemainingDays(activeSprint.endDate)}</span>
                </span>
              )}
              <button
                onClick={() => handleCompleteSprint(activeSprint.id)}
                className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-1.5 rounded-xl text-xs font-black transition-colors shadow-md shadow-violet-200"
              >
                Complete Sprint
              </button>
            </div>
          </div>

          {/* Story Point Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <MetricCard label="Total Points" value={activeSprint.totalStoryPoints} color="slate" />
            <MetricCard label="Completed" value={activeSprint.completedStoryPoints} color="emerald" />
            <MetricCard label="In Progress" value={activeSprint.inProgressStoryPoints} color="blue" />
            <MetricCard label="Unstarted" value={activeSprint.unstartedStoryPoints} color="amber" />
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-xs font-bold text-slate-400 mb-2">
              <span>Sprint Progress</span>
              <span>
                {activeSprint.completedTasks}/{activeSprint.totalTasks} tasks
                {activeSprint.totalStoryPoints > 0 && (
                  <span className="text-violet-500 ml-2">
                    ({Math.round((activeSprint.completedStoryPoints / activeSprint.totalStoryPoints) * 100)}% pts)
                  </span>
                )}
              </span>
            </div>
            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-violet-400 transition-all duration-700"
                style={{
                  width: activeSprint.totalStoryPoints > 0
                    ? `${Math.round((activeSprint.completedStoryPoints / activeSprint.totalStoryPoints) * 100)}%`
                    : '0%'
                }}
              />
            </div>
          </div>

          {/* Task List */}
          <div>
            <h4 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2">
              <Zap size={14} className="text-violet-500" />
              Sprint Tasks ({activeSprint.totalTasks})
            </h4>
            <div className="flex flex-col gap-2">
              {sprintTasks.length === 0 ? (
                <p className="text-sm text-slate-400 italic px-2">Chưa có task nào trong sprint này.</p>
              ) : (
                sprintTasks.slice(0, 8).map((task) => (
                  <div key={task.id || task.taskKey} className="flex items-center justify-between p-3 border border-slate-100 hover:bg-slate-50 rounded-2xl transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <CheckCircle2
                        size={16}
                        className={task.status === 'Done' || task.statusLabel === 'Done' ? 'text-emerald-500 shrink-0' : 'text-slate-300 shrink-0'}
                      />
                      <span className="text-xs font-bold text-slate-400 shrink-0">{task.id || task.taskKey}</span>
                      <span className="text-sm font-bold text-slate-700 truncate">{task.title}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {task.storyPoints && (
                        <span className="text-[10px] bg-violet-100 text-violet-600 px-1.5 py-0.5 rounded-md font-black">
                          {task.storyPoints}sp
                        </span>
                      )}
                      <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md font-bold">
                        {task.status || task.statusLabel}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-violet-50/50 border-2 border-dashed border-violet-200 rounded-3xl p-10 flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 bg-violet-100 rounded-2xl flex items-center justify-center text-violet-500">
            <Zap size={28} />
          </div>
          <div>
            <h3 className="font-black text-slate-700 text-lg">Không có Sprint đang chạy</h3>
            <p className="text-sm text-slate-400 font-semibold mt-1">Tạo và bắt đầu một sprint để theo dõi tiến độ theo chu kỳ.</p>
          </div>
        </div>
      )}

      {/* All Sprints List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-extrabold text-slate-800">Tất cả Sprint</h3>
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-black transition-colors shadow-md shadow-violet-200"
          >
            <Plus size={14} />
            New Sprint
          </button>
        </div>

        {/* Create Sprint Form */}
        {showCreateForm && (
          <div className="px-6 py-4 border-b border-slate-100 bg-violet-50/40 animate-in fade-in duration-200">
            <div className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="Sprint name (e.g. Sprint 2)"
                className="w-full bg-white border border-violet-200 px-4 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-violet-400/20 font-semibold text-sm"
                value={newSprintName}
                onChange={e => setNewSprintName(e.target.value)}
                autoFocus
              />
              <input
                type="text"
                placeholder="Sprint goal (optional)"
                className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-violet-400/20 font-semibold text-sm"
                value={newSprintGoal}
                onChange={e => setNewSprintGoal(e.target.value)}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleCreateSprint}
                  disabled={isCreating || !newSprintName.trim()}
                  className="bg-violet-600 hover:bg-violet-700 text-white px-5 py-2 rounded-xl text-xs font-black transition-all disabled:bg-slate-200 disabled:text-slate-400"
                >
                  {isCreating ? 'Đang tạo...' : 'Tạo Sprint'}
                </button>
                <button
                  onClick={() => { setShowCreateForm(false); setNewSprintName(''); setNewSprintGoal(''); }}
                  className="text-slate-400 hover:text-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition-colors"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sprint List */}
        <div className="flex flex-col divide-y divide-slate-100">
          {sprints.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-slate-400 font-semibold">
              Chưa có sprint nào. Hãy tạo sprint đầu tiên!
            </div>
          ) : (
            sprints.map(sprint => (
              <div key={sprint.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 ${getStatusBadge(sprint.status)}`}>
                    {sprint.status}
                  </span>
                  <div className="min-w-0">
                    <h4 className="font-bold text-slate-800 text-sm truncate">{sprint.name}</h4>
                    {sprint.goal && (
                      <p className="text-xs text-slate-400 font-semibold truncate">{sprint.goal}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] font-bold text-slate-400">
                    {sprint.completedTasks}/{sprint.totalTasks} tasks
                  </span>
                  {sprint.status === 'PLANNING' && (
                    <button
                      onClick={() => handleStartSprint(sprint.id)}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1 rounded-lg text-[11px] font-black transition-colors"
                    >
                      Start
                    </button>
                  )}
                  {sprint.status === 'ACTIVE' && (
                    <button
                      onClick={() => handleCompleteSprint(sprint.id)}
                      className="bg-violet-500 hover:bg-violet-600 text-white px-3 py-1 rounded-lg text-[11px] font-black transition-colors"
                    >
                      Complete
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colorMap: Record<string, string> = {
    slate: 'bg-slate-50/50 border-slate-100 text-slate-800',
    emerald: 'bg-emerald-50/30 border-emerald-100/30 text-emerald-600',
    blue: 'bg-blue-50/20 border-blue-100/30 text-blue-600',
    amber: 'bg-amber-50/20 border-amber-100/30 text-amber-600',
  };
  return (
    <div className={`rounded-2xl p-4 border text-center ${colorMap[color] ?? colorMap.slate}`}>
      <span className="text-xs font-bold uppercase tracking-wider block text-slate-400">{label}</span>
      <h4 className={`text-2xl font-black mt-1 ${colorMap[color]?.split(' ')[2]}`}>{value}</h4>
    </div>
  );
}
