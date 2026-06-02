import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Icons } from '../../../../../assets/icons';
import { useProjectList } from './ProjectListContext';
import { MassChangeStatusModal } from '../../../../../components/workspace/MassChangeStatusModal';
import { MassEditFieldsModal } from '../../../../../components/workspace/MassEditFieldsModal';
import { MassDeleteModal } from '../../../../../components/workspace/MassDeleteModal';
import TaskDetailView from '../../../../../components/workspace/TaskDetailView';

export function ProjectListModals() {
  const {
    currentProject,
    isAllSelected,
    setIsAllSelected,
    selectedTaskIds,
    setSelectedTaskIds,
    excludedTaskIds,
    setExcludedTaskIds,
    deleteModalTask,
    setDeleteModalTask,
    deleteConfirmText,
    setDeleteConfirmText,
    selectedTask,
    setSelectedTask,
    tasksState: {
      tasks,
      setTasks,
      totalElements,
      deleteTaskMutation,
      updateStatusMutation,
      updateAssigneeMutation,
      updatePriorityMutation,
      updateDueDateMutation,
      currentPage,
      setCurrentPage
    }
  } = useProjectList();

  const [showMassChangeStatusModal, setShowMassChangeStatusModal] = useState(false);
  const [showMassEditFieldsModal, setShowMassEditFieldsModal] = useState(false);
  const [showMassDeleteModal, setShowMassDeleteModal] = useState(false);
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [isEditingFields, setIsEditingFields] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  return (
    <>
      {/* Delete Confirmation Modal (Single Task) */}
      {deleteModalTask && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setDeleteModalTask(null)} />
          <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-[440px] p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <Icons.alertCircle size={22} className="text-rose-600 fill-rose-100" />
                <h2 className="text-lg font-bold text-slate-800">Delete or archive {deleteModalTask.taskKey || deleteModalTask.id}?</h2>
              </div>
              <button onClick={() => setDeleteModalTask(null)} className="text-slate-400 hover:text-slate-600">
                <Icons.x size={20} />
              </button>
            </div>
            
            <p className="text-slate-600 text-sm leading-relaxed mb-6 pl-8">
              You can choose to delete or archive this work item and all its subtasks. 
              Deleting is irreversible. It permanently removes the work item, subtasks, 
              comments and attachments. To keep subtasks move them to a different parent.
            </p>
            
            <div className="mb-6 pl-8">
              <label className="block text-[13px] text-slate-600 mb-2">
                Type <strong className="text-slate-800 font-bold">delete</strong> to continue
              </label>
              <input
                type="text"
                autoFocus
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
              />
            </div>
            
            <div className="flex items-center justify-end gap-3">
              <button 
                onClick={() => setDeleteModalTask(null)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded transition-colors"
              >
                Archive
              </button>
              <button
                disabled={deleteConfirmText !== 'delete' || isDeleting}
                onClick={async () => {
                  try {
                    setIsDeleting(true);
                    await deleteTaskMutation.mutateAsync(deleteModalTask.id);
                    setDeleteModalTask(null);
                    if (tasks.length === 1 && currentPage > 1) {
                      setCurrentPage(currentPage - 1);
                    }
                  } catch (e) {
                    console.error(e);
                  } finally {
                    setIsDeleting(false);
                  }
                }}
                className={`px-4 py-2 text-sm font-semibold text-white rounded transition-colors flex items-center gap-2 ${deleteConfirmText === 'delete' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-slate-100 text-slate-400'}`}
              >
                {isDeleting ? <Icons.refreshCw className="animate-spin" size={16} /> : null}
                Delete
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Mass Change Status Modal */}
      {showMassChangeStatusModal && (
        <MassChangeStatusModal
          isOpen={showMassChangeStatusModal}
          onClose={() => setShowMassChangeStatusModal(false)}
          onSubmit={async (statusId) => {
            try {
              setIsChangingStatus(true);
              const tasksToUpdate = isAllSelected
                ? tasks.filter(t => !excludedTaskIds.has(t.id))
                : tasks.filter(t => selectedTaskIds.has(t.id));
              
              await Promise.all(tasksToUpdate.map(t => updateStatusMutation.mutateAsync({ taskId: t.dbId || t.id, statusId })));
            } catch (e) {
              console.error(e);
            } finally {
              setIsChangingStatus(false);
              setShowMassChangeStatusModal(false);
              setIsAllSelected(false);
              setSelectedTaskIds(new Set());
              setExcludedTaskIds(new Set());
            }
          }}
          statuses={currentProject?.statuses || []}
          isSubmitting={isChangingStatus}
        />
      )}

      {/* Mass Edit Fields Modal */}
      {showMassEditFieldsModal && (
        <MassEditFieldsModal
          isOpen={showMassEditFieldsModal}
          onClose={() => setShowMassEditFieldsModal(false)}
          members={currentProject?.members || []}
          isSubmitting={isEditingFields}
          onSubmit={async (data) => {
            try {
              setIsEditingFields(true);
              const tasksToUpdate = isAllSelected
                ? tasks.filter(t => !excludedTaskIds.has(t.id))
                : tasks.filter(t => selectedTaskIds.has(t.id));

              const taskPromises = tasksToUpdate.map(async (t) => {
                const taskId = t.dbId || t.id;
                if (data.assigneeId !== undefined) {
                  await updateAssigneeMutation.mutateAsync({ taskId, assigneeId: data.assigneeId });
                }
                if (data.priority !== undefined) {
                  await updatePriorityMutation.mutateAsync({ taskId, priority: data.priority });
                }
                if (data.dueDate !== undefined) {
                  await updateDueDateMutation.mutateAsync({ taskId, dueDate: data.dueDate });
                }
              });
              
              await Promise.all(taskPromises);
            } catch (e) {
              console.error(e);
            } finally {
              setIsEditingFields(false);
              setShowMassEditFieldsModal(false);
              setIsAllSelected(false);
              setSelectedTaskIds(new Set());
              setExcludedTaskIds(new Set());
            }
          }}
        />
      )}

      {/* Mass Delete Confirmation Modal */}
      <MassDeleteModal
        isOpen={showMassDeleteModal}
        onClose={() => setShowMassDeleteModal(false)}
        count={isAllSelected ? (totalElements - excludedTaskIds.size) : selectedTaskIds.size}
        onConfirm={async () => {
          const tasksToDelete = isAllSelected
            ? tasks.filter(t => !excludedTaskIds.has(t.id))
            : tasks.filter(t => selectedTaskIds.has(t.id));
          
          await Promise.all(tasksToDelete.map(t => deleteTaskMutation.mutateAsync(t.dbId || t.id)));
          
          setShowMassDeleteModal(false);
          setDeleteConfirmText('');
          setIsAllSelected(false);
          setSelectedTaskIds(new Set());
          setExcludedTaskIds(new Set());
        }}
      />

      {/* Floating Action Bar */}
      {(isAllSelected || selectedTaskIds.size > 0) && createPortal(
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-[#28282b] text-white px-3 py-2 rounded-lg shadow-2xl z-[99999] text-[13px] font-medium border border-white/10 animate-slide-up">
          <div className="flex items-center gap-2 pr-2">
            <span className="bg-white/10 text-white font-bold px-2 py-0.5 rounded text-[12px]">
              {isAllSelected ? totalElements - excludedTaskIds.size : selectedTaskIds.size}
            </span>
            <span className="text-[#d4d4d8]">selected</span>
          </div>
          
          <button className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-white/10 rounded-md transition-colors text-[#d4d4d8]" onClick={() => { setIsAllSelected(true); setExcludedTaskIds(new Set()); setSelectedTaskIds(new Set()); }}>
            <Icons.mousePointer2 size={14} />
            <span>Select all</span>
          </button>
          
          <div className="w-[1px] h-4 bg-white/20 mx-2"></div>

          <button className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-white/10 rounded-md transition-colors text-[#d4d4d8]" onClick={() => setShowMassEditFieldsModal(true)}>
            <Icons.edit3 size={14} />
            <span>Edit fields</span>
          </button>

          <button className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-white/10 rounded-md transition-colors text-[#d4d4d8]" onClick={() => setShowMassChangeStatusModal(true)}>
            <Icons.minusSquare size={14} />
            <span>Change status</span>
          </button>

          <button className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-white/10 rounded-md transition-colors text-[#d4d4d8]" onClick={() => setShowMassDeleteModal(true)}>
            <Icons.trash2 size={14} />
            <span>Delete</span>
          </button>
          
          <div className="w-[1px] h-4 bg-white/20 mx-2"></div>

          <button className="p-1 hover:bg-white/10 rounded-md transition-colors ml-1 text-[#d4d4d8]" onClick={() => { setIsAllSelected(false); setSelectedTaskIds(new Set()); setExcludedTaskIds(new Set()); }}>
            <Icons.x size={16} />
          </button>
        </div>,
        document.body
      )}

      {/* Task Detail Modal */}
      {selectedTask && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div 
            className="absolute inset-0" 
            onClick={() => setSelectedTask(null)} 
          />
          <div className="relative bg-white w-full max-w-[1000px] h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="flex-1 flex overflow-hidden">
              <TaskDetailView 
                task={selectedTask}
                currentProject={currentProject}
                onClose={() => setSelectedTask(null)}
                onUpdateTaskLocally={(taskId, updates) => {
                  setTasks((prev: any) => prev.map((t: any) => t.id === taskId ? { ...t, ...updates } : t));
                  setSelectedTask((prev: any) => prev && prev.id === taskId ? { ...prev, ...updates } : prev);
                }}
                onDeleteRequest={(task) => {
                  setSelectedTask(null);
                  setDeleteModalTask(task);
                }}
              />
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
