import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';

import { fakeState } from '../game/fake_gamestate';

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

	closeRoomConnection: () => void
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
	const pendingRoomRef = useRef<string | null>(null);

	const { user } = useAuth();

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

			const { type } = message;

			switch (type) {
				case 'welcome':
					// const { token } = message;
					setRoomID(roomID);
					setConnected('online');
					sessionStorage.setItem('roomID', roomID);
					// sessionStorage.setItem('reconnectToken', token);
					break ;
				case 'error':
					handleErrorMessages(message);
					break ;
				case 'state':
				//	setGameState(fakeState); // FAKE TEST STATE !!!! REMOVE DEL
					setGameState(message);
					break ;
				default:
					alert('undefined error');
			}

			// DEL !
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
 
			if (pendingRoomRef.current && user) {
				const room = pendingRoomRef.current;
				pendingRoomRef.current = null;

				console.log(room, {"type": "join", "name": user.nick_name});
				joinRoom(room, {"type": "join", "name": user.nick_name})
			}

//			sessionStorage.removeItem('roomID');
//			sessionStorage.removeItem('reconnectToken');
		}
	}

	function closeRoomConnection()
	{
		socketRef.current?.close();
		sessionStorage.removeItem('roomID');
	}

	function sendMessage(message: object)
	{
		if (socketRef.current?.readyState  === WebSocket.OPEN)
		{
			console.log(message);
			socketRef.current.send(JSON.stringify(message));
		}
	}

	function handleErrorMessages({type, code, msg, room}: {type: string, code: string, msg:string, room: string | null})
	{
		switch(code)
		{
			case ("ALREADY_IN_ROOM"):
				if (room && user) {
					pendingRoomRef.current = room;
					socketRef.current?.close();
				}
				return ;
			case ("KICKED"):
			case ('ROOM_FULL'):
			case ("AUTH_REQUIRED"):
			case ('ROOM_NOT_FOUND'):
			case ("GAME_ALREADY_STARTED"):
			// AUTH_REQUIRED = "AUTH_REQUIRED"
				closeRoomConnection();			
				break ;
			// case("GAME_NOT_STARTED"):
			// 	return ;
		}
		alert(`${type} ${msg}`);

		/* ALERT
		{
			// INVALID_MESSAGE = "INVALID_MESSAGE"
			// GAME_NOT_STARTED = "GAME_NOT_STARTED"
			// CARD_NOT_IN_HAND = "CARD_NOT_IN_HAND"
			// COLOR_REQUIRED = "COLOR_REQUIRED"
			// TARGET_REQUIRED = "TARGET_REQUIRED"

			// IGNORE ?? //
				// NOT_YOUR_TURN = "NOT_YOUR_TURN"
				// INVALID_CARD = "INVALID_CARD"
				// INVALID_CHALLENGE = "INVALID_CHALLENGE"
				// INVALID_UNO = "INVALID_UNO"
				// INVALID_CATCH = "INVALID_CATCH"

			// CLOSE CONNECTION  //
				// KICKED = "KICKED"
				// ROOM_FULL = "ROOM_FULL"
				// AUTH_REQUIRED = "AUTH_REQUIRED"
				// ROOM_NOT_FOUND = "ROOM_NOT_FOUND"
				// GAME_ALREADY_STARTED = "GAME_ALREADY_STARTED"
		} 
		// HANDLE //
			// ALREADY_IN_ROOM = "ALREADY_IN_ROOM"
		*/
	}
	return (
		<GameContext.Provider value={{ roomID, connected, error, lastMessage, gameState, joinRoom, closeRoomConnection, sendMessage }}>
			{ children }
		</GameContext.Provider>
	)
}

export default  GameWebSocket
