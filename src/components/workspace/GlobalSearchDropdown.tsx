import { useEffect, useRef } from 'react';
import { Icons } from '../../assets/icons';
import { useProjects } from '../../hooks/api/useProjects';
import { useMyTasksQuery } from '../../hooks/api/useTasks';
import { useNavigate } from 'react-router-dom';

interface GlobalSearchDropdownProps {
  searchTerm: string;
  onClose: () => void;
}

export default function GlobalSearchDropdown({ searchTerm, onClose }: GlobalSearchDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { data: projects = [] } = useProjects();
  const { data: myTasks = [] } = useMyTasksQuery();
  const navigate = useNavigate();

  // Handle click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const getTaskIcon = (type: string) => {
    if (type?.toLowerCase() === 'epic') return <Icons.zap size={16} className="text-purple-500" />;
    if (type?.toLowerCase() === 'bug') return <Icons.alertCircle size={16} className="text-orange-500" />;
    return <Icons.checkSquare size={16} className="text-blue-500" />;
  };

  const filteredTasks = myTasks.filter((task: any) => 
    !searchTerm || task.title?.toLowerCase().includes(searchTerm.toLowerCase()) || task.taskKey?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredProjects = projects.filter((project: any) =>
    !searchTerm || project.name?.toLowerCase().includes(searchTerm.toLowerCase()) || project.key?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div 
      ref={dropdownRef}
      className="absolute top-full left-0 mt-2 w-full sm:w-[450px] bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden flex flex-col max-h-[80vh]"
    >
      <div className="overflow-y-auto py-2">
        {/* RECENTLY VIEWED TASKS */}
        {filteredTasks.length > 0 && (
          <div className="px-4 py-2">
            <h3 className="text-[0.75rem] font-bold text-muted-foreground mb-2 uppercase tracking-wider">
              {searchTerm ? 'Tasks matching search' : 'Recently Viewed'}
            </h3>
            <div className="flex flex-col">
              {filteredTasks.slice(0, 10).map((task: any) => (
                <button 
                  key={task.id}
                  onClick={() => {
                    navigate(`/workspace/projects/${task.projectId}`, { state: { tab: 'list', openTask: task } });
                    onClose();
                  }}
                  className="flex items-center gap-3 px-2 py-2 hover:bg-background rounded-lg text-left transition-colors w-full group"
                >
                  <div className="w-6 flex justify-center shrink-0">
                    {getTaskIcon(task.type)}
                  </div>
                  <div className="text-[0.85rem] text-foreground truncate font-medium group-hover:text-blue-600 transition-colors">
                    <span className="text-muted-foreground mr-2 font-normal">{task.taskKey || task.id.substring(0, 8)}</span>
                    {task.title}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* RECENT BOARDS, PROJECTS */}
        {filteredProjects.length > 0 && (
          <div className="px-4 py-2 mt-2">
            <h3 className="text-[0.75rem] font-bold text-muted-foreground mb-2 uppercase tracking-wider">
              {searchTerm ? 'Projects matching search' : 'Recent Boards, Projects and Filters'}
            </h3>
            <div className="flex flex-col">
              {filteredProjects.slice(0, 5).map((project: any) => (
                <button 
                  key={project.id}
                  onClick={() => {
                    navigate(`/workspace/projects/${project.id}`);
                    onClose();
                  }}
                  className="flex items-center justify-between px-2 py-2 hover:bg-background rounded-lg text-left transition-colors w-full group"
                >
                  <div className="flex items-center gap-3 truncate">
                    <div className="w-6 h-6 shrink-0 bg-blue-100 rounded-md flex items-center justify-center text-blue-600">
                      <Icons.kanbanSquare size={14} />
                    </div>
                    <div className="text-[0.85rem] text-foreground truncate font-medium group-hover:text-blue-600 transition-colors">
                      {project.name}
                    </div>
                  </div>
                  <div className="text-[0.75rem] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                    {project.key || project.name.substring(0, 2).toUpperCase()}..
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* No results */}
        {filteredTasks.length === 0 && filteredProjects.length === 0 && (
          <div className="px-4 py-8 text-center">
            <Icons.search size={24} className="mx-auto text-slate-300 mb-2" />
            <p className="text-muted-foreground text-sm">No results found for "{searchTerm}"</p>
          </div>
        )}
      </div>
    </div>
  );
}
