// Types for Components

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: ReactNode;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
  showCancel?: boolean;
}

export interface UserDropdownProps {
  user: User;
  variant?: 'landing' | 'workspace';
}

export interface CompleteSprintModalProps {
  projectId: string;
  sprint: Sprint;
  sprints: Sprint[]; // Available PLANNING sprints as destination
  onClose: () => void;
  onSuccess: () => void;
}

export interface CreateRoleModalProps {
  projectId: string;
  onClose: () => void;
  onSuccess: () => void;
  roleToEdit?: any;
}

export interface CreateTeamModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export interface GlobalCreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface GlobalEditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  edits: AiTaskEditAction[];
  onConfirm: (confirmedEdits: AiTaskEditAction[]) => void;
  isSubmitting: boolean;
}

export interface GlobalSearchDropdownProps {
  searchTerm: string;
  onClose: () => void;
}

export interface InlineTaskCreatorProps {
  onAdd: (title: string, type: string, assignee: any, dueDate: string) => void;
  onCancel: () => void;
  projectMembers: any[];
  autoFocus?: boolean;
  hideDueDate?: boolean;
}

export interface MassChangeStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (statusId: string) => void;
  statuses: { statusId: string; label: string }[];
  isSubmitting: boolean;
}

export interface MassDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  count: number;
}

export interface MassEditFieldsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    assigneeId?: string | null;
    priority?: string;
    dueDate?: string | null;
  }) => void;
  members: any[];
  isSubmitting: boolean;
}

export interface NotificationDropdownProps {
  onClose: () => void;
  onNotificationsCountChange: (count: number) => void;
  ignoreRef?: React.RefObject<HTMLElement | null>;
}

export interface SprintModalProps {
  projectId: string;
  sprint?: Sprint | null;
  onClose: () => void;
  onSuccess: (sprint: Sprint) => void;
}

export interface TaskDetailViewProps {
  task: any;
  currentProject: any;
  onClose: () => void;
  onUpdateTaskLocally: (taskId: string, updates: any) => void;
  onDeleteRequest?: (task: any) => void;
}

export interface TiptapEditorProps {
  content: string;
  onChange: (content: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

export interface WorkspaceHeaderProps {
  onOpenMobileMenu?: () => void;
}

export interface WorkspaceSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}


export interface InviteMemberModalProps {
  onClose: () => void;
  projectName: string;
  projectId: string;
}
