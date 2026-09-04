import { useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';

// A presença: nasce no login e morre no logout, um websocket que vive
// a sessão inteira e diz ao servidor "continuo aqui" a cada batida.
// É isto que acende o ponto verde dos amigos. Não confundir com o
// websocket do jogo, que abre e fecha com cada sala e fala outro
// protocolo. Não desenha nada nem expõe nada: se um dia precisares
// do estado da ligação no ecrã, é aqui que ele nasce.

const MAX_RECONNECT_ATTEMPTS = 50;
const BASE_RECONNECT_DELAY = 1000; // primeiro reencontro ao fim de 1s
// const HEARTBEAT_INTERVAL = 10000; // uma batida a cada 10s

export default function PresenceKeeper() {
    const { user, isLoading } = useAuth();

    // refs porque nada disto deve redesenhar o ecrã: o socket, os
    // temporizadores e o contador de tentativas
    const socketRef = useRef<WebSocket | null>(null);
    //   const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const attemptsRef = useRef(0);
    // distingue "fechámos nós" (logout, sair da app) de "caiu a ligação"
    const closedByUsRef = useRef(false);

    useEffect(() => {
        const cleanup = () => {
            console.log('Presence: cleaning up');
            if (reconnectRef.current) {
                clearTimeout(reconnectRef.current);
                reconnectRef.current = null;
            }
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                console.log("Presence: tab is visible, checking websocket connection");
                const ws = socketRef.current;
                if (!ws || ws.readyState !== WebSocket.OPEN) {
                    scheduleReconnect();
                }
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);

        const scheduleReconnect = () => {
            if (closedByUsRef.current) { return; }
            if (attemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
                console.log('Presence: maximum reconnect attempts reached');
                return;
            }
            attemptsRef.current += 1;
            const delay = BASE_RECONNECT_DELAY * Math.pow(2, attemptsRef.current - 1);
            console.log(`Presence: reconnecting in ${delay}ms ` + `(attempt ${attemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})`);
            reconnectRef.current = setTimeout(connect, delay);
        };

        function connect() {
            if (closedByUsRef.current || !user?.id) return;
            cleanup();
            // O cookie de sessão segue sozinho no handshake, o servidor
            // confirma que o id do caminho é mesmo o da sessão
            const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
            const wsUrl = `${protocol}://${window.location.host}/ws/presence`;
            // const wsUrl = `${protocol}://${window.location.host}/ws/presence/${user.id}`;
            const ws = new WebSocket(wsUrl);
            socketRef.current = ws;

            ws.onopen = () => {
                console.log('Presence: connected');
                attemptsRef.current = 0;
            };

            ws.onclose = (event) => {
                console.log(`Presence: disconnected (code ${event.code}, reason: ${event.reason})`);
                if (socketRef.current === ws) {
                    socketRef.current = null;
                }
                if (closedByUsRef.current) {
                    console.log('Presence: closed by us');
                    return;
                }
                scheduleReconnect();
            };

            ws.onerror = () => {
                // o onclose que se segue trata do resto
                console.log('Presence: websocket error');
            };
        }

        // sem sessão (ou ainda a verificar) a presença fica desligada
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
