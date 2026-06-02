import React, { createContext, useContext, useState } from 'react';
import { useProjectTasks } from './useProjectTasks';
import { useProjectFilters } from './useProjectFilters';
import { useProjectColumns } from './useProjectColumns';
import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

interface ProjectListContextProps {
  currentProject: any;
  projectId: string;
  tasksState: ReturnType<typeof useProjectTasks>;
  filtersState: ReturnType<typeof useProjectFilters>;
  columnsState: ReturnType<typeof useProjectColumns>;
  
  // Selection
  isAllSelected: boolean;
  setIsAllSelected: React.Dispatch<React.SetStateAction<boolean>>;
  selectedTaskIds: Set<string>;
  setSelectedTaskIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  excludedTaskIds: Set<string>;
  setExcludedTaskIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  handleMasterCheckboxToggle: () => void;
  handleTaskCheckboxToggle: (taskId: string) => void;

  // New Task Row
  isCreatingTask: boolean;
  setIsCreatingTask: React.Dispatch<React.SetStateAction<boolean>>;
  searchKeyword: string;
  setSearchKeyword: React.Dispatch<React.SetStateAction<string>>;
  selectedTask: any | null;
  setSelectedTask: React.Dispatch<React.SetStateAction<any | null>>;
  deleteModalTask: any | null;
  setDeleteModalTask: React.Dispatch<React.SetStateAction<any | null>>;
  deleteConfirmText: string;
  setDeleteConfirmText: React.Dispatch<React.SetStateAction<string>>;
}

const ProjectListContext = createContext<ProjectListContextProps | null>(null);

export function ProjectListProvider({ children, currentProject, projectId }: { children: React.ReactNode, currentProject: any, projectId: string }) {
  const [searchKeyword, setSearchKeyword] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const openTask = location.state?.openTask;
  
  const tasksState = useProjectTasks(projectId, searchKeyword);
  const filtersState = useProjectFilters(tasksState.tasks, currentProject);
  
  const columnsState = useProjectColumns(projectId);

  // Checkbox selection state
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [excludedTaskIds, setExcludedTaskIds] = useState<Set<string>>(new Set());

  const handleMasterCheckboxToggle = () => {
    if (isAllSelected) {
      setIsAllSelected(false);
      setSelectedTaskIds(new Set());
      setExcludedTaskIds(new Set());
    } else {
      setIsAllSelected(true);
      setSelectedTaskIds(new Set());
      setExcludedTaskIds(new Set());
    }
  };

  const handleTaskCheckboxToggle = (taskId: string) => {
    if (isAllSelected) {
      const newExcluded = new Set(excludedTaskIds);
      if (newExcluded.has(taskId)) newExcluded.delete(taskId);
      else newExcluded.add(taskId);
      setExcludedTaskIds(newExcluded);
    } else {
      const newSelected = new Set(selectedTaskIds);
      if (newSelected.has(taskId)) newSelected.delete(taskId);
      else newSelected.add(taskId);
      setSelectedTaskIds(newSelected);
    }
  };

  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [deleteModalTask, setDeleteModalTask] = useState<any | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Automatically select task if openTask is provided in location.state
  useEffect(() => {
    if (openTask && !selectedTask) {
      setSelectedTask(openTask);
      // Clean up state so it doesn't reopen if the user closes and refreshes
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [openTask, selectedTask, navigate, location.pathname]);

  const value = {
    currentProject,
    projectId,
    tasksState,
    filtersState,
    columnsState,
    searchKeyword,
    setSearchKeyword,
    isAllSelected,
    setIsAllSelected,
    selectedTaskIds,
    setSelectedTaskIds,
    excludedTaskIds,
    setExcludedTaskIds,
    handleMasterCheckboxToggle,
    handleTaskCheckboxToggle,
    isCreatingTask,
    setIsCreatingTask,
    selectedTask,
    setSelectedTask,
    deleteModalTask,
    setDeleteModalTask,
    deleteConfirmText,
    setDeleteConfirmText
  };

  return <ProjectListContext.Provider value={value}>{children}</ProjectListContext.Provider>;
}

export function useProjectList() {
  const context = useContext(ProjectListContext);
  if (!context) {
    throw new Error('useProjectList must be used within a ProjectListProvider');
  }
  return context;
}
