import { useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { usePopUpContext } from '../core/GamePopUpsContext';
import { GameContext } from './GameWebSocketContext'
import type { GameState, LastAction, Notice, Notices } from './types.ts'

const originalSetItem = sessionStorage.setItem;

sessionStorage.setItem = function (key, value) {
    return originalSetItem.call(this, key, value);
};

function GameWebSocket({ children }: { children: React.ReactNode }) {
	const [roomID, setRoomID] = useState<string | null>(null);
	const [gameState, setGameState] = useState<GameState | null>(null);
	const [connected, setConnected] = useState<boolean>(false);
	const [notices, setNotices] = useState<Notices>({});
	// const [lastAction, setLastAction] = useState<LastAction | null>(null);
	// const [oldGameState, setOldGameState] = useState<GameState | null>(null);

	const socketRef = useRef<WebSocket | null>(null);
	const pendingRoomRef = useRef<string | null>(null);
	const gameStateRef = useRef<GameState | null>(null);
	const winnerRef = useRef<string | null>(null);

	const { user, isAuthenticated  } = useAuth();
	const { handleNewError, handleNewID } = usePopUpContext();
	
	useEffect(() => {
		if (!isAuthenticated && socketRef.current)
		{
			pendingRoomRef.current = null;
			sessionStorage.removeItem('roomID');
			socketRef.current.close();
		}
	}, [isAuthenticated])

	function joinRoom(roomID: string, message: object)
	{
		// Don't create another socket while this provider already has one
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
			try {
				const message = JSON.parse(event.data);
				const { type } = message;

				// DEL
				console.log('state:')
				console.log(message);

				switch (type) {
					case 'welcome':
						setRoomID(roomID);
						setConnected(true);
						sessionStorage.setItem('roomID', roomID);
						break ;
					case 'notice':
						newNotice(message);
						break ;
					case 'error':
						handleErrorMessages(message);
						break ;
					case 'state':
						handleNewGameState(message);
						break ;
					default:
						handleNewError('invalid message type');
				}
			}
			catch(e) {
				handleNewError(`invalid message format ${e}`);
			}
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
			winnerRef.current = null;

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
		if (gameStateRef.current !== null)
			return ;
		forcedLeave();
	}

	function sendMessage(message: object)
	{
		if (socketRef.current?.readyState  === WebSocket.OPEN)
		{
			socketRef.current.send(JSON.stringify(message));
		}
	}

	function handleNewGameState(gamestate: GameState)
	{
//		handleSpecialAction();
		gameStateRef.current = gamestate;
		setGameState(gamestate);
		if (gamestate.plus4_by)
			handleNewID('plus4', '');
		if (gamestate.winner) {
			for (let i = 0; i < gamestate.players.length; i++) {
				if (gamestate.winner === gamestate.players[i].id)
					winnerRef.current = gamestate.players[i].name;
			}
		}
	}

	function handleErrorMessages({type, code, msg, room}: {type: string, code: string, msg:string, room: string | null})
	{
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
			case ("SEAT_TAKEN"):
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

	function getWinnerName()
	{
		if (winnerRef.current)
			return (winnerRef.current);
		return ('No Winner');
	}

	// function handleSpecialAction()
	// {
	// 	if (!gameState)
	// 			return;

	// 	/* 
	// 		Valid lastActions
	// 		value: +2 | reverse | skip | +4 | wild
	// 		if settings.seven_zero && (value === '7' || value === '0')

	// 		if (!Valid lastActions)
	// 			return ;

	// 		oldGameState = gameState;

	// 		setLastAction(gameState.last_action);
	// 		setOldGameState(gameState);

	// 	*/
	// }


	return (
		<GameContext.Provider value={{ roomID, connected, gameState, notices, leaveRoom, resetNotices, getWinnerName, resetGameState, joinRoom, closeRoomConnection, sendMessage }}>
			{ children }
		</GameContext.Provider>
	)
}

export default  GameWebSocket


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