/**
 * Event bus đơn giản để axiosClient (ngoài React) có thể thông báo
 * cho React component hiển thị Toast thông báo vi phạm quyền.
 */

type Listener = (message: string) => void;

let listeners: Listener[] = [];

export const permissionDeniedEvent = {
  subscribe(listener: Listener) {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  },

  emit(message: string) {
    listeners.forEach((listener) => listener(message));
  },
};
