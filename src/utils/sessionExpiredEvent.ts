/**
 * Event bus đơn giản để axiosClient (ngoài React) có thể thông báo
 * cho React component hiển thị modal "Hết phiên đăng nhập".
 */

type Listener = () => void;

let listeners: Listener[] = [];

export const sessionExpiredEvent = {
  subscribe(listener: Listener) {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  },

  emit() {
    listeners.forEach((listener) => listener());
  },
};
