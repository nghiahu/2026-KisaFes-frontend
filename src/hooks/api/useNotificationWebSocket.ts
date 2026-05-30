import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { socketService } from '../../services/socketService';
import { NOTIFICATION_KEYS } from './useNotifications';

export const useNotificationWebSocket = (userId: string | undefined) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    socketService.connect(() => {
      const sub = socketService.subscribe(`/topic/notifications/${userId}`, (newNotification: any) => {
        // Cập nhật optimistic list
        queryClient.setQueryData<any[]>(NOTIFICATION_KEYS.all, (old) => {
          if (!old) return [newNotification];
          // Tránh duplicate notification
          if (old.some(n => n.id === newNotification.id)) return old;
          return [newNotification, ...old];
        });

        // Tùy chọn: Gọi Toast thông báo trên giao diện nếu cần
        // toast.info(newNotification.title);
      });

      return () => {
        if (sub) sub.unsubscribe();
      };
    });

    return () => {
      socketService.disconnect();
    };
  }, [userId, queryClient]);
};
