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

    // Optimistic update: immediately flip status to ACCEPTED in cache
    onMutate: async (id: string) => {
      // Cancel any in-flight refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: NOTIFICATION_KEYS.all });

      // Snapshot the previous value for rollback
      const previousNotifications = queryClient.getQueryData<NotificationResponse[]>(NOTIFICATION_KEYS.all);

      // Optimistically update to ACCEPTED
      queryClient.setQueryData<NotificationResponse[]>(NOTIFICATION_KEYS.all, (old) => {
        if (!old) return old;
        return old.map((n) =>
          n.id === id ? { ...n, status: 'ACCEPTED' as const, read: true } : n
        );
      });

      return { previousNotifications };
    },

    // If the API call succeeds, replace the optimistic entry with the real server response
    onSuccess: (updatedNotification) => {
      queryClient.setQueryData<NotificationResponse[]>(NOTIFICATION_KEYS.all, (old) => {
        if (!old) return [updatedNotification];
        return old.map((n) => n.id === updatedNotification.id ? updatedNotification : n);
      });
    },

    // On error, roll back to the snapshot
    onError: (_err, _id, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(NOTIFICATION_KEYS.all, context.previousNotifications);
      }
    },
  });
}

export function useDeclineInvitationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationService.declineInvitation(id),

    // Optimistic update: immediately flip status to DECLINED in cache
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: NOTIFICATION_KEYS.all });

      const previousNotifications = queryClient.getQueryData<NotificationResponse[]>(NOTIFICATION_KEYS.all);

      queryClient.setQueryData<NotificationResponse[]>(NOTIFICATION_KEYS.all, (old) => {
        if (!old) return old;
        return old.map((n) =>
          n.id === id ? { ...n, status: 'DECLINED' as const, read: true } : n
        );
      });

      return { previousNotifications };
    },

    onSuccess: (updatedNotification) => {
      queryClient.setQueryData<NotificationResponse[]>(NOTIFICATION_KEYS.all, (old) => {
        if (!old) return [updatedNotification];
        return old.map((n) => n.id === updatedNotification.id ? updatedNotification : n);
      });
    },

    onError: (_err, _id, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(NOTIFICATION_KEYS.all, context.previousNotifications);
      }
    },
  });
}

export function useMarkAsReadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationService.markAsRead(id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: NOTIFICATION_KEYS.all });
      const previousNotifications = queryClient.getQueryData<NotificationResponse[]>(NOTIFICATION_KEYS.all);
      queryClient.setQueryData<NotificationResponse[]>(NOTIFICATION_KEYS.all, (old) => {
        if (!old) return old;
        return old.map((n) => n.id === id ? { ...n, read: true } : n);
      });
      return { previousNotifications };
    },
    onSuccess: (updatedNotification) => {
      queryClient.setQueryData<NotificationResponse[]>(NOTIFICATION_KEYS.all, (old) => {
        if (!old) return [updatedNotification];
        return old.map((n) => n.id === updatedNotification.id ? updatedNotification : n);
      });
    },
    onError: (_err, _id, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(NOTIFICATION_KEYS.all, context.previousNotifications);
      }
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

