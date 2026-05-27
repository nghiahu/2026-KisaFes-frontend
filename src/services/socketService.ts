import { Client } from '@stomp/stompjs';

class SocketService {
  private client: Client | null = null;

  connect(onConnect: () => void, onError?: (err: any) => void) {
    if (this.client && this.client.connected) {
      onConnect();
      return this.client;
    }

    const socketUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`;

    this.client = new Client({
      brokerURL: socketUrl,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        console.log('Successfully connected to WebSocket broker');
        onConnect();
      },
      onStompError: (frame) => {
        console.error('STOMP protocol error:', frame.headers['message']);
        if (onError) onError(frame);
      },
      onWebSocketClose: () => {
        console.log('WebSocket connection closed');
      }
    });

    this.client.activate();
    return this.client;
  }

  subscribe(destination: string, callback: (message: any) => void) {
    if (!this.client || !this.client.connected) {
      console.warn('Socket client not connected. Subscription failed.');
      return null;
    }
    return this.client.subscribe(destination, (message) => {
      try {
        const body = JSON.parse(message.body);
        callback(body);
      } catch (err) {
        console.error('Failed to parse socket message body:', err);
        callback(message.body);
      }
    });
  }

  disconnect() {
    if (this.client) {
      this.client.deactivate();
      this.client = null;
      console.log('WebSocket client deactivated');
    }
  }
}

export const socketService = new SocketService();
