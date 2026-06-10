import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { socketService } from '../../services/socketService';

export const useProjectWebSocket = (projectId: string | undefined) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!projectId) return;

    socketService.connect(() => {
      const sub = socketService.subscribe(`/topic/project/${projectId}`, (event: any) => {
        console.log("WebSocket event received:", event);
        
        if (event && event.type) {
          switch (event.type) {
            case "CREATE_TASK":
              if (event.data) {
                queryClient.setQueryData(['tasks', projectId], (oldTasks: any[]) => {
                  if (!oldTasks) return [event.data];
                  // Ngăn trùng lặp nếu UI đã tạo task (optimistic)
                  if (oldTasks.some(t => t.id === event.data.id)) return oldTasks;
                  return [...oldTasks, event.data];
                });
              } else {
                queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
              }
              queryClient.invalidateQueries({ queryKey: ['projectBacklog', projectId] });
              break;

            case "UPDATE_TASK":
            case "TASK_MOVED":
            case "TASK_REORDERED":
              if (event.data) {
                queryClient.setQueryData(['tasks', projectId], (oldTasks: any[]) => {
                  if (!oldTasks) return [event.data];
                  return oldTasks.map(t => t.id === event.data.id ? { ...t, ...event.data } : t);
                });
              } else {
                queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
              }
              queryClient.invalidateQueries({ queryKey: ['projectBacklog', projectId] });
              break;

            case "DELETE_TASK":
              if (event.data && event.data.id) {
                queryClient.setQueryData(['tasks', projectId], (oldTasks: any[]) => {
                  if (!oldTasks) return [];
                  return oldTasks.filter(t => t.id !== event.data.id);
                });
              } else if (event.taskId) {
                queryClient.setQueryData(['tasks', projectId], (oldTasks: any[]) => {
                  if (!oldTasks) return [];
                  return oldTasks.filter(t => t.id !== event.taskId);
                });
              } else {
                queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
              }
              queryClient.invalidateQueries({ queryKey: ['projectBacklog', projectId] });
              break;

            case "UPDATE_PROJECT":
              if (event.data) {
                 queryClient.setQueryData(['project', projectId], (oldData: any) => ({
                    ...oldData,
                    ...event.data
                 }));
              } else {
                queryClient.invalidateQueries({ queryKey: ['project', projectId] });
              }
              break;

            case "SPRINT_CREATED":
            case "SPRINT_UPDATED":
            case "SPRINT_STARTED":
            case "SPRINT_COMPLETED":
            case "SPRINT_DELETED":
              // Invalidate sprints explicitly if needed
              queryClient.invalidateQueries({ queryKey: ['sprints', projectId] });
              queryClient.invalidateQueries({ queryKey: ['projectBacklog', projectId] });
              break;

            default:
              break;
          }
        }
      });

      return () => {
        if (sub) sub.unsubscribe();
      };
    });

    return () => {
      socketService.disconnect();
    };
  }, [projectId, queryClient]);
};
