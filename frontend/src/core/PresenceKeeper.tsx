import { useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';

// A presença: nasce no login e morre no logout, um websocket que vive
// a sessão inteira e diz ao servidor "continuo aqui" a cada batida.
// É isto que acende o ponto verde dos amigos. Não confundir com o
// websocket do jogo, que abre e fecha com cada sala e fala outro
// protocolo. Não desenha nada nem expõe nada: se um dia precisares
// do estado da ligação no ecrã, é aqui que ele nasce.

const MAX_RECONNECT_ATTEMPTS = 5;
const BASE_RECONNECT_DELAY = 1000; // primeiro reencontro ao fim de 1s
const HEARTBEAT_INTERVAL = 10000; // uma batida a cada 10s

export default function PresenceKeeper() {
  const { user, isLoading } = useAuth();

  // refs porque nada disto deve redesenhar o ecrã: o socket, os
  // temporizadores e o contador de tentativas
  const socketRef = useRef<WebSocket | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attemptsRef = useRef(0);
  // distingue "fechámos nós" (logout, sair da app) de "caiu a ligação"
  const closedByUsRef = useRef(false);

  useEffect(() => {
    const cleanup = () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
      if (reconnectRef.current) {
        clearTimeout(reconnectRef.current);
        reconnectRef.current = null;
      }
    };

    function connect() {
      if (!user?.id) return;

      cleanup();

      // O cookie de sessão segue sozinho no handshake, o servidor
      // confirma que o id do caminho é mesmo o da sessão
	  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const wsUrl = `${protocol}://${window.location.host}/ws/presence/${user.id}`;
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        attemptsRef.current = 0;

        // enquanto as batidas chegarem, o servidor mostra-nos online
        heartbeatRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'PING' }));
          }
        }, HEARTBEAT_INTERVAL);
      };

      ws.onclose = (event) => {
        cleanup();

        // fecho pedido por nós, ou fecho limpo do servidor: fica fechado
        if (closedByUsRef.current || event.code === 1000 || event.code === 1001) {
          return;
        }

        // queda a meio: tenta voltar, esperando o dobro de cada vez
        // (1s, 2s, 4s, 8s, 16s) para não martelar um servidor em apuros
        if (attemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          attemptsRef.current += 1;
		  const steps = Math.min(attemptsRef.current, MAX_RECONNECT_ATTEMPTS);
          const delay = BASE_RECONNECT_DELAY * Math.pow(2, steps - 1);
          reconnectRef.current = setTimeout(connect, delay);
        }
      };

      ws.onerror = () => {
        // o onclose que se segue trata do resto
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
    connect();

    return () => {
      closedByUsRef.current = true;
      cleanup();
      if (socketRef.current) {
        socketRef.current.close(1000, 'presence closed');
      }
    };
  }, [user?.id, isLoading]);

  return null;
}
