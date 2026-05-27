import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Icons } from '../../assets/icons';
import defaultAvatar from '../../assets/avatar_def_man.png';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { updateTaskStatus, updateTaskAssignee, updateTaskPriority, updateTaskDueDate, updateTaskTitle, addSubTask, toggleSubTask, deleteSubTask, updateTaskDescription } from '../../store/slices/taskSlice';
import TiptapEditor from './TiptapEditor';
import { activityService } from '../../services/activity.service';
import { commentService, type CommentResponse } from '../../services/comment.service';
import { socketService } from '../../services/socketService';
import { CornerDownLeft, SmilePlus, Pencil, MoreHorizontal, Trash2, ChevronDown, ListTodo, Image, Code, Plus, Link, Undo2, Redo2, History, Sparkles } from 'lucide-react';

interface TaskDetailViewProps {
  task: any;
  currentProject: any;
  onClose: () => void;
  onUpdateTaskLocally: (taskId: string, updates: any) => void;
}

export default function TaskDetailView({ task, currentProject, onClose, onUpdateTaskLocally }: TaskDetailViewProps) {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector(state => state.auth.user);
  const [activeTab, setActiveTab] = useState<'All' | 'Comments' | 'History'>('All');
  const [comments, setComments] = useState<CommentResponse[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [attachedImages, setAttachedImages] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [replyToCommentId, setReplyToCommentId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [activeDropdownCommentId, setActiveDropdownCommentId] = useState<string | null>(null);
  const [hoveredCommentId, setHoveredCommentId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editDescription, setEditDescription] = useState(task.description || '');
  const [showAddSubtask, setShowAddSubtask] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [subtaskIdToDelete, setSubtaskIdToDelete] = useState<string | null>(null);

  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const assigneeDropdownRef = useRef<HTMLDivElement>(null);
  const priorityDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: Event) => {
      const mouseEvent = event as MouseEvent;
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(mouseEvent.target as Node)) {
        setShowStatusDropdown(false);
      }
      if (assigneeDropdownRef.current && !assigneeDropdownRef.current.contains(mouseEvent.target as Node)) {
        setShowAssigneeDropdown(false);
      }
      if (priorityDropdownRef.current && !priorityDropdownRef.current.contains(mouseEvent.target as Node)) {
        setShowPriorityDropdown(false);
      }

      // Close comment dropdown if clicking outside
      const target = mouseEvent.target as HTMLElement;
      if (activeDropdownCommentId && !target.closest('.comment-dropdown-container')) {
        setActiveDropdownCommentId(null);
      }

      // Close reply form if clicking outside
      if (replyToCommentId && !target.closest('.reply-container') && !target.closest('.reply-btn')) {
        setReplyToCommentId(null);
        setReplyText('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeDropdownCommentId, replyToCommentId]);

  const fetchComments = async () => {
    if (!task.dbId) return;
    try {
      const data = await commentService.getCommentsByTaskId(task.dbId);
      setComments(data);
    } catch (err) {
      console.error("Failed to fetch comments:", err);
    }
  };

  const fetchActivities = async () => {
    if (!task.dbId) return;
    try {
      const data = await activityService.getActivitiesByTaskId(task.dbId);
      // Filter out comments from activities, keeping only STATUS_CHANGE history
      setActivities(data.filter(act => act.type === 'STATUS_CHANGE'));
    } catch (err) {
      console.error("Failed to fetch activities:", err);
    }
  };

  useEffect(() => {
    if (task.dbId) {
      setLoadingActivities(true);
      Promise.all([fetchComments(), fetchActivities()]).finally(() => {
        setLoadingActivities(false);
      });
    }
  }, [task.dbId]);

  // STOMP WebSocket comment events listener
  useEffect(() => {
    if (!currentProject?.id || !task.dbId) return;
    const sub = socketService.subscribe(`/topic/project/${currentProject.id}`, (event: any) => {
      if (event.type === 'CREATE_COMMENT') {
        const newC = event.data;
        if (newC.taskId === task.dbId) {
          setComments(prev => {
            if (prev.some(c => c.id === newC.id)) return prev;
            return [...prev, newC];
          });
        }
      } else if (event.type === 'UPDATE_COMMENT') {
        const updatedC = event.data;
        if (updatedC.taskId === task.dbId) {
          setComments(prev => prev.map(c => c.id === updatedC.id ? updatedC : c));
        }
      } else if (event.type === 'DELETE_COMMENT') {
        const deletedId = event.data;
        setComments(prev => prev.filter(c => c.id !== deletedId));
      } else if (event.type === 'UPDATE_TASK') {
        const updatedTask = event.data;
        if (updatedTask.id === task.dbId) {
          fetchActivities();
        }
      }
    });
    return () => {
      sub?.unsubscribe();
    };
  }, [currentProject?.id, task.dbId]);

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingImage(true);
    try {
      const urls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const url = await commentService.uploadImage(files[i]);
        urls.push(url);
      }
      setAttachedImages(prev => [...prev, ...urls]);
    } catch (err) {
      console.error("Failed to upload image:", err);
      alert("Lỗi tải lên hình ảnh!");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() && attachedImages.length === 0) return;
    if (!task.dbId) return;
    try {
      const newComment = await commentService.createComment(task.dbId, {
        content: commentText.trim(),
        imageUrls: attachedImages.length > 0 ? attachedImages : null
      });
      setComments(prev => [...prev, newComment]);
      setCommentText('');
      setAttachedImages([]);
    } catch (err) {
      console.error("Failed to add comment:", err);
    }
  };

  const handleAddReply = async (targetComment: CommentResponse) => {
    if (!replyText.trim() || !task.dbId) return;
    try {
      const parentId = targetComment.parentId || targetComment.id;
      let content = replyText.trim();
      const cleanMention = `@${targetComment.userName.replace(/\s+/g, '')}`;
      if (!content.startsWith(cleanMention)) {
        content = `${cleanMention} ${content}`;
      }
      const newComment = await commentService.createComment(task.dbId, {
        content,
        parentId
      });
      setComments(prev => [...prev, newComment]);
      setReplyText('');
      setReplyToCommentId(null);
    } catch (err) {
      console.error("Failed to add reply:", err);
    }
  };

  const handleToggleReaction = async (commentId: string, emoji: string) => {
    try {
      const updated = await commentService.toggleReaction(commentId, emoji);
      setComments(prev => prev.map(c => c.id === commentId ? updated : c));
    } catch (err) {
      console.error("Failed to toggle reaction:", err);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bình luận này?")) return;
    try {
      await commentService.deleteComment(commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (err) {
      console.error("Failed to delete comment:", err);
    }
  };

  const handleTitleSubmit = async () => {
    if (!editTitle.trim() || editTitle.trim() === task.title) {
      setIsEditingTitle(false);
      setEditTitle(task.title);
      return;
    }
    const newTitle = editTitle.trim();
    onUpdateTaskLocally(task.id, { title: newTitle });
    setIsEditingTitle(false);
    try {
      if (task.dbId) {
        await dispatch(updateTaskTitle({ taskId: task.dbId, title: newTitle })).unwrap();
      }
    } catch (error) {
      console.error("Failed to update title:", error);
      onUpdateTaskLocally(task.id, { title: task.title });
    }
  };

  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim() || !task.dbId) return;
    
    try {
      const updatedTask = await dispatch(addSubTask({ taskId: task.dbId, title: newSubtaskTitle.trim() })).unwrap();
      setNewSubtaskTitle('');
      setShowAddSubtask(false);
      onUpdateTaskLocally(task.id, updatedTask);
    } catch (error) {
      console.error("Failed to add subtask:", error);
    }
  };

  const handleToggleSubtask = async (subtaskId: string) => {
    if (!task.dbId) return;
    try {
      const updatedTask = await dispatch(toggleSubTask({ taskId: task.dbId, subtaskId })).unwrap();
      onUpdateTaskLocally(task.id, updatedTask);
    } catch (error) {
      console.error("Failed to toggle subtask:", error);
    }
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    setSubtaskIdToDelete(subtaskId);
  };

  const confirmDeleteSubtask = async () => {
    if (!task.dbId || !subtaskIdToDelete) return;
    try {
      const updatedTask = await dispatch(deleteSubTask({ taskId: task.dbId, subtaskId: subtaskIdToDelete })).unwrap();
      onUpdateTaskLocally(task.id, updatedTask);
    } catch (error) {
      console.error("Failed to delete subtask:", error);
    } finally {
      setSubtaskIdToDelete(null);
    }
  };

  const handleStatusUpdate = async (statusId: string, statusLabel: string) => {
    setShowStatusDropdown(false);
    if (task.statusId === statusId || task.status === statusLabel) return;
    onUpdateTaskLocally(task.id, { status: statusLabel, statusId });
    try {
      if (task.dbId) {
        await dispatch(updateTaskStatus({ taskId: task.dbId, statusId })).unwrap();
      }
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const handleAssigneeUpdate = async (member: any) => {
    setShowAssigneeDropdown(false);
    const newAssigneeId = member ? member.id : null;
    const newAssigneeName = member ? member.name : 'Unassigned';
    onUpdateTaskLocally(task.id, { assigneeId: newAssigneeId, assigneeName: newAssigneeName });
    try {
      if (task.dbId) {
        await dispatch(updateTaskAssignee({ taskId: task.dbId, assigneeId: newAssigneeId })).unwrap();
      }
    } catch (error) {
      console.error("Failed to update assignee:", error);
    }
  };

  const handlePriorityUpdate = async (priority: string) => {
    setShowPriorityDropdown(false);
    if (task.priority === priority) return;
    onUpdateTaskLocally(task.id, { priority });
    try {
      if (task.dbId) {
        await dispatch(updateTaskPriority({ taskId: task.dbId, priority })).unwrap();
      }
    } catch (error) {
      console.error("Failed to update priority:", error);
    }
  };

  const handleDueDateUpdate = async (newDate: string) => {
    const formattedDate = newDate ? `${newDate}T00:00:00` : null;
    onUpdateTaskLocally(task.id, { dueDate: formattedDate });
    try {
      if (task.dbId) {
        await dispatch(updateTaskDueDate({ taskId: task.dbId, dueDate: formattedDate })).unwrap();
      }
    } catch (error) {
      console.error("Failed to update due date:", error);
    }
  };

  const PRIORITIES = [
    { label: 'Highest', icon: <Icons.chevronsUp size={14} className="text-rose-500" /> },
    { label: 'High', icon: <Icons.chevronUp size={14} className="text-orange-500" /> },
    { label: 'Medium', icon: <Icons.equal size={14} strokeWidth={3} className="text-amber-500" /> },
    { label: 'Low', icon: <Icons.chevronDown size={14} className="text-blue-400" /> },
    { label: 'Lowest', icon: <Icons.chevronsDown size={14} className="text-slate-400" /> },
  ];

  const getPriorityIcon = (priority: string) => {
    const p = PRIORITIES.find(x => x.label.toLowerCase() === (priority || 'medium').toLowerCase());
    return p ? p.icon : <Icons.equal size={14} strokeWidth={3} className="text-amber-500" />;
  };

  const hasAssignee = task.assigneeName && task.assigneeName !== 'Unassigned';
  const projectMembers = currentProject?.members || [];

  return (
    <div className="flex-1 flex overflow-hidden bg-white animate-in fade-in duration-300">
      {/* LEFT PANEL */}
          <div className="flex-1 flex flex-col overflow-y-auto border-r border-slate-200 p-8 scrollbar-thin">
            {/* Breadcrumb & Actions */}
            <div className="flex items-center text-[13px] text-slate-500 mb-6 gap-2 font-medium">
              <button onClick={onClose} className="hover:bg-slate-100 p-1.5 rounded-lg flex items-center gap-1 transition-colors">
                <Icons.chevronLeft size={16} /> Back
              </button>
              <div className="w-px h-4 bg-slate-300 mx-2"></div>
              <button className="hover:bg-slate-100 px-2 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors">
                <Icons.gitBranch size={14} /> Add epic
              </button>
              <span className="text-slate-300">/</span>
              <div className="flex items-center gap-1.5 text-blue-600 hover:underline cursor-pointer px-1 py-1.5 rounded-lg">
                <Icons.checkSquare size={14} className="text-blue-500" />
                {task.taskKey || 'KAN-9'}
              </div>
            </div>

            {/* Title */}
            <div className="mb-6">
              {isEditingTitle ? (
                <textarea
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  onBlur={handleTitleSubmit}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleTitleSubmit();
                    }
                    if (e.key === 'Escape') {
                      setIsEditingTitle(false);
                      setEditTitle(task.title);
                    }
                  }}
                  autoFocus
                  className="w-full text-2xl font-black text-slate-800 border-2 border-blue-500 rounded-lg p-2 outline-none resize-none overflow-hidden"
                  rows={2}
                />
              ) : (
                <h1
                  onClick={() => setIsEditingTitle(true)}
                  className="text-2xl font-black text-slate-800 hover:bg-slate-50 p-2 -ml-2 rounded-lg cursor-pointer transition-colors"
                >
                  {task.title}
                </h1>
              )}
            </div>

            {/* Main Action Buttons */}
            <div className="flex items-center gap-2 mb-8">
              <button className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-md border border-slate-200 transition-colors shadow-sm">
                <Icons.link size={16} />
              </button>
              <button className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-md border border-slate-200 transition-colors shadow-sm">
                <Icons.gitBranch size={16} />
              </button>
              <button className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-md border border-slate-200 transition-colors shadow-sm">
                <Icons.link size={16} />
              </button>
              <button className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-md border border-slate-200 transition-colors shadow-sm">
                <Icons.moreHorizontal size={16} />
              </button>
            </div>

            {/* Description */}
            <div className="mb-8">
              <h3 className="text-[15px] font-semibold text-[#172b4d] mb-3">Description</h3>
              {isEditingDescription ? (
                <TiptapEditor
                  content={editDescription}
                  onChange={setEditDescription}
                  onSave={async () => {
                    setIsEditingDescription(false);
                    onUpdateTaskLocally(task.id, { description: editDescription });
                    if (task.dbId) {
                      try {
                        const updatedTask = await dispatch(updateTaskDescription({ taskId: task.dbId, description: editDescription })).unwrap();
                        onUpdateTaskLocally(task.id, updatedTask);
                      } catch (error) {
                        console.error("Failed to update description:", error);
                      }
                    }
                  }}
                  onCancel={() => {
                    setIsEditingDescription(false);
                    setEditDescription(task.description || '');
                  }}
                />
              ) : (
                <div 
                  onClick={() => setIsEditingDescription(true)}
                  className={`text-[14px] p-2 -ml-2 rounded cursor-text transition-colors min-h-[40px] prose prose-sm max-w-none ${task.description ? 'text-[#172b4d] hover:bg-[#091e420a]' : 'text-[#42526e] hover:bg-[#091e420a]'}`}
                >
                  {task.description ? (
                    <div dangerouslySetInnerHTML={{ __html: task.description }} />
                  ) : (
                    'Add a description...'
                  )}
                </div>
              )}
            </div>

            {/* Subtasks */}
            <div className="mb-8">
              <h3 className="text-[15px] font-bold text-slate-800 mb-3">Subtasks</h3>
              
              <div className="flex flex-col gap-1 mb-2">
                {task.subTasks?.map((st: any) => (
                  <div key={st.id} className="group flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-100">
                    <input 
                      type="checkbox" 
                      checked={st.done} 
                      onChange={() => handleToggleSubtask(st.id)}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600 cursor-pointer"
                    />
                    <span className={`text-[14px] flex-1 ${st.done ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                      {st.title}
                    </span>
                    <button 
                      onClick={() => handleDeleteSubtask(st.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                    >
                      <Icons.trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>

              {showAddSubtask ? (
                <form onSubmit={handleAddSubtask} className="flex items-center gap-2 mt-2">
                  <input
                    type="text"
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    placeholder="What needs to be done?"
                    className="flex-1 text-[14px] px-3 py-1.5 border border-blue-400 rounded-md outline-none focus:ring-2 focus:ring-blue-100 transition-shadow"
                    autoFocus
                  />
                  <button type="submit" className="px-3 py-1.5 bg-blue-600 text-white text-[13px] font-semibold rounded-md hover:bg-blue-700 transition-colors">
                    Add
                  </button>
                  <button 
                    type="button" 
                    onClick={() => {
                      setShowAddSubtask(false);
                      setNewSubtaskTitle('');
                    }}
                    className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-md transition-colors"
                  >
                    <Icons.x size={16} />
                  </button>
                </form>
              ) : (
                <button 
                  onClick={() => setShowAddSubtask(true)}
                  className="text-[14px] font-semibold text-slate-600 hover:bg-slate-100 p-2 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Icons.plus size={16} className="text-slate-400" />
                  Add subtask
                </button>
              )}
            </div>


            {/* Activity */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[15px] font-bold text-slate-800">Activity</h3>
              </div>

              <div className="flex gap-2 border-b border-slate-200 mb-4">
                {['All', 'Comments', 'History'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`px-3 py-2 text-[13px] font-bold border-b-2 transition-colors ${activeTab === tab
                        ? 'border-blue-600 text-blue-700'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-t-lg'
                      }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {activeTab === 'Comments' && (
                <form onSubmit={handleAddComment} className="flex gap-4 mb-6">
                  <img src={currentUser?.avatar || defaultAvatar} className="w-8 h-8 rounded-full border border-slate-200 object-cover" alt="Me" />
                  <div className="flex-1">
                    <div className="border border-slate-200 rounded-xl bg-white focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400 transition-all p-3">
                      <input
                        type="text"
                        placeholder="Add a comment..."
                        value={commentText}
                        onChange={e => setCommentText(e.target.value)}
                        className="w-full outline-none text-[14px] placeholder:text-slate-400 text-slate-700"
                      />
                      
                      {attachedImages.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {attachedImages.map((url, index) => (
                            <div key={index} className="relative group/img w-16 h-16 border rounded-lg overflow-hidden">
                              <img src={url} className="w-full h-full object-cover" alt="" />
                              <button
                                type="button"
                                onClick={() => setAttachedImages(prev => prev.filter((_, idx) => idx !== index))}
                                className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity text-white"
                              >
                                <Icons.x size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-slate-400">
                          <input 
                            type="file" 
                            multiple 
                            accept="image/*" 
                            className="hidden" 
                            ref={fileInputRef} 
                            onChange={handleImageFileChange} 
                          />
                          <button 
                            type="button" 
                            onClick={() => fileInputRef.current?.click()} 
                            disabled={uploadingImage}
                            className="hover:bg-slate-100 p-1.5 rounded transition-colors"
                            title="Đính kèm ảnh"
                          >
                            <Icons.pencil size={14} />
                          </button>
                          <button type="button" className="hover:bg-slate-100 p-1.5 rounded transition-colors"><Icons.listTodo size={14} /></button>
                          <button type="button" className="hover:bg-slate-100 p-1.5 rounded transition-colors"><Icons.link size={14} /></button>
                          <button type="button" className="hover:bg-slate-100 p-1.5 rounded transition-colors"><Icons.user size={14} /></button>
                          {uploadingImage && <span className="text-xs text-slate-400 animate-pulse">Uploading...</span>}
                        </div>
                        <button 
                          type="submit" 
                          disabled={!commentText.trim() && attachedImages.length === 0}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              )}

              {loadingActivities ? (
                <div className="text-center py-4 text-sm text-slate-400">Loading activities...</div>
              ) : (
                <div className="flex flex-col gap-4">
                  {activeTab === 'Comments' && (
                    <div className="flex flex-col gap-4">
                      {comments
                        .filter(c => !c.parentId) // Only top-level comments at root
                        .map(comment => {
                          const renderNode = (c: CommentResponse, indent = 0) => {
                            const childReplies = comments.filter(x => x.parentId === c.id);
                            const getReactedEmoji = (emoji: string) => {
                              return currentUser && c.reactions[emoji]?.includes(currentUser.id);
                            };
                            const renderCommentContent = (content: string) => {
                              const mentionRegex = /^(@[^\s]+)\s(.*)$/;
                              const match = content.match(mentionRegex);
                              if (match) {
                                return (
                                  <>
                                    <span className="inline-flex items-center bg-[#deebff] text-[#0747a6] px-1.5 py-0.5 rounded text-[12px] font-bold mr-1.5 select-none">
                                      {match[1]}
                                    </span>
                                    {match[2]}
                                  </>
                                );
                              }
                              return content;
                            };
                             return (
                              <div key={c.id} className="flex flex-col gap-2 relative" style={{ marginLeft: `${indent * 48}px` }}>
                                {/* Curve Thread Line */}
                                {indent > 0 && (
                                  <div className="absolute left-[-28px] top-[-16px] bottom-[calc(100%-16px)] w-5 border-l-2 border-b-2 border-slate-200 rounded-bl-xl pointer-events-none" />
                                )}

                                <div className="flex gap-3 text-[14px] relative">
                                  <img 
                                    src={c.userAvatar || defaultAvatar} 
                                    className="w-8 h-8 rounded-full border border-slate-200 object-cover shrink-0 z-10" 
                                    alt="" 
                                  />
                                  <div className="flex-1 relative group">
                                    {/* Author & Timestamp (Vertical layout like image) */}
                                    <div className="flex flex-col mb-1 select-none">
                                      <span className="font-bold text-[#172b4d] text-[14px] leading-tight">{c.userName}</span>
                                      <span className="text-[11px] text-slate-400 font-medium mt-0.5">
                                        {new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) === new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) ? 'today' : 'yesterday'}
                                      </span>
                                    </div>
                                    
                                    {/* Comment Content (Plain text, no background bubble) */}
                                    <p className="text-[#172b4d] text-[14px] leading-relaxed whitespace-pre-wrap pr-10">
                                      {renderCommentContent(c.content)}
                                    </p>

                                    {c.imageUrls && c.imageUrls.length > 0 && (
                                      <div className="mt-2 flex flex-wrap gap-2 max-w-md">
                                        {c.imageUrls.map((url, idx) => (
                                          <img 
                                            key={idx} 
                                            src={url} 
                                            alt="" 
                                            className="rounded-lg max-h-36 object-cover border border-slate-200 cursor-pointer hover:opacity-95 transition-opacity" 
                                            onClick={() => window.open(url, '_blank')}
                                          />
                                        ))}
                                      </div>
                                    )}

                                    {/* Actions Bar (Reply, Reaction Pill, Smile Picker, Edit, More) */}
                                    <div className="mt-2 flex items-center gap-2.5 text-xs text-slate-500">
                                      {/* Reply Button (CornerDownLeft Arrow) */}
                                      <button 
                                        type="button"
                                        onClick={() => setReplyToCommentId(replyToCommentId === c.id ? null : c.id)}
                                        className="reply-btn text-slate-400 hover:text-[#0052cc] transition-colors p-1"
                                        title="Reply"
                                      >
                                        <CornerDownLeft size={16} />
                                      </button>

                                      {/* Active reactions pills */}
                                      <div className="flex items-center gap-1.5">
                                        {['👍', '❤️', '😄', '🎉', '😮'].map(emoji => {
                                          const count = c.reactions[emoji]?.length || 0;
                                          if (count === 0) return null;
                                          const active = getReactedEmoji(emoji);
                                          return (
                                            <button
                                              key={emoji}
                                              type="button"
                                              onClick={() => handleToggleReaction(c.id, emoji)}
                                              className={`px-2.5 py-0.5 rounded border text-[12px] transition-all flex items-center gap-1 shadow-sm font-semibold ${
                                                active 
                                                  ? 'bg-[#deebff]/60 border-[#0052cc] text-[#0747a6]' 
                                                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                              }`}
                                            >
                                              <span>{emoji}</span>
                                              <span>{count}</span>
                                            </button>
                                          );
                                        })}
                                      </div>

                                      {/* React Button with Hover Smiley Picker */}
                                      <div 
                                        className="relative"
                                        onMouseEnter={() => setHoveredCommentId(c.id)}
                                        onMouseLeave={() => setHoveredCommentId(null)}
                                      >
                                        <button 
                                          type="button"
                                          className="text-slate-400 hover:text-[#0052cc] transition-colors p-1"
                                          title="Thêm cảm xúc"
                                        >
                                          <SmilePlus size={16} />
                                        </button>
                                        {hoveredCommentId === c.id && (
                                          <div className="absolute bottom-[80%] left-0 mb-0 bg-white border border-slate-200 shadow-xl rounded-full px-3 py-1.5 flex gap-2.5 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
                                            {['👍', '❤️', '😄', '🎉', '😮'].map(emoji => (
                                              <button
                                                key={emoji}
                                                type="button"
                                                onClick={() => {
                                                  handleToggleReaction(c.id, emoji);
                                                  setHoveredCommentId(null);
                                                }}
                                                className="hover:scale-125 transition-transform text-lg active:scale-95"
                                              >
                                                {emoji}
                                              </button>
                                            ))}
                                          </div>
                                        )}
                                      </div>

                                      {/* Edit Comment (optional/only owner) */}
                                      {currentUser && c.userId === currentUser.id && (
                                        <button 
                                          type="button"
                                          className="text-slate-400 hover:text-[#0052cc] transition-colors p-1"
                                          title="Chỉnh sửa"
                                        >
                                          <Pencil size={14} />
                                        </button>
                                      )}

                                      {/* More Action (3-Dots dropdown) */}
                                      {currentUser && c.userId === currentUser.id && (
                                        <div className="relative comment-dropdown-container">
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setActiveDropdownCommentId(activeDropdownCommentId === c.id ? null : c.id);
                                            }}
                                            className="text-slate-400 hover:text-slate-600 p-1 transition-colors flex items-center"
                                            title="Tùy chọn khác"
                                          >
                                            <MoreHorizontal size={16} />
                                          </button>
                                          {activeDropdownCommentId === c.id && (
                                            <div className="absolute left-0 mt-1 bg-white border border-slate-200 shadow-xl rounded-md py-1 z-[60] w-24">
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  handleDeleteComment(c.id);
                                                  setActiveDropdownCommentId(null);
                                                }}
                                                className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 font-bold flex items-center gap-1.5 transition-colors"
                                              >
                                                <Trash2 size={12} /> Delete
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Curving nested Reply Editor matching Image 2 */}
                                {replyToCommentId === c.id && (
                                  <div className="reply-container flex gap-3 mt-3 relative" style={{ marginLeft: '48px' }}>
                                    {/* Curve Thread Line for Reply Editor */}
                                    <div className="absolute left-[-28px] top-[-16px] bottom-[calc(100%-16px)] w-5 border-l-2 border-b-2 border-slate-200 rounded-bl-xl pointer-events-none" />

                                    <img 
                                      src={currentUser?.avatar || defaultAvatar} 
                                      className="w-8 h-8 rounded-full border border-slate-200 object-cover shrink-0 z-10" 
                                      alt="" 
                                    />

                                    <div className="flex-1 flex flex-col gap-2">
                                      <div className="text-xs text-slate-400 font-medium select-none">
                                        Replying to {c.userName}
                                      </div>
                                      
                                      <div className="border border-[#dfe1e6] rounded-lg bg-white focus-within:border-[#4c9aff] focus-within:shadow-[0_0_0_1px_#4c9aff] overflow-hidden transition-all shadow-sm">
                                        {/* Rich Text Editor Toolbar styled like Image 2 */}
                                        <div className="flex items-center gap-2 border-b border-[#dfe1e6] p-2 px-3 bg-slate-50 text-slate-500 text-[11px] flex-wrap select-none">
                                          <button type="button" className="hover:bg-slate-200 p-0.5 rounded transition-colors flex items-center" title="Format painter"><Sparkles size={13} className="text-slate-400" /><ChevronDown size={10} /></button>
                                          
                                          <div className="w-px h-3 bg-slate-300 mx-0.5"></div>
                                          
                                          <button type="button" className="font-serif hover:bg-slate-200 p-0.5 px-1 rounded font-bold text-slate-600 transition-colors flex items-center" title="Font size">Tt<ChevronDown size={10} /></button>
                                          
                                          <button type="button" className="hover:bg-slate-200 p-0.5 px-1.5 rounded font-bold text-slate-600 transition-colors flex items-center" title="Bold">B<ChevronDown size={10} /></button>
                                          
                                          <div className="w-px h-3 bg-slate-300 mx-0.5"></div>
                                          
                                          <button type="button" className="hover:bg-slate-200 p-0.5 rounded transition-colors flex items-center" title="Bullet list"><ListTodo size={13} className="text-slate-400" /><ChevronDown size={10} /></button>
                                          
                                          <button type="button" className="hover:bg-slate-200 p-0.5 px-1.5 rounded font-bold bg-slate-200/50 text-[#0052cc] transition-colors" title="Text highlight">A</button>
                                          
                                          <div className="w-px h-3 bg-slate-300 mx-0.5"></div>
                                          
                                          <button type="button" className="hover:bg-slate-200 p-1 rounded transition-colors" title="Insert image"><Image size={13} className="text-slate-400" /></button>
                                          <button type="button" className="hover:bg-slate-200 p-1 rounded transition-colors" title="Insert code"><Code size={13} className="text-slate-400" /></button>
                                          <button type="button" className="hover:bg-slate-200 p-1 rounded transition-colors" title="Emojis"><SmilePlus size={13} className="text-slate-400" /></button>
                                          <button type="button" className="hover:bg-slate-200 p-1 rounded transition-colors" title="Add attachment"><Plus size={13} className="text-slate-400" /></button>
                                          <button type="button" className="hover:bg-slate-200 p-1 rounded transition-colors" title="Link"><Link size={13} className="text-slate-400" /></button>
                                          
                                          <div className="w-px h-3 bg-slate-300 mx-0.5"></div>
                                          
                                          <button type="button" className="hover:bg-slate-200 p-1 rounded transition-colors" title="Undo"><Undo2 size={13} className="text-slate-400" /></button>
                                          <button type="button" className="hover:bg-slate-200 p-1 rounded transition-colors" title="Redo"><Redo2 size={13} className="text-slate-400" /></button>
                                          <button type="button" className="hover:bg-slate-200 p-1 rounded transition-colors" title="History"><History size={13} className="text-slate-400" /></button>
                                        </div>
                                        
                                        <div className="p-3 min-h-[90px] text-sm flex flex-col">
                                          {/* Mention badge style */}
                                          <div className="flex items-center gap-1 select-none mb-1.5 self-start">
                                            <span className="inline-flex items-center bg-[#deebff] text-[#0747a6] px-2 py-0.5 rounded-full text-xs font-semibold">
                                              @{c.userName}
                                            </span>
                                          </div>
                                          
                                          <textarea
                                            value={replyText}
                                            onChange={e => setReplyText(e.target.value)}
                                            placeholder={`Reply to ${c.userName}...`}
                                            className="w-full outline-none text-sm text-slate-700 resize-none min-h-[60px] mt-1"
                                            rows={3}
                                            onKeyDown={e => {
                                              if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleAddReply(c);
                                              }
                                            }}
                                          />
                                        </div>
                                      </div>
                                      
                                      <div className="flex items-center gap-2 mt-1">
                                        <button 
                                          type="button"
                                          onClick={() => handleAddReply(c)}
                                          className="px-4 py-1.5 bg-[#0052cc] hover:bg-[#0047b3] text-white rounded font-bold text-[13px] transition-colors shadow-sm"
                                        >
                                          Save
                                        </button>
                                        <button 
                                          type="button"
                                          onClick={() => {
                                            setReplyToCommentId(null);
                                            setReplyText('');
                                          }}
                                          className="px-4 py-1.5 text-slate-600 hover:bg-[#091e420f] rounded font-bold text-[13px] transition-colors"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {childReplies.map(r => renderNode(r, indent + 1))}
                              </div>
                            );
                          };
                          return renderNode(comment);
                        })}
                      {comments.length === 0 && (
                        <div className="text-center py-6 text-sm text-slate-400 italic">No comments yet.</div>
                      )}
                    </div>
                  )}

                  {activeTab === 'History' && (
                    <div className="flex flex-col gap-4">
                      {activities.map(act => (
                        <div key={act.id} className="flex gap-3 text-[14px]">
                          <img 
                            src={act.userAvatar || defaultAvatar} 
                            className="w-8 h-8 rounded-full border border-slate-200 object-cover shrink-0" 
                            alt="" 
                          />
                          <div className="flex-1 bg-slate-50 rounded-lg p-3 relative shadow-sm">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-slate-800">{act.userName}</span>
                              <span className="text-[11px] text-slate-400">
                                {new Date(act.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-slate-500 italic font-medium text-[13px]">{act.content}</p>
                          </div>
                        </div>
                      ))}
                      {activities.length === 0 && (
                        <div className="text-center py-6 text-sm text-slate-400 italic">No history yet.</div>
                      )}
                    </div>
                  )}

                  {activeTab === 'All' && (
                    <div className="flex flex-col gap-4">
                      {[
                        ...comments.filter(c => !c.parentId).map(c => ({
                          id: c.id,
                          userName: c.userName,
                          userAvatar: c.userAvatar,
                          type: 'COMMENT',
                          content: c.content,
                          imageUrls: c.imageUrls,
                          reactions: c.reactions,
                          createdAt: c.createdAt
                        })),
                        ...activities.map(a => ({
                          id: a.id,
                          userName: a.userName,
                          userAvatar: a.userAvatar,
                          type: 'STATUS_CHANGE',
                          content: a.content,
                          imageUrls: null,
                          reactions: {},
                          createdAt: a.createdAt
                        }))
                      ]
                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                        .map(item => {
                          const getReactedEmoji = (emoji: string) => {
                            return currentUser && item.reactions[emoji]?.includes(currentUser.id);
                          };
                          return (
                            <div key={item.id} className="flex gap-3 text-[14px]">
                              <img 
                                src={item.userAvatar || defaultAvatar} 
                                className="w-8 h-8 rounded-full border border-slate-200 object-cover shrink-0" 
                                alt="" 
                              />
                              <div className="flex-1 bg-slate-50 rounded-2xl p-4 border border-slate-100 relative group shadow-sm">
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="font-bold text-slate-800">{item.userName}</span>
                                  <span className="text-[11px] text-slate-400">
                                    {new Date(item.createdAt).toLocaleString()}
                                  </span>
                                </div>
                                {item.type === 'COMMENT' ? (
                                  <>
                                    <p className="text-slate-700 whitespace-pre-wrap text-[13.5px] leading-relaxed">
                                      {(() => {
                                        const mentionRegex = /^(@[^\s]+)\s(.*)$/;
                                        const match = item.content.match(mentionRegex);
                                        if (match) {
                                          return (
                                            <>
                                              <span className="inline-flex items-center bg-[#deebff] text-[#0747a6] px-1.5 py-0.5 rounded text-[12px] font-bold mr-1.5 select-none">
                                                {match[1]}
                                              </span>
                                              {match[2]}
                                            </>
                                          );
                                        }
                                        return item.content;
                                      })()}
                                    </p>
                                    {item.imageUrls && item.imageUrls.length > 0 && (
                                      <div className="mt-3 flex flex-wrap gap-2 max-w-md">
                                        {item.imageUrls.map((url, idx) => (
                                          <img 
                                            key={idx} 
                                            src={url} 
                                            alt="" 
                                            className="rounded-lg max-h-40 object-cover border border-slate-200 cursor-pointer"
                                            onClick={() => window.open(url, '_blank')}
                                          />
                                        ))}
                                      </div>
                                    )}
                                    <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
                                      {/* Active reactions pills */}
                                      <div className="flex items-center gap-1">
                                        {['👍', '❤️', '😄', '🎉', '😮'].map(emoji => {
                                          const count = item.reactions[emoji]?.length || 0;
                                          if (count === 0) return null;
                                          const active = getReactedEmoji(emoji);
                                          return (
                                            <button
                                              key={emoji}
                                              type="button"
                                              onClick={() => handleToggleReaction(item.id, emoji)}
                                              className={`px-1.5 py-0.5 rounded-full border transition-all flex items-center gap-1 hover:scale-105 active:scale-95 ${
                                                active 
                                                  ? 'bg-blue-50 border-blue-200 text-blue-600 font-bold shadow-sm' 
                                                  : 'bg-white border-slate-200 text-slate-600'
                                              }`}
                                            >
                                              <span>{emoji}</span>
                                              <span className="text-[10px]">{count}</span>
                                            </button>
                                          );
                                        })}
                                      </div>

                                      {/* React Button with Hover Popup */}
                                      <div 
                                        className="relative"
                                        onMouseEnter={() => setHoveredCommentId(item.id)}
                                        onMouseLeave={() => setHoveredCommentId(null)}
                                      >
                                        <button 
                                          type="button"
                                          className="font-bold text-slate-500 hover:text-blue-600 transition-colors flex items-center gap-1 py-1"
                                        >
                                          <Icons.star size={12} /> React
                                        </button>
                                        {hoveredCommentId === item.id && (
                                          <div className="absolute bottom-[80%] left-0 mb-0 bg-white border border-slate-200 shadow-xl rounded-full px-3 py-1.5 flex gap-2.5 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
                                            {['👍', '❤️', '😄', '🎉', '😮'].map(emoji => (
                                              <button
                                                key={emoji}
                                                type="button"
                                                onClick={() => {
                                                  handleToggleReaction(item.id, emoji);
                                                  setHoveredCommentId(null);
                                                }}
                                                className="hover:scale-125 transition-transform text-lg active:scale-95"
                                              >
                                                {emoji}
                                              </button>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </>
                                ) : (
                                  <p className="text-slate-500 italic font-medium text-[13px]">{item.content}</p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      {comments.filter(c => !c.parentId).length === 0 && activities.length === 0 && (
                        <div className="text-center py-6 text-sm text-slate-400 italic">No activity yet.</div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div className="w-[360px] bg-white p-6 overflow-y-auto scrollbar-thin flex flex-col">
            {/* Top actions */}
            <div className="flex items-center justify-end gap-2 mb-8">
              <button className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-md border border-slate-200 transition-colors shadow-sm" title="Lock">
                <Icons.lockKeyhole size={16} />
              </button>
              <button className="p-1.5 text-blue-600 hover:bg-slate-100 rounded-md border border-slate-200 transition-colors shadow-sm flex items-center gap-1.5 font-semibold text-xs px-2.5">
                <Icons.eye size={14} /> 1
              </button>
              <button className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-md border border-slate-200 transition-colors shadow-sm" title="Share">
                <Icons.share2 size={16} />
              </button>
              <button className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-md border border-slate-200 transition-colors shadow-sm">
                <Icons.moreHorizontal size={16} />
              </button>
            </div>

            {/* Status & Actions */}
            <div className="flex items-center gap-2 mb-6">
              <div className="relative" ref={statusDropdownRef}>
                <button
                  onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-md text-[13px] font-bold hover:bg-blue-700 transition-colors shadow-sm shadow-blue-500/20"
                >
                  {task.status || 'To Do'}
                  <Icons.chevronDown size={14} />
                </button>

                {showStatusDropdown && (
                  <div className="absolute top-full left-0 mt-1.5 w-[200px] bg-white border border-slate-200 shadow-xl rounded-lg py-1.5 z-50">
                    {currentProject?.statuses?.map((s: any, idx: number) => {
                      const statusLabel = typeof s === 'string' ? s : (s.label || s.name);
                      const statusId = typeof s === 'string' ? s : (s.statusId || s.id);
                      return (
                        <button
                          key={statusId || idx}
                          onClick={() => handleStatusUpdate(statusId, statusLabel)}
                          className="w-full text-left px-4 py-2 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors flex items-center justify-between"
                        >
                          {statusLabel}
                          {(task.statusId === statusId || task.status === statusLabel) && <Icons.check size={14} className="text-blue-600" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              <button className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-md border border-slate-200 transition-colors shadow-sm">
                <Icons.zap size={16} />
              </button>
            </div>

            {/* Details section */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200 cursor-pointer">
                <h3 className="text-[13px] font-bold text-slate-800 flex items-center gap-2">
                  <Icons.chevronDown size={14} className="text-slate-500" />
                  Details
                </h3>
                <button className="text-slate-400 hover:text-slate-600"><Icons.settings size={14} /></button>
              </div>

              <div className="p-4 flex flex-col gap-4">
                {/* Assignee */}
                <div className="flex items-center">
                  <div className="w-[120px] text-[13px] font-semibold text-slate-500 shrink-0">Assignee</div>
                  <div className="relative flex-1" ref={assigneeDropdownRef}>
                    <button
                      onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
                      className="flex items-center gap-2 hover:bg-slate-100 p-1 -ml-1 rounded transition-colors w-full"
                    >
                      {hasAssignee ? (
                        <img src={task.assigneeAvatar || defaultAvatar} alt="Assignee" className="w-6 h-6 rounded-full border border-slate-200 shrink-0 object-cover" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center text-slate-400 shrink-0"><Icons.user size={12} /></div>
                      )}
                      <span className={`text-[13px] truncate ${hasAssignee ? 'text-slate-700 font-semibold' : 'text-slate-400 font-medium'}`}>
                        {task.assigneeName || 'Unassigned'}
                      </span>
                    </button>

                    {showAssigneeDropdown && (
                      <div className="absolute top-full left-0 mt-1 w-[220px] bg-white border border-slate-200 shadow-xl rounded-lg py-1 z-50">
                        <button
                          onClick={() => handleAssigneeUpdate(null)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-[13px] font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <div className="w-6 h-6 rounded-full bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center text-slate-400 shrink-0"><Icons.user size={12} /></div>
                          Unassigned
                        </button>
                        {projectMembers.map((m: any) => (
                          <button
                            key={m.id}
                            onClick={() => handleAssigneeUpdate(m)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-[13px] font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                          >
                            <img src={m.avatar || defaultAvatar} className="w-6 h-6 rounded-full border border-slate-200 object-cover shrink-0" alt="" />
                            <span className="truncate">{m.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Priority */}
                <div className="flex items-center">
                  <div className="w-[120px] text-[13px] font-semibold text-slate-500 shrink-0">Priority</div>
                  <div className="relative flex-1" ref={priorityDropdownRef}>
                    <button
                      onClick={() => setShowPriorityDropdown(!showPriorityDropdown)}
                      className="flex items-center gap-2 hover:bg-slate-100 p-1.5 -ml-1.5 rounded transition-colors w-full"
                    >
                      {getPriorityIcon(task.priority)}
                      <span className="text-[13px] font-semibold text-slate-700">{task.priority || 'Medium'}</span>
                    </button>

                    {showPriorityDropdown && (
                      <div className="absolute top-full left-0 mt-1 w-[160px] bg-white border border-slate-200 shadow-xl rounded-lg py-1 z-50">
                        {PRIORITIES.map(p => (
                          <button
                            key={p.label}
                            onClick={() => handlePriorityUpdate(p.label)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-[13px] font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                          >
                            {p.icon}
                            {p.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Attachment */}
                <div className="flex items-center">
                  <div className="w-[120px] text-[13px] font-semibold text-slate-500 shrink-0">Attachment</div>
                  <button className="text-[13px] font-medium text-slate-400 hover:bg-slate-100 p-1 -ml-1 rounded transition-colors flex-1 text-left flex items-center gap-1.5">
                    <Icons.paperclip size={14} className="text-slate-400" />
                    <span>None</span>
                  </button>
                </div>

                {/* Due Date */}
                <div className="flex items-center relative group">
                  <div className="w-[120px] text-[13px] font-semibold text-slate-500 shrink-0">Due date</div>
                  <div className="flex-1 flex items-center relative">
                    <button
                      className={`text-[13px] font-medium hover:bg-slate-100 p-1 -ml-1 rounded transition-colors flex-1 text-left ${task.dueDate ? 'text-slate-700' : 'text-slate-400'}`}
                      onClick={(e) => {
                        const input = e.currentTarget.nextElementSibling as HTMLInputElement;
                        if (input) {
                          try { input.showPicker(); } catch (err) { input.focus(); }
                        }
                      }}
                    >
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'None'}
                    </button>
                    <input
                      type="date"
                      value={task.dueDate ? task.dueDate.substring(0, 10) : ''}
                      onChange={(e) => handleDueDateUpdate(e.target.value)}
                      className="absolute w-0 h-0 opacity-0 pointer-events-none"
                    />
                    {task.dueDate && (
                      <button
                        onClick={() => handleDueDateUpdate('')}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 transition-opacity absolute right-2"
                      >
                        <Icons.x size={14} />
                      </button>
                    )}
                  </div>
                </div>


                {/* Team */}
                <div className="flex items-center">
                  <div className="w-[120px] text-[13px] font-semibold text-slate-500 shrink-0">Team</div>
                  <button className="text-[13px] font-medium text-slate-400 hover:bg-slate-100 p-1 -ml-1 rounded transition-colors flex-1 text-left">None</button>
                </div>

                <div className="h-px bg-slate-200 my-2"></div>

                {/* Start date */}
                <div className="flex items-center">
                  <div className="w-[120px] text-[13px] font-semibold text-slate-500 shrink-0">Start date</div>
                  <button className="text-[13px] font-medium text-slate-400 hover:bg-slate-100 p-1 -ml-1 rounded transition-colors flex-1 text-left">None</button>
                </div>

                {/* Reporter */}
                <div className="flex items-center">
                  <div className="w-[120px] text-[13px] font-semibold text-slate-500 shrink-0">Reporter</div>
                  <button className="flex items-center gap-2 hover:bg-slate-100 p-1 -ml-1 rounded transition-colors flex-1">
                    <img src={task.reporterAvatar || defaultAvatar} alt="Reporter" className="w-6 h-6 rounded-full border border-slate-200 shrink-0 object-cover" />
                    <span className="text-[13px] font-semibold text-slate-700 truncate">{task.reporterName || 'nghĩa Ngô'}</span>
                  </button>
                </div>

              </div>
            </div>

            <div className="mt-6 text-[12px] text-slate-400 text-right">
              <div>Created {task.createdAt ? new Date(task.createdAt).toLocaleDateString() : 'a while ago'}</div>
              <div>Updated {task.updatedAt ? new Date(task.updatedAt).toLocaleDateString() : 'a while ago'}</div>
            </div>
          </div>
          
          {/* Subtask Delete Confirmation Modal */}
          {subtaskIdToDelete && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/40" onClick={() => setSubtaskIdToDelete(null)}>
              <div 
                className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center gap-3 text-red-600 mb-4">
                  <Icons.alertCircle size={24} />
                  <h3 className="text-lg font-bold text-slate-800">Delete subtask?</h3>
                </div>
                <p className="text-[14px] text-slate-600 mb-6">
                  Are you sure you want to delete this subtask? This action cannot be undone.
                </p>
                <div className="flex justify-end gap-2">
                  <button 
                    onClick={() => setSubtaskIdToDelete(null)}
                    className="px-4 py-2 text-[14px] font-semibold text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={confirmDeleteSubtask}
                    className="px-4 py-2 text-[14px] font-semibold text-white bg-red-600 hover:bg-red-700 rounded-md shadow-sm transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
    </div>
  );
}
