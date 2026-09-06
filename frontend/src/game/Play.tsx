import { useEffect } from 'react'
import GameRoom from './GameRoom'
import Lobby from './Lobby'
import { useAuth } from '../core/AuthContext';
import { useGameContext } from '../core/GameWebSocketContext';

function Play()
{
	const {user} = useAuth();
	const { connected, joinRoom } = useGameContext();

	useEffect(() => {
		const room = sessionStorage.getItem('roomID');
		const message = {"type": "join", "name": user?.nick_name};

		if (room !== null)
			joinRoom(room, message);
	}, [joinRoom, user?.nick_name]);

	return (connected === true ? <GameRoom /> : <Lobby />);
}

export default Play