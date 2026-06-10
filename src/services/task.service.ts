import axiosClient from "./axiosClient";

export interface TaskCreateRequest {
  projectId: string;
  sprintId?: string;
  title: string;
  description?: string;
  statusId?: string;
  priority?: string;
  storyPoints?: number;
  assigneeId?: string;
  type?: string;
  dueDate?: string | null;
}

export const taskService = {
  getTasksByProjectId: async (projectId: string, params?: any): Promise<any> => {
    const response = await axiosClient.get(`/tasks/project/${projectId}`, { params });
    return response.data;
  },
  getMyTasks: async (params?: any): Promise<any> => {
    const response = await axiosClient.get(`/tasks/my-tasks`, { params });
    return response.data;
  },
  createTask: async (data: TaskCreateRequest): Promise<any> => {
    const response = await axiosClient.post('/tasks', data);
    return response.data;
  },
  updateTaskStatus: async (taskId: string, statusId: string): Promise<any> => {
    const response = await axiosClient.patch(`/tasks/${taskId}/status?statusId=${statusId}`);
    return response.data;
  },
  updateTaskAssignee: async (taskId: string, assigneeId: string | null): Promise<any> => {
    const params = assigneeId ? `?assigneeId=${assigneeId}` : '';
    const response = await axiosClient.patch(`/tasks/${taskId}/assignee${params}`);
    return response.data;
  },
  updateTaskPriority: async (taskId: string, priority: string): Promise<any> => {
    const response = await axiosClient.patch(`/tasks/${taskId}/priority?priority=${encodeURIComponent(priority)}`);
    return response.data;
  },
  updateTaskStoryPoints: async (taskId: string, points: number | null): Promise<any> => {
    const params = points !== null ? `?storyPoints=${points}` : '';
    const response = await axiosClient.patch(`/tasks/${taskId}/story-points${params}`);
    return response.data;
  },
  updateTaskDueDate: async (taskId: string, dueDate: string | null): Promise<any> => {
    const params = dueDate ? `?dueDate=${encodeURIComponent(dueDate)}` : '';
    const response = await axiosClient.patch(`/tasks/${taskId}/due-date${params}`);
    return response.data;
  },
  updateTaskTitle: async (taskId: string, title: string): Promise<any> => {
    const response = await axiosClient.patch(`/tasks/${taskId}/title?title=${encodeURIComponent(title)}`);
    return response.data;
  },
  updateTaskDescription: async (taskId: string, description: string): Promise<any> => {
    const response = await axiosClient.patch(`/tasks/${taskId}/description`, { description });
    return response.data;
  },
  updateTaskTeam: async (taskId: string, teamId: string | null): Promise<any> => {
    const response = await axiosClient.patch(`/tasks/${taskId}/team`, { teamId });
    return response.data;
  },
  uploadAttachment: async (taskId: string, file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axiosClient.post(`/tasks/${taskId}/attachments`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  deleteAttachment: async (taskId: string, attachmentId: string): Promise<any> => {
    const response = await axiosClient.delete(`/tasks/${taskId}/attachments/${attachmentId}`);
    return response.data;
  },
  addSubTask: async (taskId: string, title: string): Promise<any> => {
    const response = await axiosClient.post(`/tasks/${taskId}/subtasks`, { title });
    return response.data;
  },
  toggleSubTask: async (taskId: string, subtaskId: string): Promise<any> => {
    const response = await axiosClient.patch(`/tasks/${taskId}/subtasks/${subtaskId}/toggle`);
    return response.data;
  },
  deleteSubTask: async (taskId: string, subtaskId: string): Promise<any> => {
    const response = await axiosClient.delete(`/tasks/${taskId}/subtasks/${subtaskId}`);
    return response.data;
  },
  deleteTask: async (taskId: string): Promise<any> => {
    const response = await axiosClient.delete(`/tasks/${taskId}`);
    return response.data;
  }
};

// ─── AI Service methods (Phase 2) ───────────────────────────────────────────

export interface AiGeneratedTask {
  title: string;
  description: string;
  type: 'task' | 'story' | 'bug';
  priority: 'Lowest' | 'Low' | 'Medium' | 'High' | 'Highest';
  storyPoints: number;
  suggestedAssigneeId: string | null;
  suggestedAssigneeName: string | null;
  dueDate?: string;
}

export interface AiConfirmTasksRequest {
  epicName?: string;
  epicDescription?: string;
  tasks: AiGeneratedTask[];
  targetSprintId?: string;
  newSprintName?: string;
}

export interface AiTaskGenerationResult {
  epicName: string;
  epicDescription: string;
  tasks: AiGeneratedTask[];
}

export interface AiTaskEditAction {
  taskId: string;
  taskKey: string;
  fieldToChange: string;
  oldValue: string;
  newValue: string;
  oldValueDisplay?: string;
  newValueDisplay?: string;
  reason: string;
}

export interface AiTaskEditResult {
  edits: AiTaskEditAction[];
}

export interface AiPlanTask {
  id: string;
  taskKey: string;
  title: string;
  type: string;
  priority: string;
}

export interface AiSprintPlanResult {
  sprintName: string;
  sprintGoal: string;
  reasoning: string;
  selectedTasks: AiPlanTask[];
}

export interface AiConfirmSprintPlanRequest {
  sprintName: string;
  sprintGoal: string;
  taskIds: string[];
}

export const aiService = {
  generateTasks: async (projectId: string, description: string): Promise<AiTaskGenerationResult> => {
    const response = await axiosClient.post(`/ai/generate-tasks?projectId=${projectId}`, { message: description });
    return response.data;
  },
  confirmTasks: async (projectId: string, data: { epicName: string; epicDescription: string; tasks: AiGeneratedTask[] }): Promise<string[]> => {
    const response = await axiosClient.post(`/ai/confirm-tasks?projectId=${projectId}`, data);
    return response.data;
  },
  chat: async (projectId: string, message: string): Promise<string> => {
    const response = await axiosClient.post(`/ai/chat?projectId=${projectId}`, { message });
    return response.data;
  },
  editTasks: async (projectId: string, message: string): Promise<AiTaskEditResult> => {
    const response = await axiosClient.post(`/ai/edit-tasks?projectId=${projectId}`, { message });
    return response.data;
  },
  confirmEditTasks: async (projectId: string, data: { confirmedEdits: AiTaskEditAction[] }): Promise<string[]> => {
    const response = await axiosClient.post(`/ai/confirm-edit-tasks?projectId=${projectId}`, data);
    return response.data;
  },
  planSprint: async (projectId: string, message: string): Promise<AiSprintPlanResult> => {
    const response = await axiosClient.post(`/ai/plan-sprint?projectId=${projectId}`, { message });
    return response.data;
  },
  confirmSprintPlan: async (projectId: string, data: AiConfirmSprintPlanRequest): Promise<string[]> => {
    const response = await axiosClient.post(`/ai/confirm-sprint-plan?projectId=${projectId}`, data);
    return response.data;
  }
};

