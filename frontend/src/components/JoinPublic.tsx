import { Box, Button, Card, Typography } from '@mui/material';
import { useState } from 'react';
import { useAuth } from '../core/AuthContext';
import PersonIcon from '@mui/icons-material/Person';
import { useGameContext } from '../core/GameWebSocketContext';
import { menu_text } from '../game/macrosConfig.ts';
import type { Room } from '../core/types.ts';

function PrintRoom({room, room_flag, onSelect}: {room: Room, room_flag: boolean | null, onSelect: () => void })
{
	const bg = room_flag ? '#0f172a' : 'primary.color';

	return (
		<Card onClick={onSelect} sx={{ margin: 0.4, width: '97%', height: '10vh', bgcolor: `${bg}`, display: 'flex', borderTop: '3px solid white'}}>
			<div>Room ID: {room.code}</div>
			<h2 className="flex items-center"><PersonIcon />{room.players.length} / {room.max_players}</h2>
		</Card>
	)
}

function JoinPublic({rooms}: {rooms: Room[]})
{
	const [selected, setSelected] = useState<string | null>(null);

	const { joinRoom } = useGameContext();
	const { user } = useAuth();

	function PublicClick()
	{
		const message = {"type": "join", "name": user?.nick_name};
		console.log(message);
		setSelected(null);
		if (selected !== null)
			joinRoom(selected, message)
	}

	return (
		<Box sx={{ width: '50%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
			<Box sx={{ height: '85%', width: '100%' }}>
				<ul className="flex-1 overflow-y-auto">
					{rooms.map((room) => (
						<li key={room.code}>
							<PrintRoom room={room} room_flag={room.code === selected} 
								onSelect={() => {setSelected(prev => prev === room.code ? null : room.code)}} />
						</li>
					))}
				</ul>
			</Box>
			<Button onClick={PublicClick} variant="contained" disabled={selected === null} sx={{ my: 1, width: '99%', height: '15%' }}>
				<Typography sx={{ ...menu_text }}>JOIN</Typography>
			</Button>
		</Box>
	)
}

export default JoinPublic