import { createContext, useContext, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { getPopUpContext } from '../core/GamePopUps';

const originalSetItem = sessionStorage.setItem;

sessionStorage.setItem = function (key, value) {
    console.log("sessionStorage SET:", key, value);
    console.trace();
    return originalSetItem.call(this, key, value);
};

import type { GameState } from '../game/types.ts'

type GameContextType = {
	roomID: string | null,
	connected: boolean,
	gameState: GameState | null,
	notices: Notices,
	// notice: Notice | null,

	leaveRoom: () => void,
	resetGameState: () => void,
	closeRoomConnection: () => void,
	// resetNotice: () => void,
	resetNotices: (id: string) => void,
	sendMessage: (message: object) => void,
	joinRoom: (roomID: string, message: object) => void
}

type Notice = {
	kind: 'emote' | 'uno' | 'catch',
	sender: string,
	icon: number
}

type Notices = {
	[id: string]: Notice;
}

const GameContext = createContext<GameContextType | null>(null);

export function getGameContext() 
{
	const context = useContext(GameContext);

	if (!context)
		throw new Error('Illegal try to acces getGameContext');
	return (context);
}

function GameWebSocket({ children }: { children: React.ReactNode }) {
	const [roomID, setRoomID] = useState<string | null>(null);
	const [gameState, setGameState] = useState<GameState | null>(null);
	const [connected, setConnected] = useState<boolean>(false);
	const [notices, setNotices] = useState<Notices>({});
	// const [notice, setNotice] = useState<Notice | null>(null);

	const socketRef = useRef<WebSocket | null>(null);
	const pendingRoomRef = useRef<string | null>(null);
	const gameStateRef = useRef<GameState | null>(null);

	const { user } = useAuth();
	const { handleNewError } = getPopUpContext();

	function joinRoom(roomID: string, message: object)
	{
		// DEL
		console.log("connected: ", connected);
		console.log("roomID: ", roomID);
		console.log("socketRef: ", socketRef);
		console.log("pendingRoomRef: ", pendingRoomRef);
		console.log("sessionStorage: ", sessionStorage);

		// Dont accept two connections from same user if it already has one
		if (socketRef.current)
			return ;

		// Create new socket
		const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
		const socket = new WebSocket(`${protocol}://${window.location.host}/ws/game/${roomID}`)
		socketRef.current = socket;

		// Determines a connection failed after 5s without server response
		const timeout = setTimeout(() => {
			if (socket.readyState === WebSocket.CONNECTING) {
				socket.close();
			}
		}, 5000);

		socket.onopen = () => {
			clearTimeout(timeout);
			socket.send(JSON.stringify(message));
		}

		socket.onmessage = (event) => {
			// Handle backend message
			const message = JSON.parse(event.data);
			const { type } = message;

			switch (type) {
				case 'welcome':
					setRoomID(roomID);
					setConnected(true);
					sessionStorage.setItem('roomID', roomID);
					break ;
				case 'notice':
//					setNotice(message);
					newNotice(message);
					break ;
				case 'error':
					handleErrorMessages(message);
					break ;
				case 'state':
					gameStateRef.current = message;
					setGameState(message);
					break ;
				default:
					alert('undefined error');
			}

			// DEL !
			console.log("game engine: ", message);
		}

		socket.onerror = () => {
			handleNewError("Connection failed");
		}

		socket.onclose = () => {
			// Need to check error messages, to determine if retry or not
			resetAllNotices();
			socketRef.current = null;
			clearTimeout(timeout);
			setConnected(false);
			resetGameState();
			setRoomID(null);

			console.log('socket closed')

			if (pendingRoomRef.current && user) {
				const room = pendingRoomRef.current;
				pendingRoomRef.current = null;
				joinRoom(room, {"type": "join", "name": user.nick_name})
			}
		}
	}

	function closeRoomConnection()
	{
		socketRef.current?.close();
	}

	function leaveRoom()
	{
		pendingRoomRef.current = null;
		sessionStorage.removeItem('roomID');
		sendMessage({"type": "leave"});
	}

	function forcedLeave()
	{
		socketRef.current?.close();
		pendingRoomRef.current = null;
		sessionStorage.removeItem('roomID');
	}

	function specialClose()
	{
		console.log('ref: ');
		console.log(gameStateRef.current)

		if (gameStateRef.current !== null)
			return ;
		forcedLeave();
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
		// console.log('ERROR CODE:', code, JSON.stringify(code));
		if (type !== 'error')
			return ;
		switch(code)
		{
			case ("ALREADY_IN_ROOM"):
				if (room && user) {
					pendingRoomRef.current = room;
					socketRef.current?.close();
					msg = `redirected to Room ${room}`;
				}
				break ;
			case ("KICKED"):
			case ('ROOM_FULL'):
			case ("AUTH_REQUIRED"):
			case ('ROOM_NOT_FOUND'):
			case ("GAME_ALREADY_STARTED"):
				forcedLeave();
				break ;
			case ("INVALID_MESSAGE"):
				specialClose();
				break ;
		}
		handleNewError(msg);

		/*
			HANDLE
				ALREADY_IN_ROOM = "ALREADY_IN_ROOM"

			JUST PROMPT
				NOT_YOUR_TURN = "NOT_YOUR_TURN"
				INVALID_CARD = "INVALID_CARD"
				COLOR_REQUIRED = "COLOR_REQUIRED"
				TARGET_REQUIRED = "TARGET_REQUIRED"
				CARD_NOT_IN_HAND = "CARD_NOT_IN_HAND"
				INVALID_CATCH = "INVALID_CATCH"
				INVALID_UNO = "INVALID_UNO"
				INVALID_CHALLENGE = "INVALID_CHALLENGE"
				GAME_NOT_STARTED = "GAME_NOT_STARTED"

			SPECIAL
				INVALID_MESSAGE = "INVALID_MESSAGE"

				GameState ? (JUST PROMPT) : (FULL CLEAR)

			BACKEND CLOSE (FULL CLEAR)
				KICKED = "KICKED"
				ROOM_FULL = "ROOM_FULL"
				AUTH_REQUIRED = "AUTH_REQUIRED"
				ROOM_NOT_FOUND = "ROOM_NOT_FOUND"
				GAME_ALREADY_STARTED = "GAME_ALREADY_STARTED"
		*/
	}

	function resetGameState()
	{
		gameStateRef.current = null;
		setGameState(null);
	}

	function newNotice(message: Notice)
	{
		if (!gameStateRef.current)
			return ;

		setNotices(prev => ({
			...prev,
			[message.sender]: message
		}))
	}

	function resetNotices(id: string)
	{
		setNotices(prev => {
			const tmp = {...prev};
			delete tmp[id];
			return tmp;
		})
	}

	function resetAllNotices()
	{
		setNotices({});
	}

	return (
		<GameContext.Provider value={{ roomID, connected, gameState, notices, leaveRoom, resetNotices, resetGameState, joinRoom, closeRoomConnection, sendMessage }}>
			{ children }
		</GameContext.Provider>
	)
}

export default  GameWebSocket
