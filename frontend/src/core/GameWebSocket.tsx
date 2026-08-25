import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';

// A presença: nasce no login e morre no logout, um websocket que vive
// a sessão inteira e diz ao servidor "continuo aqui" a cada batida.
// É isto que acende o ponto verde dos amigos. Não confundir com o
// websocket do jogo, que abre e fecha com cada sala e fala outro
// protocolo. Não desenha nada nem expõe nada: se um dia precisares
// do estado da ligação no ecrã, é aqui que ele nasce.


// Need to understand better when to use this variables

// const MAX_RECONNECT_ATTEMPTS = 5;
// const BASE_RECONNECT_DELAY = 1000; // primeiro reencontro ao fim de 1s
// const HEARTBEAT_INTERVAL = 10000; // uma batida a cada 10s


const originalSetItem = sessionStorage.setItem;

sessionStorage.setItem = function (key, value) {
    console.log("sessionStorage SET:", key, value);
    console.trace();
    return originalSetItem.call(this, key, value);
};

import type { GameState } from '../game/types.ts'

type ConnectionState = 'online' | 'offline' | 'retry'

type GameContextType = {
	roomID: string | null,
	connected: ConnectionState,
	error: string | null,
	lastMessage: string | null,
	gameState: GameState | null,

	leaveRoom: () => void
	sendMessage: (message: object) => void
	joinRoom: (roomID: string, message: object) => void
}

const GameContext = createContext<GameContextType | null>(null);

export function getGameContext() {
	const context = useContext(GameContext);

	if (!context)
		throw new Error('Illegal try to acces getGameContext');
	return (context);
}

function GameWebSocket({ children }: { children: React.ReactNode }) {
	const [lastMessage, setLastMessage] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [roomID, setRoomID] = useState<string | null>(null);
	const [gameState, setGameState] = useState<GameState | null>(null);
	const [connected, setConnected] = useState<ConnectionState>('offline');

	const socketRef = useRef<WebSocket | null>(null);

	function joinRoom(roomID: string, message: object)
	{
		// Dont accept two connections from same user if it already has one
		if (socketRef.current)
			return ;
		setError(null);

		// Create new socket
		const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
		const socket = new WebSocket(`${protocol}://${window.location.host}/ws/game/${roomID}`)
		socketRef.current = socket;

		// Wait to connect
		socket.onopen = () => {
			socket.send(JSON.stringify(message));
		}

		socket.onmessage = (event) => {
			// Handle backend message
			const message = JSON.parse(event.data);

			const { type, code, msg } = message;

			switch (type) {
				case 'welcome':
					const { token } = message;
					setConnected('online');
					setRoomID(roomID);
					sessionStorage.setItem('roomID', roomID);
					sessionStorage.setItem('reconnectToken', token);
					break ;
				case 'error':
					alert(`${type} ${msg}`);
					socket.close();
					break ;
				case 'state':
					setGameState(message);
					break ;
				default:
					alert('undefined error');
			}





			console.log("game engine: ", message);
			setLastMessage(message);
		}

		socket.onerror = () => {
			// Create close function
			setError("Connection failed");
			// create a popup to notify user.
		}

		socket.onclose = () => {
			// Need to check error messages, to determine if retry or not
			socketRef.current = null;
			setConnected('offline');
			setRoomID(null);
			sessionStorage.removeItem('roomID');
			sessionStorage.removeItem('reconnectToken');
		}
	}

	function leaveRoom()
	{
		socketRef.current?.close();
	}

	function sendMessage(message: object)
	{
		if (socketRef.current?.readyState  === WebSocket.OPEN)
			socketRef.current.send(JSON.stringify(message));
	}

	return (
		<GameContext.Provider value={{ roomID, connected, error, lastMessage, gameState, joinRoom, leaveRoom, sendMessage }}>
			{ children }
		</GameContext.Provider>
	)
}

export default  GameWebSocket
