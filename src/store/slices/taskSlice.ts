import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { taskService, type TaskCreateRequest } from '../../services/task.service';

interface TaskState {
  tasks: any[];
  totalElements: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
}

const initialState: TaskState = {
  tasks: [],
  totalElements: 0,
  totalPages: 0,
  loading: false,
  error: null,
};

export const fetchTasksByProject = createAsyncThunk(
  'task/fetchTasksByProject',
  async ({ projectId, params }: { projectId: string; params?: any }, { rejectWithValue }) => {
    try {
      const response = await taskService.getTasksByProjectId(projectId, params);
      return response; // Dữ liệu trả về sẽ có dạng { content, page, size, totalElements, totalPages }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch tasks');
    }
  }
);

export const createTask = createAsyncThunk(
  'task/createTask',
  async (data: TaskCreateRequest, { rejectWithValue }) => {
    try {
      const response = await taskService.createTask(data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create task');
    }
  }
);

export const updateTaskStatus = createAsyncThunk(
  'task/updateTaskStatus',
  async ({ taskId, statusId }: { taskId: string; statusId: string }, { rejectWithValue }) => {
    try {
      const response = await taskService.updateTaskStatus(taskId, statusId);
      return response; // Return the updated task from backend
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update task status');
    }
  }
);

export const updateTaskAssignee = createAsyncThunk(
  'task/updateTaskAssignee',
  async ({ taskId, assigneeId }: { taskId: string; assigneeId: string | null }, { rejectWithValue }) => {
    try {
      const response = await taskService.updateTaskAssignee(taskId, assigneeId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update task assignee');
    }
  }
);

export const updateTaskPriority = createAsyncThunk(
  'task/updateTaskPriority',
  async ({ taskId, priority }: { taskId: string; priority: string }, { rejectWithValue }) => {
    try {
      const response = await taskService.updateTaskPriority(taskId, priority);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update task priority');
    }
  }
);

export const updateTaskDueDate = createAsyncThunk(
  'task/updateTaskDueDate',
  async ({ taskId, dueDate }: { taskId: string; dueDate: string | null }, { rejectWithValue }) => {
    try {
      const response = await taskService.updateTaskDueDate(taskId, dueDate);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update task due date');
    }
  }
);

export const updateTaskTitle = createAsyncThunk(
  'task/updateTaskTitle',
  async ({ taskId, title }: { taskId: string; title: string }, { rejectWithValue }) => {
    try {
      const response = await taskService.updateTaskTitle(taskId, title);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update task title');
    }
  }
);

export const deleteTask = createAsyncThunk(
  'task/deleteTask',
  async (taskId: string, { rejectWithValue }) => {
    try {
      await taskService.deleteTask(taskId);
      return taskId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete task');
    }
  }
);

const taskSlice = createSlice({
  name: 'task',
  initialState,
  reducers: {
    clearTasks: (state) => {
      state.tasks = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchTasksByProject
      .addCase(fetchTasksByProject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTasksByProject.fulfilled, (state, action) => {
        state.loading = false;
        // Kiểm tra xem backend trả về PageResponse (có content) hay List (mảng)
        if (action.payload && Array.isArray(action.payload.content)) {
          state.tasks = action.payload.content;
          state.totalElements = action.payload.totalElements;
          state.totalPages = action.payload.totalPages;
        } else {
          // Fallback nếu api chưa update (vẫn trả mảng)
          state.tasks = Array.isArray(action.payload) ? action.payload : [];
          state.totalElements = state.tasks.length;
          state.totalPages = 1;
        }
      })
      .addCase(fetchTasksByProject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // createTask
      .addCase(createTask.pending, (state) => {
        state.error = null;
      })
      .addCase(createTask.fulfilled, (state, action) => {
        // We do not push to state.tasks here because it breaks pagination UI.
        // Instead, we rely on the component dispatching fetchTasksByProject to refresh the data.
        if (action.payload) {
          state.totalElements += 1; // Opting to just update total count
        }
      })
      .addCase(createTask.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // updateTaskStatus
      .addCase(updateTaskStatus.pending, (state) => {
        state.error = null;
      })
      .addCase(updateTaskStatus.fulfilled, (state, action) => {
        const updatedTask = action.payload;
        // Optionally update the task in the array if the backend returns it
        if (updatedTask && updatedTask.id) {
          const index = state.tasks.findIndex((t) => t.id === updatedTask.id);
          if (index !== -1) {
            state.tasks[index] = updatedTask;
          }
        }
      })
      .addCase(updateTaskStatus.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // updateTaskAssignee
      .addCase(updateTaskAssignee.pending, (state) => {
        state.error = null;
      })
      .addCase(updateTaskAssignee.fulfilled, (state, action) => {
        const updatedTask = action.payload;
        if (updatedTask && updatedTask.id) {
          const index = state.tasks.findIndex((t) => t.id === updatedTask.id);
          if (index !== -1) {
            state.tasks[index] = updatedTask;
          }
        }
      })
      .addCase(updateTaskAssignee.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // updateTaskPriority
      .addCase(updateTaskPriority.pending, (state) => {
        state.error = null;
      })
      .addCase(updateTaskPriority.fulfilled, (state, action) => {
        const updatedTask = action.payload;
        if (updatedTask && updatedTask.id) {
          const index = state.tasks.findIndex((t) => t.id === updatedTask.id);
          if (index !== -1) {
            state.tasks[index] = updatedTask;
          }
        }
      })
      .addCase(updateTaskPriority.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // updateTaskDueDate
      .addCase(updateTaskDueDate.pending, (state) => {
        state.error = null;
      })
      .addCase(updateTaskDueDate.fulfilled, (state, action) => {
        const updatedTask = action.payload;
        if (updatedTask && updatedTask.id) {
          const index = state.tasks.findIndex((t) => t.id === updatedTask.id);
          if (index !== -1) {
            state.tasks[index] = updatedTask;
          }
        }
      })
      .addCase(updateTaskDueDate.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // updateTaskTitle
      .addCase(updateTaskTitle.pending, (state) => {
        state.error = null;
      })
      .addCase(updateTaskTitle.fulfilled, (state, action) => {
        const updatedTask = action.payload;
        if (updatedTask && updatedTask.id) {
          const index = state.tasks.findIndex((t) => t.id === updatedTask.id);
          if (index !== -1) {
            state.tasks[index] = updatedTask;
          }
        }
      })
      .addCase(updateTaskTitle.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // deleteTask
      .addCase(deleteTask.pending, (state) => {
        state.error = null;
      })
      .addCase(deleteTask.fulfilled, (state, action) => {
        const deletedTaskId = action.payload;
        state.tasks = state.tasks.filter(t => t.id !== deletedTaskId && t.dbId !== deletedTaskId);
        state.totalElements = Math.max(0, state.totalElements - 1);
      })
      .addCase(deleteTask.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { clearTasks } = taskSlice.actions;
export default taskSlice.reducer;
