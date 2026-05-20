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
        state.loading = true;
        state.error = null;
      })
      .addCase(createTask.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.tasks.push(action.payload);
        }
      })
      .addCase(createTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // updateTaskStatus
      .addCase(updateTaskStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTaskStatus.fulfilled, (state, action) => {
        state.loading = false;
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
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearTasks } = taskSlice.actions;
export default taskSlice.reducer;
