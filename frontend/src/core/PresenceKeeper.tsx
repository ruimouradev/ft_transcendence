import { useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';

// Presence socket, lights the green dot of the friends list
const MAX_RECONNECT_ATTEMPTS = 8;
const BASE_RECONNECT_DELAY = 1000;
const MAX_RECONNECT_DELAY = 30000;

function PresenceKeeper() 
{
    const { user, isLoading } = useAuth();

    const socketRef = useRef<WebSocket | null>(null);
    const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const attemptsRef = useRef(0);
    // Tells our own close (logout) from a dropped connection
    const closedByUsRef = useRef(false);

    useEffect(() => {
        const cleanup = () => {
            if (reconnectRef.current) {
                clearTimeout(reconnectRef.current);
                reconnectRef.current = null;
            }
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                const ws = socketRef.current;
                if (!ws || ws.readyState !== WebSocket.OPEN) {
                    scheduleReconnect();
                }
            }
        };

        const scheduleReconnect = () => {
            if (closedByUsRef.current) 
				return;
            if (attemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
                return;
            }
            attemptsRef.current += 1;
            const delay = Math.min(
                BASE_RECONNECT_DELAY * Math.pow(2, attemptsRef.current - 1),
                MAX_RECONNECT_DELAY,
            );
            reconnectRef.current = setTimeout(connect, delay);
        };

        function connect() {
            if (closedByUsRef.current || !user?.id) return;
            // Don't open a second socket while one is open or connecting
            const alive = socketRef.current;
            if (alive && alive.readyState !== WebSocket.CLOSED) return;
            cleanup();
            const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
            const wsUrl = `${protocol}://${window.location.host}/ws/presence`;
            const ws = new WebSocket(wsUrl);
            socketRef.current = ws;

            ws.onopen = () => {
                attemptsRef.current = 0;
            };

            ws.onclose = (event) => {
                if (socketRef.current === ws) {
                    socketRef.current = null;
                }
                if (closedByUsRef.current) {
                    return;
                }
                // 1008 means the session was refused, stop retrying
                if (event.code === 1008) {
                    attemptsRef.current = MAX_RECONNECT_ATTEMPTS;
                    return;
                }
                scheduleReconnect();
            };
        }

        // No session, presence stays off
        if (isLoading || !user?.id) {
            closedByUsRef.current = true;
            cleanup();
            if (socketRef.current) {
                socketRef.current.close(1000, 'no session');
                socketRef.current = null;
            }
            return;
        }

        closedByUsRef.current = false;
        attemptsRef.current = 0;
        document.addEventListener("visibilitychange", handleVisibilityChange);
        connect();

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            closedByUsRef.current = true;
            cleanup();
            if (socketRef.current) {
                socketRef.current.close(1000, 'presence closed');
            }
            socketRef.current = null;
        };
    }, [user?.id, isLoading]);

    return null;
}

export default PresenceKeeper
