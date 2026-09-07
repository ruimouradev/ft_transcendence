import { useEffect, useRef } from 'react'
import GameRoom from './GameRoom'
import Lobby from './Lobby'
import { useAuth } from '../core/AuthContext';
import { useGameContext } from '../core/GameWebSocketContext';

function Play()
{
	const {user} = useAuth();
	const { connected, joinRoom } = useGameContext();

	const restoredRef = useRef(false);

	useEffect(() => {
		const room = sessionStorage.getItem('roomID');

		if (restoredRef.current || !user || room === null)
			return ;
		restoredRef.current = true;
		joinRoom(room, {"type": "join", "name": user.nick_name});
	}, [joinRoom, user]);

	return (connected === true ? <GameRoom /> : <Lobby />);
}

export default Play