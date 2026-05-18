export type ProjectStatus = 'ACTIVE' | 'ON HOLD' | 'COMPLETED' | 'PLANNING' | 'AT RISK';

export interface ProjectMember {
  id: string;
  name: string;
  avatar?: string;
}

export interface Project {
  id: string;
  name: string;
  code: string;
  description: string;
  category: string;
  status: ProjectStatus;
  progress: number;
  members: ProjectMember[];
  isFavorite: boolean;
  dueDate: string;
  updatedAt: string;
  lead?: ProjectMember;
  activeSprintName?: string;
  completedTasksCount?: number;
  totalTasksCount?: number;
  blockedTasksCount?: number;
  openIssuesCount?: number;
  deadlineDisplay?: string;
}
