import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService, type NotificationResponse } from '../../services/notification.service';

export const NOTIFICATION_KEYS = {
  all: ['notifications'] as const,
};

export function useNotificationsQuery() {
  return useQuery<NotificationResponse[]>({
    queryKey: NOTIFICATION_KEYS.all,
    queryFn: () => notificationService.getMyNotifications(),
  });
}

export function useAcceptInvitationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationService.acceptInvitation(id),
    onSuccess: (updatedNotification) => {
      queryClient.setQueryData<NotificationResponse[]>(NOTIFICATION_KEYS.all, (old) => {
        if (!old) return [updatedNotification];
        return old.map((n) => n.id === updatedNotification.id ? updatedNotification : n);
      });
    },
  });
}

export function useDeclineInvitationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationService.declineInvitation(id),
    onSuccess: (updatedNotification) => {
      queryClient.setQueryData<NotificationResponse[]>(NOTIFICATION_KEYS.all, (old) => {
        if (!old) return [updatedNotification];
        return old.map((n) => n.id === updatedNotification.id ? updatedNotification : n);
      });
    },
  });
}

export function useMarkAsReadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationService.markAsRead(id),
    onSuccess: (updatedNotification) => {
      queryClient.setQueryData<NotificationResponse[]>(NOTIFICATION_KEYS.all, (old) => {
        if (!old) return [updatedNotification];
        return old.map((n) => n.id === updatedNotification.id ? updatedNotification : n);
      });
    },
  });
}

export function useMarkAllAsReadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      queryClient.setQueryData<NotificationResponse[]>(NOTIFICATION_KEYS.all, (old) => {
        if (!old) return [];
        return old.map((n) => ({ ...n, read: true }));
      });
    },
  });
}
