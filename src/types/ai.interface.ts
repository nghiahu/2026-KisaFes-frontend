import type { AiTaskGenerationResult, AiTaskEditResult, AiSprintPlanResult } from '../services/task.service';

export interface AiMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
  taskResult?: AiTaskGenerationResult;
  editResult?: AiTaskEditResult;
  planResult?: AiSprintPlanResult;
}

export interface AiChatWidgetProps {
  projectId: string;
  projectName: string;
  projectMethodology?: 'SCRUM' | 'KANBAN';
}
