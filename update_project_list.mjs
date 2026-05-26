import fs from 'fs';

let content = fs.readFileSync('src/pages/workspace/project-tabs/ProjectList.tsx', 'utf-8');

// 1. Add States
const stateTarget =   const [searchKeyword, setSearchKeyword] = useState('');;
const stateReplacement =   const [searchKeyword, setSearchKeyword] = useState('');

  // Checkbox selection state
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [excludedTaskIds, setExcludedTaskIds] = useState<Set<string>>(new Set());

  const handleMasterCheckboxToggle = () => {
    if (isAllSelected) {
      setIsAllSelected(false);
      setSelectedTaskIds(new Set());
      setExcludedTaskIds(new Set());
    } else {
      setIsAllSelected(true);
      setSelectedTaskIds(new Set());
      setExcludedTaskIds(new Set());
    }
  };

  const handleTaskCheckboxToggle = (taskId: string) => {
    if (isAllSelected) {
      const newExcluded = new Set(excludedTaskIds);
      if (newExcluded.has(taskId)) newExcluded.delete(taskId);
      else newExcluded.add(taskId);
      setExcludedTaskIds(newExcluded);
    } else {
      const newSelected = new Set(selectedTaskIds);
      if (newSelected.has(taskId)) newSelected.delete(taskId);
      else newSelected.add(taskId);
      setSelectedTaskIds(newSelected);
    }
  };

  // Delete Modal state
  const [deleteModalTask, setDeleteModalTask] = useState<any>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showMassDeleteModal, setShowMassDeleteModal] = useState(false);
;
content = content.replace(stateTarget, stateReplacement);

// Remove the old deleteModalTask state declarations around line 50
content = content.replace(  // Delete Modal state\r\n  const [deleteModalTask, setDeleteModalTask] = useState<any>(null);\r\n  const [deleteConfirmText, setDeleteConfirmText] = useState('');\r\n  const [isDeleting, setIsDeleting] = useState(false);\r\n, '');
content = content.replace(  // Delete Modal state\n  const [deleteModalTask, setDeleteModalTask] = useState<any>(null);\n  const [deleteConfirmText, setDeleteConfirmText] = useState('');\n  const [isDeleting, setIsDeleting] = useState(false);\n, '');

// 2. Add Header Checkbox
const headerTarget =                       {col.id === 'checkbox' ? (
                        <div className="w-full text-center">
                          <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                        </div>
                      ) : col.id === 'actions' ? (;
const headerReplacement =                       {col.id === 'checkbox' ? (
                        <div className="w-full text-center">
                          <input 
                            type="checkbox" 
                            checked={isAllSelected}
                            onChange={handleMasterCheckboxToggle}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" 
                          />
                        </div>
                      ) : col.id === 'actions' ? (;
content = content.replace(headerTarget, headerReplacement);

// 3. Add Grouped Row Checkbox
const groupedRowTarget =                                 case 'checkbox': return (
                                  <td key={col.id} style={{ width: col.width, minWidth: col.minWidth, maxWidth: col.width }} className="py-3.5 px-4 text-center">
                                    <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                                  </td>
                                );;
const groupedRowReplacement =                                 case 'checkbox': return (
                                  <td key={col.id} style={{ width: col.width, minWidth: col.minWidth, maxWidth: col.width }} className="py-3.5 px-4 text-center">
                                    <input 
                                      type="checkbox" 
                                      checked={isAllSelected ? !excludedTaskIds.has(task.id) : selectedTaskIds.has(task.id)}
                                      onChange={() => handleTaskCheckboxToggle(task.id)}
                                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" 
                                    />
                                  </td>
                                );;
content = content.replace(groupedRowTarget, groupedRowReplacement);

// 4. Add Ungrouped Row Checkbox
const ungroupedRowTarget =                           case 'checkbox': return (
                            <td key={col.id} style={{ width: col.width, minWidth: col.minWidth, maxWidth: col.width }} className="py-3.5 px-4 text-center">
                              <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                            </td>
                          );;
const ungroupedRowReplacement =                           case 'checkbox': return (
                            <td key={col.id} style={{ width: col.width, minWidth: col.minWidth, maxWidth: col.width }} className="py-3.5 px-4 text-center">
                              <input 
                                type="checkbox" 
                                checked={isAllSelected ? !excludedTaskIds.has(task.id) : selectedTaskIds.has(task.id)}
                                onChange={() => handleTaskCheckboxToggle(task.id)}
                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" 
                              />
                            </td>
                          );;
content = content.replace(ungroupedRowTarget, ungroupedRowReplacement);

// 5. Add Mass Delete Modal and Floating Action Bar
const endTarget =               </div>
            </div>,
            document.body
          )}
        </div>
      </div>
    </div>
  );
};
const endReplacement = \              </div>
            </div>,
            document.body
          )}

          {/* Mass Delete Confirmation Modal */}
          {showMassDeleteModal && createPortal(
            <div className="fixed inset-0 z-[99999] flex items-center justify-center">
              <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowMassDeleteModal(false)} />
              <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-[440px] p-6 animate-in zoom-in-95 duration-200">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Icons.alertCircle size={22} className="text-rose-600 fill-rose-100" />
                    <h2 className="text-lg font-bold text-slate-800">Delete selected tasks?</h2>
                  </div>
                  <button onClick={() => setShowMassDeleteModal(false)} className="text-slate-400 hover:text-slate-600">
                    <Icons.x size={20} />
                  </button>
                </div>
                
                <p className="text-slate-600 text-sm leading-relaxed mb-6 pl-8">
                  You are about to delete {isAllSelected ? (totalElements - excludedTaskIds.size) : selectedTaskIds.size} task(s). 
                  Deleting is irreversible. It permanently removes the work items, subtasks, 
                  comments and attachments.
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
                    onClick={() => setShowMassDeleteModal(false)}
                    className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={deleteConfirmText !== 'delete' || isDeleting}
                    onClick={async () => {
                      try {
                        setIsDeleting(true);
                        const tasksToDelete = isAllSelected
                          ? tasks.filter(t => !excludedTaskIds.has(t.id))
                          : tasks.filter(t => selectedTaskIds.has(t.id));
                        
                        await Promise.all(tasksToDelete.map(t => dispatch(deleteTask(t.dbId || t.id)).unwrap()));
                        
                        setShowMassDeleteModal(false);
                        setDeleteConfirmText('');
                        setIsAllSelected(false);
                        setSelectedTaskIds(new Set());
                        setExcludedTaskIds(new Set());
                        
                        if (projectId) {
                          dispatch(fetchTasksByProject({ projectId, params: { page: currentPage, size: itemsPerPage } }));
                        }
                      } catch (e) {
                        console.error(e);
                      } finally {
                        setIsDeleting(false);
                      }
                    }}
                    className={\px-4 py-2 text-sm font-semibold text-white rounded transition-colors flex items-center gap-2 \\}
                  >
                    {isDeleting ? <Icons.refreshCw className="animate-spin" size={16} /> : null}
                    Delete
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}
        </div>
      </div>

      {/* Floating Action Bar */}
      {(isAllSelected || selectedTaskIds.size > 0) && createPortal(
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-[#28282b] text-white px-3 py-2 rounded-lg shadow-2xl z-[99999] text-[13px] font-medium border border-white/10 animate-in slide-in-from-bottom-5">
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

          <button className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-white/10 rounded-md transition-colors text-[#d4d4d8]">
            <Icons.edit3 size={14} />
            <span>Edit fields</span>
          </button>

          <button className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-white/10 rounded-md transition-colors text-[#d4d4d8]">
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
    </div>
  );
}\;

content = content.replace(endTarget, endReplacement);

fs.writeFileSync('src/pages/workspace/project-tabs/ProjectList.tsx', content, 'utf-8');
console.log('Update successful');
