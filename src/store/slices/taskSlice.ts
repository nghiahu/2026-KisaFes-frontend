import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { taskService, type TaskCreateRequest } from '../../services/task.service';

interface TaskState {
  tasks: any[];
  loading: boolean;
  error: string | null;
}

const initialState: TaskState = {
  tasks: [],
  loading: false,
  error: null,
};

export const fetchTasksByProject = createAsyncThunk(
  'task/fetchTasksByProject',
  async (projectId: string, { rejectWithValue }) => {
    try {
      const response = await taskService.getTasksByProjectId(projectId);
      return response;
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
        state.tasks = action.payload;
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
        if (action.payload) {
          state.tasks.push(action.payload);
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
      });
  },
});

export const { clearTasks } = taskSlice.actions;
export default taskSlice.reducer;
