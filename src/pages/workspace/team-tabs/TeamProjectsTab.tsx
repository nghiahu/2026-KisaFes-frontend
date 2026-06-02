import { useState, useEffect } from 'react';
import { Icons } from '../../../assets/icons';
import { teamService } from '../../../services/team.service';
import { useNavigate } from 'react-router-dom';

interface Props {
  teamId: string;
}

export default function TeamProjectsTab({ teamId }: Props) {
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    teamService.getTeamProjects(teamId)
      .then((data) => {
        if (!cancelled) setProjects(data ?? []);
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load projects. Please try again.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [teamId]);

  if (isLoading) {
    return (
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 bg-slate-50 animate-pulse rounded-xl border border-slate-100" />
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
        <p className="text-slate-600 text-sm">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-3 text-sm text-blue-600 hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="p-12 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-400 mb-4">
          <Icons.folder size={32} />
        </div>
        <h3 className="text-base font-bold text-slate-800 mb-1">No projects yet</h3>
        <p className="text-slate-500 text-sm max-w-xs">
          This team has not been added to any projects.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project) => (
          <div 
            key={project.id} 
            onClick={() => navigate(`/workspace/projects/${project.id}`)}
            className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col cursor-pointer shadow-sm hover:shadow-md hover:border-blue-300 transition-all group"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold">
                {project.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm text-slate-800 truncate group-hover:text-blue-600 transition-colors">
                  {project.name}
                </h3>
                <p className="text-xs text-slate-500 truncate">
                  {project.code || 'NO-CODE'}
                </p>
              </div>
            </div>
            
            <p className="text-sm text-slate-600 line-clamp-2 min-h-[40px] mb-4">
              {project.description || 'No description provided.'}
            </p>
            
            <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-3">
               <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                 <Icons.folder size={14} /> View Project
               </span>
               <Icons.arrowRight size={14} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
