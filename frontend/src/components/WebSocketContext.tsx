import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useAuth } from './AuthContext'; // Import your AuthContext hook

interface WebSocketContextType {
  status: 'ONLINE' | 'OFFLINE';
  lastMessage: any;
  sendMessage: (data: any) => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth(); // Get auth state
  const [status, setStatus] = useState<'ONLINE' | 'OFFLINE'>('OFFLINE');
  const [lastMessage, setLastMessage] = useState<any>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // 🛑 Do NOT attempt to connect if Auth is still checking or if the user is logged out
    if (isLoading || !isAuthenticated || !user) {
      // Cleanup existing socket if user logs out
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      setStatus('OFFLINE');
      return;
    }

    // 1. Establish WebSocket Connection using user.id
    // Note: Since you use HttpOnly cookies, the browser automatically sends the session/auth cookie!
    const wsUrl = `wss://${window.location.hostname}:8443/ws/game/${user.id}`;
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      setStatus('ONLINE');
      console.log(`WebSocket connected for user: ${user.full_name} (${user.id})`);

      // 2. Start heartbeat ping every 10 seconds
      heartbeatIntervalRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'PING' }));
        }
      }, 10000);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setLastMessage(data);
      } catch (err) {
        console.error('Failed to parse WS message:', err);
      }
    };

    ws.onclose = () => {
      setStatus('OFFLINE');
      if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
      console.log('WebSocket disconnected.');
    };

    ws.onerror = (err) => console.error('WebSocket Error:', err);

    // Clean up when user logs out or leaves app
    return () => {
      if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
      ws.close();
    };
  }, [user, isAuthenticated, isLoading]); // Re-runs when user updates or logs in!

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

// import React, { createContext, useContext, useEffect, useState, useRef } from 'react';

// const WebSocketContext = createContext(null);

// export const WebSocketProvider = ({ children }) => {
//   const [status, setStatus] = useState('OFFLINE');
//   const [lastMessage, setLastMessage] = useState(null);
//   const socketRef = useRef(null);
//   const heartbeatIntervalRef = useRef(null);

//   // Replace with actual user ID from your authentication state
//   const userId = useRef(`player_${Math.floor(Math.random() * 1000)}`).current;

//   useEffect(() => {
//     // 1. Establish single persistent WebSocket instance
//     const wsUrl = `wss://${window.location.hostname}:8443/ws/game/${userId}`;
//     const ws = new WebSocket(wsUrl);
//     socketRef.current = ws;

//     ws.onopen = () => {
//       setStatus('ONLINE');
//       console.log('Global WebSocket connected');

//       // 2. Start global heartbeat ping every 10s
//       heartbeatIntervalRef.current = setInterval(() => {
//         if (ws.readyState === WebSocket.OPEN) {
//           ws.send(JSON.stringify({ type: 'PING' }));
//         }
//       }, 10000);
//     };

//     ws.onmessage = (event) => {
//       const data = JSON.parse(event.data);
//       setLastMessage(data);
//     };

//     ws.onclose = () => {
//       setStatus('OFFLINE');
//       clearInterval(heartbeatIntervalRef.current);
//       console.log('Global WebSocket disconnected');
//     };

//     ws.onerror = (err) => console.error('WebSocket Error:', err);

//     // Clean up ONLY when the user closes/refreshes the browser tab
//     return () => {
//       clearInterval(heartbeatIntervalRef.current);
//       ws.close();
//     };
//   }, [userId]);

//   // Method to send messages over the persistent connection
//   const sendMessage = (data) => {
//     if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
//       socketRef.current.send(JSON.stringify(data));
//     } else {
//       console.warn('Cannot send message: WebSocket is not open.');
//     }
//   };

//   return (
//     <WebSocketContext.Provider value={{ status, lastMessage, sendMessage, userId }}>
//       {children}
//     </WebSocketContext.Provider>
//   );
// };

// // Custom Hook to access WebSocket state anywhere in the app
// export const useWebSocket = () => {
//   const context = useContext(WebSocketContext);
//   if (!context) {
//     throw new Error('useWebSocket must be used within a WebSocketProvider');
//   }
//   return context;
// };