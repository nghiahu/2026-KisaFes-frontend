export interface TeamMember {
  id: string;
  name: string;
  avatar?: string;
  role: 'ADMIN' | 'MEMBER';
  joinedAt: string;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  coverImage?: string;
  members: TeamMember[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTeamPayload {
  name: string;
  description?: string;
  avatar?: string;
  coverImage?: string;
}

export type TaskActivityType =
  | 'CREATE_TASK'
  | 'UPDATE_STATUS'
  | 'MOVE_SPRINT'
  | 'UPDATE_ASSIGNEE'
  | 'UPDATE_PRIORITY'
  | 'UPDATE_STORY_POINTS'
  | 'DELETE_TASK';

export interface TeamActivity {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  actionType: TaskActivityType;
  field?: string;
  oldValue?: string;
  newValue?: string;
  taskId: string;
  taskTitle: string;
  taskKey?: string;
  projectId: string;
  projectName: string;
  createdAt: string;
}

