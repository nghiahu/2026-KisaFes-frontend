import { useState, useEffect } from 'react';
import { 
  useTasksQuery, 
  useUpdateTaskStatusMutation, 
  useCreateTaskMutation, 
  useUpdateTaskAssigneeMutation, 
  useUpdateTaskPriorityMutation, 
  useUpdateTaskDueDateMutation, 
  useUpdateTaskTitleMutation, 
  useDeleteTaskMutation 
} from '../../../../../hooks/api/useTasks';

export function useProjectTasks(projectId: string, searchKeyword: string) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const { data: tasksData, isLoading, isError } = useTasksQuery(projectId, {
    page: currentPage,
    size: itemsPerPage,
    keyword: searchKeyword || undefined
  });

  const totalElements = tasksData?.totalElements || 0;
  const totalPages = tasksData?.totalPages || 1;
  const fetchedTasks = tasksData?.content || [];

  useEffect(() => {
    setTasks(fetchedTasks);
  }, [fetchedTasks]);

  const validCurrentPage = Math.min(Math.max(1, currentPage), Math.max(1, totalPages));
  const startIndex = (validCurrentPage - 1) * itemsPerPage;

  const updateStatusMutation = useUpdateTaskStatusMutation(projectId);
  const createTaskMutation = useCreateTaskMutation(projectId);
  const updateAssigneeMutation = useUpdateTaskAssigneeMutation(projectId);
  const updatePriorityMutation = useUpdateTaskPriorityMutation(projectId);
  const updateDueDateMutation = useUpdateTaskDueDateMutation(projectId);
  const updateTitleMutation = useUpdateTaskTitleMutation(projectId);
  const deleteTaskMutation = useDeleteTaskMutation(projectId);

  return {
    tasks,
    setTasks,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    totalElements,
    totalPages,
    startIndex,
    isLoading,
    isError,
    // Mutations
    updateStatusMutation,
    createTaskMutation,
    updateAssigneeMutation,
    updatePriorityMutation,
    updateDueDateMutation,
    updateTitleMutation,
    deleteTaskMutation
  };
}
