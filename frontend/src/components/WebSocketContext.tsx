import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';

type ConnectionStatus = 'ONLINE' | 'OFFLINE' | 'RECONNECTING';

interface WebSocketContextType {
  status: ConnectionStatus;
  lastMessage: any;
  sendMessage: (data: any) => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

const MAX_RECONNECT_ATTEMPTS = 5;
const BASE_RECONNECT_DELAY = 1000; // 1 second
const HEARTBEAT_INTERVAL = 10000; // 10 seconds

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [status, setStatus] = useState<ConnectionStatus>('OFFLINE');
  const [lastMessage, setLastMessage] = useState<any>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);
  const isManuallyClosedRef = useRef<boolean>(false);

  const cleanup = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    if (!user?.id) return;

    cleanup();

    const wsUrl = `wss://${window.location.hostname}:8443/ws/game/${user.id}`;
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      setStatus('ONLINE');
      reconnectAttemptsRef.current = 0; // reset reconnect attempts on successful connection
      console.log(`WebSocket connected for user: ${user.full_name || user.id}`);

      // Start heartbeat interval
      heartbeatIntervalRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'PING' }));
        }
      }, HEARTBEAT_INTERVAL);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setLastMessage(data);
      } catch (err) {
        console.error('Failed to parse WS message:', err);
      }
    };

    ws.onclose = (event) => {
      cleanup();

      // if the closure was initiated by the user (manual logout or unmount), do not attempt to reconnect
      if (isManuallyClosedRef.current) {
        setStatus('OFFLINE');
        console.log('WebSocket connection closed manually.');
        return;
      }

      // if the closure was normal (code 1000 or 1001), do not attempt to reconnect
      if (event.code === 1000 || event.code === 1001) {
        setStatus('OFFLINE');
        console.log(`WebSocket closed cleanly (code: ${event.code}).`);
        return;
      }

      // when the closure was abnormal, attempt to reconnect with exponential backoff
      if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
        setStatus('RECONNECTING');
        reconnectAttemptsRef.current += 1;

        const delay = BASE_RECONNECT_DELAY * Math.pow(2, reconnectAttemptsRef.current - 1);
        console.warn(
          `WebSocket abnormal closure (code: ${event.code}). Reconnecting in ${delay / 1000}s (Attempt ${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})...`
        );

        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, delay);
      } else {
        setStatus('OFFLINE');
        console.error('Max WebSocket reconnection attempts reached. Giving up.');
      }
    };

    ws.onerror = (err) => {
      console.error('WebSocket Error:', err);
    };
  }, [user?.id, cleanup]);

  useEffect(() => {
    // 🛑 when unlogged in or user is null, close the connection and cleanup
    if (isLoading || !user?.id) {
      isManuallyClosedRef.current = true;
      cleanup();
      if (socketRef.current) {
        socketRef.current.close(1000, 'User logged out or unauthorized');
        socketRef.current = null;
      }
      console.log('set off line;WebSocket connection closed due to logout or unauthenticated state.');
      setStatus('OFFLINE');
      return;
    }

    isManuallyClosedRef.current = false;
    connect();

    return () => {
      isManuallyClosedRef.current = true;
      console.log('WebSocketProvider unmounting, cleaning up...');
      cleanup();
      if (socketRef.current) {
        socketRef.current.close(1000, 'Provider unmounted');
      }
    };
  }, [user?.id, isAuthenticated, isLoading, connect, cleanup]);

  const sendMessage = (data: any) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(data));
    } else {
      console.warn('Cannot send message: WebSocket is not open.');
    }
  };

  return (
    <WebSocketContext.Provider value={{ status, lastMessage, sendMessage }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) throw new Error('useWebSocket must be used within WebSocketProvider');
  return context;
};