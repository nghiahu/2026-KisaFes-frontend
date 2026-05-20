import { useState } from 'react';
import { Icons } from '../../../assets/icons';
import { useAppDispatch } from '../../../store/hooks';
import { createTask } from '../../../store/slices/taskSlice';
import defaultMan from '../../../assets/avatar_def_man.png';

interface ProjectBoardProps {
  currentProject: any;
  tasks: any[];
}

export default function ProjectBoard({ currentProject, tasks }: ProjectBoardProps) {
  const dispatch = useAppDispatch();
  const [showAddTask, setShowAddTask] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskType, setNewTaskType] = useState('task'); // Can be expanded later

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

  const handleAddTask = async (statusLabel: string) => {
    if (!newTaskTitle.trim() || !currentProject) return;
    const statuses = currentProject.statuses || [];
    const statusObj = statuses.find((s: any) => s.label === statusLabel) || statuses[0] || { statusId: '', label: 'To Do' };

    try {
      await dispatch(createTask({
        projectId: currentProject.id,
        title: newTaskTitle.trim(),
        statusId: statusObj.statusId,
        type: newTaskType
      })).unwrap();
      setNewTaskTitle('');
      setShowAddTask(null);
    } catch (err) {
      console.error("Failed to add task via UI:", err);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 overflow-x-auto pb-4 p-6">
      {['To Do', 'In Progress', 'Review', 'Done'].map((status) => {
        const columnTasks = tasks.filter(t => t.status === status);
        return (
          <div key={status} className="bg-slate-50 p-4 rounded-3xl border border-slate-200/60 min-w-[250px] flex flex-col gap-3 min-h-[300px]">
            <div className="flex items-center justify-between px-2 mb-1">
              <div className="flex items-center gap-2">
                <h4 className="font-extrabold text-sm text-slate-700">{status}</h4>
                <span className="text-xs bg-slate-200/80 text-slate-600 px-1.5 py-0.5 rounded-full font-bold">
                  {columnTasks.length}
                </span>
              </div>
              <button className="text-slate-400 hover:text-slate-600">
                <Icons.moreHorizontal size={16} />
              </button>
            </div>

            {/* Task list inside column */}
            <div className="flex flex-col gap-2 flex-1">
              {columnTasks.map((task) => (
                <div key={task.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-300 transition-colors group cursor-pointer">
                  <span className="text-[10px] text-slate-400 font-bold block mb-1">{task.id}</span>
                  <h5 className="font-bold text-slate-800 text-sm leading-snug group-hover:text-blue-600 transition-colors">{task.title}</h5>

                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-50">
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider border ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <img src={defaultMan} alt="Assignee" className="w-6 h-6 rounded-full border border-white shadow-sm" title={task.assignee} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Add task option */}
            {showAddTask === status ? (
              <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-inner mt-2">
                <textarea
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="What needs to be done?"
                  className="w-full text-xs font-semibold text-slate-700 placeholder:text-slate-400 border-0 focus:ring-0 resize-none p-1"
                  rows={2}
                  autoFocus
                />
                <div className="flex items-center justify-end gap-1.5 mt-2">
                  <button
                    onClick={() => setShowAddTask(null)}
                    className="px-2.5 py-1 text-slate-500 hover:bg-slate-100 rounded-lg text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleAddTask(status)}
                    className="px-2.5 py-1 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700"
                  >
                    Add
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => {
                  setShowAddTask(status);
                  setNewTaskTitle('');
                }}
                className="w-full flex items-center justify-center gap-1.5 py-2 border border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50/20 rounded-2xl text-slate-400 hover:text-blue-600 text-xs font-bold transition-all mt-2"
              >
                <Icons.plus size={14} />
                <span>Add Issue</span>
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
