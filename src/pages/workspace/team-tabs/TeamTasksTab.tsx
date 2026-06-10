import { useState, useEffect } from 'react';
import { Icons } from '../../../assets/icons';
import { teamService } from '../../../services/team.service';
import { useNavigate } from 'react-router-dom';
import defaultMan from '../../../assets/avatar_def_man.png';

interface Props {
  teamId: string;
}

const getPriorityColor = (priority: string) => {
  switch (priority?.toUpperCase()) {
    case 'HIGHEST': return 'text-rose-600 bg-rose-50 border-rose-200';
    case 'HIGH': return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'MEDIUM': return 'text-amber-600 bg-amber-50 border-amber-200';
    case 'LOW': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    case 'LOWEST': return 'text-primary bg-primary/10 border-primary/20';
    default: return 'text-muted-foreground bg-background border-border';
  }
};

export default function TeamTasksTab({ teamId }: Props) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    teamService.getTeamTasks(teamId)
      .then((data) => {
        if (!cancelled) setTasks(data ?? []);
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load tasks. Please try again.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [teamId]);

  if (isLoading) {
    return (
      <div className="p-6 space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-background animate-pulse rounded-xl border border-border" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-12 flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 mb-3">
          <Icons.alertTriangle size={24} />
        </div>
        <p className="text-muted-foreground text-sm">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-3 text-sm text-primary hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="p-12 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary/70 mb-4">
          <Icons.checkSquare size={32} />
        </div>
        <h3 className="text-base font-bold text-foreground mb-1">No tasks assigned</h3>
        <p className="text-muted-foreground text-sm max-w-xs">
          This team has no active tasks assigned to it.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="space-y-3">
        {tasks.map((task) => (
          <div 
            key={task.id} 
            onClick={() => navigate(`/workspace/projects/${task.projectId}`)}
            className="bg-card border border-border rounded-xl p-4 flex items-center justify-between cursor-pointer shadow-sm hover:shadow-md hover:border-blue-300 transition-all group"
          >
            <div className="flex items-center gap-4 min-w-0 flex-1">
              {/* Icon/Type */}
              <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center text-muted-foreground border border-border shrink-0 group-hover:bg-primary/10 group-hover:text-primary group-hover:border-blue-100 transition-colors">
                <Icons.checkSquare size={20} />
              </div>
              
              {/* Task info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                    {task.taskKey}
                  </span>
                  <h3 className="font-bold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                    {task.title}
                  </h3>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground truncate">
                   <span className="flex items-center gap-1">
                     <Icons.folder size={12} /> {task.projectName || 'Unknown Project'}
                   </span>
                </div>
              </div>
            </div>

            {/* Badges and Assignee */}
            <div className="flex items-center gap-4 shrink-0 pl-4">
              <span className={`px-2.5 py-1 text-[11px] font-bold rounded-md border ${getPriorityColor(task.priority)}`}>
                {task.priority || 'NONE'}
              </span>
              
              {task.assigneeId ? (
                <div className="flex items-center gap-2" title={`Assignee: ${task.assigneeName}`}>
                  <img  
                    src={task.assigneeAvatar || defaultMan} 
                    alt={task.assigneeName} 
                    className="w-8 h-8 rounded-full border-2 border-white shadow-sm object-cover bg-muted" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center bg-background text-muted-foreground" title="Unassigned">
                  <Icons.user size={14} />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
