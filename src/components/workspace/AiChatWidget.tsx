import React, { useState, useRef, useEffect } from 'react';
import { Icons } from '../../assets/icons';
import MarkdownPreview from '@uiw/react-markdown-preview';
import { aiService } from '../../services/task.service';
import type { AiGeneratedTask, AiTaskGenerationResult, AiTaskEditResult, AiTaskEditAction, AiSprintPlanResult } from '../../services/task.service';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { sprintService } from '../../services/sprint.service';
import GlobalEditTaskModal from './GlobalEditTaskModal';
import Draggable from 'react-draggable';
import type { AiMessage, AiChatWidgetProps } from '../../types/ai.interface';

const PRIORITY_COLORS: Record<string, string> = {
  Highest:  'bg-rose-100 text-rose-700 border-rose-200',
  High:     'bg-orange-100 text-orange-700 border-orange-200',
  Medium:   'bg-yellow-100 text-yellow-700 border-yellow-200',
  Low:      'bg-slate-100 text-slate-600 border-slate-200',
  Lowest:   'bg-slate-50 text-slate-400 border-slate-100',
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  story: <Icons.bookOpen size={12} />,
  bug:   <Icons.bug size={12} />,
  task:  <Icons.checkSquare size={12} />,
};

export default function AiChatWidget({ projectId, projectName, projectMethodology }: AiChatWidgetProps) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [chatMode, setChatMode] = useState<'chat' | 'generate' | 'edit' | 'plan'>('chat'); // toggle chế độ
  const [messages, setMessages] = useState<AiMessage[]>([
    {
      id: 'welcome',
      role: 'ai',
      content: `Xin chào! Tôi là **KisaFres AI**, trợ lý của dự án **${projectName}**.\n\nBạn có thể hỏi thông tin, bấm **✨** để tạo Task, bấm **✏️** để sửa Task, hoặc bấm **🎯** để Lên kế hoạch Sprint!`,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [pendingEdits, setPendingEdits] = useState<AiTaskEditAction[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const dragTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const draggableNodeRef = useRef<HTMLDivElement>(null);

  const [selectedSprint, setSelectedSprint] = useState<string>('BACKLOG');
  const [newSprintName, setNewSprintName] = useState<string>('');

  const { data: sprints = [] } = useQuery({
    queryKey: ['sprints', projectId],
    queryFn: () => sprintService.getSprintsByProject(projectId),
    enabled: projectMethodology === 'SCRUM'
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    setMessages([
      {
        id: 'welcome',
        role: 'ai',
        content: `Xin chào! Tôi là **KisaFres AI**, trợ lý của dự án **${projectName}**.\n\nBạn có thể hỏi thông tin, bấm **✨** để tạo Task, bấm **✏️** để sửa Task, hoặc bấm **🎯** để Lên kế hoạch Sprint!`,
        timestamp: new Date()
      }
    ]);
    setInput('');
    setChatMode('chat');
  }, [projectId, projectName]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: AiMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: chatMode === 'generate' ? `✨ ${input.trim()}` : chatMode === 'edit' ? `✏️ ${input.trim()}` : chatMode === 'plan' ? `🎯 ${input.trim()}` : input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    const currentInput = input.trim();
    setInput('');
    setIsTyping(true);

    try {
      // Xây dựng chuỗi lịch sử để AI có ngữ cảnh trò chuyện (nhớ được "các task đó" là gì)
      const recentHistory = messages.slice(-4).map(m => {
        let text = m.content;
        if (m.planResult) text += `\n[AI đã chọn ${m.planResult.selectedTasks.length} tasks: ${m.planResult.selectedTasks.map(t => t.title).join(', ')}]`;
        return `${m.role === 'user' ? 'Người dùng' : 'AI'}: ${text}`;
      }).join('\n\n');
      
      const contextPrompt = messages.length > 0 
        ? `Lịch sử trò chuyện gần đây:\n${recentHistory}\n\n---\nYêu cầu hiện tại của Người dùng:\n${currentInput}` 
        : currentInput;

      if (chatMode === 'generate') {
        const result = await aiService.generateTasks(projectId, contextPrompt);
        const aiMsg: AiMessage = {
          id: (Date.now() + 1).toString(),
          role: 'ai',
          content: `Tôi đã phân tích và đề xuất **${result.tasks.length} tasks** cho Epic **"${result.epicName}"**. Xem lại bên dưới và bấm **"Tạo tất cả"** nếu bạn đồng ý!`,
          timestamp: new Date(),
          taskResult: result
        };
        setMessages(prev => [...prev, aiMsg]);
        setChatMode('chat');
      } else if (chatMode === 'edit') {
        const result = await aiService.editTasks(projectId, contextPrompt);
        if (!result.edits || result.edits.length === 0) {
          const aiMsg: AiMessage = {
            id: (Date.now() + 1).toString(),
            role: 'ai',
            content: `Rất tiếc, tôi không tìm thấy task nào thỏa mãn yêu cầu của bạn, hoặc tôi không hiểu rõ ý bạn. Vui lòng thử lại với mô tả chi tiết hơn nhé!`,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, aiMsg]);
        } else {
          const aiMsg: AiMessage = {
            id: (Date.now() + 1).toString(),
            role: 'ai',
            content: `Tôi đã phân tích và đề xuất **${result.edits.length} chỉnh sửa**. Vui lòng kiểm tra và xác nhận bên dưới!`,
            timestamp: new Date(),
            editResult: result
          };
          setMessages(prev => [...prev, aiMsg]);
        }
        setChatMode('chat');
      } else if (chatMode === 'plan') {
        const result = await aiService.planSprint(projectId, contextPrompt);
        const aiMsg: AiMessage = {
          id: (Date.now() + 1).toString(),
          role: 'ai',
          content: `Tôi đã quét Backlog và đề xuất kế hoạch Sprint. Vui lòng xem qua mục tiêu và danh sách task được chọn bên dưới!`,
          timestamp: new Date(),
          planResult: result
        };
        setMessages(prev => [...prev, aiMsg]);
        setChatMode('chat');
      } else {
        const responseText = await aiService.chat(projectId, contextPrompt);
        const aiMsg: AiMessage = {
          id: (Date.now() + 1).toString(),
          role: 'ai',
          content: typeof responseText === 'string' ? responseText : String(responseText),
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMsg]);
      }
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: 'Xin lỗi, tôi đang gặp sự cố kết nối. Vui lòng thử lại sau.',
        timestamp: new Date()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleConfirmTasks = async (result: AiTaskGenerationResult) => {
    setIsConfirming(true);
    try {
      const payload: any = {
        epicName: result.epicName,
        epicDescription: result.epicDescription,
        tasks: result.tasks
      };
      if (projectMethodology === 'SCRUM') {
        if (selectedSprint === 'NEW') {
          payload.newSprintName = newSprintName;
        } else if (selectedSprint !== 'BACKLOG') {
          payload.targetSprintId = selectedSprint;
        }
      }

      const ids = await aiService.confirmTasks(projectId, payload);
      let successMsg = `✅ Đã tạo thành công **${ids.length} tasks** vào Backlog! Vào Backlog để xem và kéo vào Sprint nhé.`;
      if (projectMethodology === 'SCRUM') {
        if (selectedSprint === 'NEW') {
          successMsg = `✅ Đã tạo thành công Sprint mới **"${newSprintName}"** và gán **${ids.length} tasks** vào đó!`;
        } else if (selectedSprint !== 'BACKLOG') {
          successMsg = `✅ Đã tạo thành công **${ids.length} tasks** và gán trực tiếp vào Sprint đã chọn!`;
        }
      }

      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'ai',
        content: successMsg,
        timestamp: new Date()
      }]);
      queryClient.invalidateQueries({ queryKey: ['projectBacklog', projectId] });
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
    } catch {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'ai',
        content: '❌ Có lỗi khi tạo tasks. Vui lòng thử lại.',
        timestamp: new Date()
      }]);
    } finally {
      setIsConfirming(false);
    }
  };

  const handleConfirmEdits = async (confirmedEdits: AiTaskEditAction[]) => {
    setIsConfirming(true);
    try {
      const ids = await aiService.confirmEditTasks(projectId, { confirmedEdits });
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'ai',
        content: `✅ Đã áp dụng thành công **${ids.length} thay đổi**!`,
        timestamp: new Date()
      }]);
      setShowEditModal(false);
      queryClient.invalidateQueries({ queryKey: ['projectBacklog', projectId] });
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
    } catch {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'ai',
        content: '❌ Có lỗi khi chỉnh sửa tasks. Vui lòng thử lại.',
        timestamp: new Date()
      }]);
    } finally {
      setIsConfirming(false);
    }
  };

  const handleConfirmSprintPlan = async (plan: AiSprintPlanResult) => {
    setIsConfirming(true);
    try {
      const payload: any = {
        taskIds: plan.selectedTasks.map(t => t.id)
      };
      
      const isNew = selectedSprint === 'NEW' || selectedSprint === 'BACKLOG';
      if (isNew) {
        if (!newSprintName.trim()) throw new Error("Vui lòng nhập tên Sprint mới");
        payload.sprintName = newSprintName;
        payload.sprintGoal = plan.sprintGoal || "Sprint Planning by AI";
      } else {
        payload.targetSprintId = selectedSprint;
      }
      
      const ids = await aiService.confirmSprintPlan(projectId, payload);
      
      const successMsg = !isNew
        ? `✅ Đã chuyển thành công **${ids.length} tasks** vào Sprint hiện tại!`
        : `✅ Đã tạo Sprint mới và chuyển thành công **${ids.length} tasks**! Vào màn hình Sprint để xem nhé.`;

      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'ai',
        content: successMsg,
        timestamp: new Date()
      }]);
      queryClient.invalidateQueries({ queryKey: ['projectBacklog', projectId] });
      queryClient.invalidateQueries({ queryKey: ['sprints', projectId] });
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'Có lỗi khi tạo Sprint. Vui lòng thử lại.';
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'ai',
        content: `❌ ${errMsg}`,
        timestamp: new Date()
      }]);
    } finally {
      setIsConfirming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <Draggable
        handle=".drag-handle"
        nodeRef={draggableNodeRef}
        onDrag={() => setIsDragging(true)}
        onStop={() => {
          if (dragTimeoutRef.current) clearTimeout(dragTimeoutRef.current);
          dragTimeoutRef.current = setTimeout(() => setIsDragging(false), 150);
        }}
      >
        <div ref={draggableNodeRef} className="fixed bottom-6 right-6 z-[60] flex flex-col items-end gap-4">
          {isOpen && (
            <div
              className="w-[400px] h-[600px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800"
              style={{ animation: 'aiChatSlideUp 0.2s ease-out' }}
            >
              <div className="drag-handle cursor-move flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-white/20 rounded-lg">
                    <Icons.sparkles size={18} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[15px] leading-tight">KisaFres AI</h3>
                    <p className="text-[11px] text-blue-100 opacity-90">Trợ lý quản lý dự án thông minh</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setMessages([])} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors" title="Xóa lịch sử chat">
                    <Icons.refreshCw size={15} />
                  </button>
                  <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors" title="Đóng chat">
                    <Icons.x size={15} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-900/50 scroll-smooth">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center px-4">
                    <div className="w-16 h-16 bg-primary/20 dark:bg-blue-900/30 text-primary dark:text-primary/70 rounded-full flex items-center justify-center mb-4">
                      <Icons.sparkles size={32} />
                    </div>
                    <h4 className="font-semibold text-slate-700 dark:text-slate-200 mb-2">Xin chào! Tôi là KisaFres AI</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Tôi có thể giúp bạn tạo hàng loạt công việc mới, chỉnh sửa công việc hiện tại hoặc trả lời các câu hỏi về dự án này.
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                        msg.role === 'user' 
                          ? 'bg-primary text-white shadow-sm shadow-blue-500/20 rounded-br-none' 
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-sm border border-slate-100 dark:border-slate-700/50 rounded-bl-none'
                      }`}>
                        <div className={`text-sm ${msg.role === 'user' ? 'whitespace-pre-wrap' : 'prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-slate-100 dark:prose-pre:bg-slate-800/50 prose-pre:text-slate-800 dark:prose-pre:text-slate-200'}`}>
                          {msg.role === 'ai' ? (
                            <MarkdownPreview source={msg.content} style={{ backgroundColor: 'transparent', color: 'inherit', fontSize: '14px' }} />
                          ) : (
                            msg.content
                          )}
                        </div>

                        {msg.taskResult && (
                          <div className="mt-2 w-full">
                            <div className="bg-white dark:bg-slate-800 border border-primary/20 dark:border-blue-800 rounded-xl overflow-hidden shadow-sm">
                              <div className="px-3 py-2 bg-[#EEF2FF] dark:bg-blue-950/40 border-b border-blue-100 dark:border-blue-800 flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-primary shrink-0" />
                                <span className="text-xs font-semibold text-[#3B82F6] dark:text-blue-300 truncate">
                                  {msg.taskResult.epicName}
                                </span>
                                <span className="ml-auto text-[10px] text-primary/70 shrink-0">{msg.taskResult.tasks.length} tasks</span>
                              </div>
                              <div className="divide-y divide-slate-100 dark:divide-slate-700/50 max-h-48 overflow-y-auto">
                                {msg.taskResult.tasks.map((t, i) => (
                                  <div key={i} className="px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                    <div className="text-[13px] font-medium text-slate-700 dark:text-slate-200 line-clamp-1">{t.title}</div>
                                    <div className="flex items-center gap-3 mt-1.5">
                                      <div className="flex items-center gap-1 text-[10px] text-slate-500">
                                        <Icons.tag size={10} />
                                        <span className="capitalize">{t.type || 'Task'}</span>
                                      </div>
                                      <div className="flex items-center gap-1 text-[10px] text-slate-500">
                                        <Icons.alertCircle size={10} className={
                                          (t.priority === 'Highest' || t.priority === 'High') ? 'text-rose-500' : 
                                          t.priority === 'Medium' ? 'text-amber-500' : 'text-primary'
                                        } />
                                        <span>{t.priority || 'Medium'}</span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <div className="px-3 py-2 flex flex-col gap-2 border-t border-slate-100 dark:border-slate-700">
                                {projectMethodology === 'SCRUM' && (
                                  <div className="flex flex-col gap-1.5 mb-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nơi lưu trữ</label>
                                    <select
                                      value={selectedSprint}
                                      onChange={(e) => setSelectedSprint(e.target.value)}
                                      className="text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-lg px-2 py-1.5 focus:outline-none focus:border-primary w-full"
                                    >
                                      <option value="BACKLOG">Backlog</option>
                                      {sprints.map((s: any) => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                      ))}
                                      <option value="NEW">Tạo Sprint mới...</option>
                                    </select>
                                    {selectedSprint === 'NEW' && (
                                      <input
                                        autoFocus
                                        type="text"
                                        placeholder="Nhập tên Sprint mới"
                                        value={newSprintName}
                                        onChange={(e) => setNewSprintName(e.target.value)}
                                        className="text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 focus:outline-none focus:border-primary w-full mt-1"
                                      />
                                    )}
                                  </div>
                                )}
                                <button
                                  onClick={() => handleConfirmTasks(msg.taskResult!)}
                                  disabled={isConfirming || (selectedSprint === 'NEW' && !newSprintName.trim())}
                                  className="flex-1 py-1.5 bg-primary hover:bg-primary/90 disabled:opacity-60 text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5"
                                >
                                  {isConfirming
                                    ? <><Icons.loader size={11} className="animate-spin" /> Đang tạo...</>
                                    : <><Icons.check size={11} /> Tạo tất cả tasks</>
                                  }
                                </button>
                                <button
                                  onClick={() => setChatMode('generate')}
                                  className="text-[11px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 py-1"
                                >
                                  Hoặc yêu cầu AI chỉnh sửa lại danh sách
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {msg.editResult && (
                          <div className="mt-2 w-full">
                            <div className="bg-white dark:bg-slate-800 border border-primary/20 dark:border-blue-800 rounded-xl overflow-hidden shadow-sm">
                              <div className="px-3 py-2 bg-[#EEF2FF] dark:bg-blue-950/40 border-b border-blue-100 dark:border-blue-800 flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-primary shrink-0" />
                                <span className="text-xs font-semibold text-[#3B82F6] dark:text-blue-300">Đề xuất thay đổi</span>
                                <span className="ml-auto text-[10px] text-primary">{msg.editResult.edits.length} tasks</span>
                              </div>
                              <div className="px-3 py-2 flex flex-col gap-2 border-t border-slate-100 dark:border-slate-700">
                                <button
                                  onClick={() => {
                                    setPendingEdits(msg.editResult!.edits);
                                    setShowEditModal(true);
                                  }}
                                  className="w-full py-1.5 bg-primary hover:bg-primary/90 text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5"
                                >
                                  <Icons.edit3 size={11} /> Xem và Xác nhận Thay đổi
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {msg.planResult && (
                          <div className="mt-2 w-full">
                            <div className="bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-800 rounded-xl overflow-hidden shadow-sm">
                              <div className="px-3 py-2 bg-[#F5F3FF] dark:bg-purple-950/40 border-b border-purple-100 dark:border-purple-800 flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0" />
                                <span className="text-xs font-semibold text-[#8B5CF6] dark:text-purple-300">
                                  Đề xuất Kế hoạch Sprint
                                </span>
                              </div>
                              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700">
                                {msg.planResult.sprintGoal && (
                                  <div className="text-[11px] text-slate-600 dark:text-slate-300 mb-2 whitespace-pre-wrap"><span className="font-semibold text-slate-700 dark:text-slate-200">Mục tiêu:</span> {msg.planResult.sprintGoal}</div>
                                )}
                                <div className="text-[10px] text-purple-700 dark:text-purple-300 italic mb-2">"{msg.planResult.reasoning}"</div>
                              </div>
                              <div className="max-h-[150px] overflow-y-auto divide-y divide-slate-50 dark:divide-slate-700/50">
                                {msg.planResult.selectedTasks.map((t, i) => (
                                  <div key={i} className="px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors flex items-center gap-2 justify-between">
                                    <div className="text-[12px] text-slate-700 dark:text-slate-200 line-clamp-1 flex-1">{t.title}</div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      <div className="flex items-center gap-1 text-[9px] text-slate-500">
                                        {TYPE_ICONS[t.type.toLowerCase()] || <Icons.checkSquare size={10} />}
                                      </div>
                                      <div className="flex items-center gap-1 text-[9px] text-slate-500">
                                        <Icons.alertCircle size={10} className={
                                          (t.priority === 'Highest' || t.priority === 'High') ? 'text-rose-500' : 
                                          t.priority === 'Medium' ? 'text-amber-500' : 'text-primary'
                                        } />
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <div className="px-3 py-2 flex flex-col gap-2 border-t border-slate-100 dark:border-slate-700">
                                <div className="flex flex-col gap-1.5 mb-1">
                                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Chuyển vào Sprint</label>
                                  <select
                                    value={selectedSprint === 'BACKLOG' ? 'NEW' : selectedSprint}
                                    onChange={(e) => setSelectedSprint(e.target.value)}
                                    className="text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-lg px-2 py-1.5 focus:outline-none focus:border-purple-500 w-full"
                                  >
                                    <option value="NEW">Tạo Sprint mới...</option>
                                    {sprints.map((s: any) => (
                                      <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                  </select>
                                  {(selectedSprint === 'NEW' || selectedSprint === 'BACKLOG') && (
                                    <input
                                      autoFocus
                                      type="text"
                                      placeholder="Nhập tên Sprint mới"
                                      value={newSprintName}
                                      onChange={(e) => setNewSprintName(e.target.value)}
                                      className="text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 focus:outline-none focus:border-purple-500 w-full mt-1"
                                    />
                                  )}
                                </div>
                                <button
                                  onClick={() => handleConfirmSprintPlan(msg.planResult!)}
                                  disabled={isConfirming || ((selectedSprint === 'NEW' || selectedSprint === 'BACKLOG') && !newSprintName.trim())}
                                  className="w-full py-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5"
                                >
                                  {isConfirming
                                    ? <><Icons.loader size={11} className="animate-spin" /> Đang xử lý...</>
                                    : <><Icons.check size={11} /> Xác nhận Kéo Task</>
                                  }
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                        <span className={`text-[9px] block mt-1.5 ${msg.role === 'user' ? 'text-blue-100 text-right' : 'text-slate-400'}`}>
                          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl px-4 py-3 rounded-bl-none shadow-sm">
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" />
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0">
                {/* Generate mode hint */}
                {chatMode === 'generate' && (
                  <div className="mb-2 px-2 py-1.5 bg-[#EEF2FF] dark:bg-blue-950/30 border border-primary/20 dark:border-blue-800 rounded-lg flex items-center gap-1.5">
                    <Icons.wand2 size={11} className="text-[#3B82F6] shrink-0" />
                    <span className="text-[11px] text-[#3B82F6] dark:text-primary/70 font-medium">Chế độ tạo Tasks — mô tả tính năng bạn muốn làm</span>
                    <button onClick={() => setChatMode('chat')} className="ml-auto text-[#3B82F6] hover:text-primary">
                      <Icons.x size={11} />
                    </button>
                  </div>
                )}

                {/* Edit mode hint */}
                {chatMode === 'edit' && (
                  <div className="mb-2 px-2 py-1.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center gap-1.5">
                    <Icons.edit3 size={11} className="text-slate-500 shrink-0" />
                    <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">Chế độ sửa Tasks — chọn task và thay đổi muốn làm</span>
                    <button onClick={() => setChatMode('chat')} className="ml-auto text-slate-400 hover:text-slate-600">
                      <Icons.x size={11} />
                    </button>
                  </div>
                )}

                {/* Plan mode hint */}
                {chatMode === 'plan' && (
                  <div className="mb-2 px-2 py-1.5 bg-[#F5F3FF] dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-lg flex items-center gap-1.5">
                    <Icons.target size={11} className="text-[#8B5CF6] shrink-0" />
                    <span className="text-[11px] text-[#8B5CF6] dark:text-purple-400 font-medium">Lên kế hoạch Sprint — gom task liên quan</span>
                    <button onClick={() => setChatMode('chat')} className="ml-auto text-[#8B5CF6] hover:text-purple-600">
                      <Icons.x size={11} />
                    </button>
                  </div>
                )}

                <div className="flex items-end gap-2">
                  <button
                    onClick={() => setChatMode(prev => prev === 'generate' ? 'chat' : 'generate')}
                    title={chatMode === 'generate' ? 'Tắt chế độ tạo Tasks' : 'Bật chế độ tạo Tasks'}
                    className={`p-2 rounded-xl transition-all shrink-0 ${
                      chatMode === 'generate'
                        ? 'bg-primary text-white shadow-md shadow-blue-500/30'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-[#3B82F6] hover:bg-[#EEF2FF] dark:hover:bg-blue-950/30'
                    }`}
                  >
                    <Icons.wand2 size={16} />
                  </button>
                  <button
                    onClick={() => setChatMode(prev => prev === 'edit' ? 'chat' : 'edit')}
                    title={chatMode === 'edit' ? 'Tắt chế độ sửa Tasks' : 'Bật chế độ sửa Tasks'}
                    className={`p-2 rounded-xl transition-all shrink-0 ${
                      chatMode === 'edit'
                        ? 'bg-slate-600 text-white shadow-md shadow-slate-500/30'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Icons.edit3 size={16} />
                  </button>
                  {projectMethodology === 'SCRUM' && (
                    <button
                      onClick={() => setChatMode(prev => prev === 'plan' ? 'chat' : 'plan')}
                      title={chatMode === 'plan' ? 'Tắt chế độ lên kế hoạch' : 'Bật chế độ lên kế hoạch'}
                      className={`p-2 rounded-xl transition-all shrink-0 ${
                        chatMode === 'plan'
                          ? 'bg-purple-600 text-white shadow-md shadow-purple-500/30'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/30'
                      }`}
                    >
                      <Icons.target size={16} />
                    </button>
                  )}
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={chatMode === 'generate' ? 'Mô tả tính năng cần tạo tasks...' : chatMode === 'edit' ? 'Mô tả chỉnh sửa...' : 'Hỏi về dự án này...'}
                      className="w-full pl-4 pr-12 py-2.5 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow dark:text-white placeholder:text-slate-400"
                    />
                    <button
                      onClick={handleSend}
                      disabled={!input.trim() || isTyping}
                      className={`absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors ${
                        chatMode === 'generate' ? 'bg-primary hover:bg-primary/90' : chatMode === 'edit' ? 'bg-slate-600 hover:bg-slate-700' : 'bg-primary hover:bg-primary/90'
                      }`}
                    >
                      <Icons.monitorUp size={15} />
                    </button>
                  </div>
                </div>
                <p className="text-center text-[10px] text-slate-400 mt-2">AI có thể mắc lỗi. Vui lòng kiểm tra lại thông tin.</p>
              </div>
            </div>
          )}

          <button
            onClick={() => {
              if (isDragging) return;
              setIsOpen(!isOpen);
            }}
            className={`drag-handle cursor-move p-4 rounded-full shadow-xl transition-all duration-300 pointer-events-auto ${
              isOpen
                ? 'bg-slate-800 hover:bg-slate-900 shadow-slate-500/30 rotate-90 scale-90'
                : 'bg-gradient-to-br from-blue-600 to-blue-700 hover:scale-105 shadow-blue-500/30'
            }`}
          >
            {isOpen ? <Icons.x size={24} className="text-white" /> : <Icons.sparkles size={24} className="text-white" />}
          </button>
        </div>
      </Draggable>

      <style>{`
        @keyframes aiChatSlideUp {
          from { transform: translateY(16px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>

      <GlobalEditTaskModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        edits={pendingEdits}
        onConfirm={handleConfirmEdits}
        isSubmitting={isConfirming}
      />
    </>
  );
}
