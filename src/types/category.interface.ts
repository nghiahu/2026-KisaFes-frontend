export interface CategoryStatus {
  statusId: string;
  label: string;
  category: 'TO_DO' | 'IN_PROGRESS' | 'DONE';
  color: string;
}

export interface CategoryRole {
  id: string;
  name: string;
  permissions: string[];
}

export interface CategoryBoardColumn {
  name: string;
  mappedStatusIds: string[];
  defaultStatusId: string;
  position: number;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  defaultStatuses: CategoryStatus[];
  defaultRoles: CategoryRole[];
  defaultBoardColumns: CategoryBoardColumn[];
}
