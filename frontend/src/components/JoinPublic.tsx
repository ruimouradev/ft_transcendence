import { Box, Button, Card, Chip, Tooltip, Typography } from '@mui/material';
import { useState } from 'react';
import { useAuth } from '../core/AuthContext';
import PersonIcon from '@mui/icons-material/Person';
import { useGameContext } from '../core/GameWebSocketContext';
import { icons_text, menu_text } from '../game/macrosConfig.ts';
import type { Room } from '../core/types.ts';
import LayersIcon from '@mui/icons-material/Layers';
import ViewCarouselIcon from '@mui/icons-material/ViewCarousel';
import Rotate90DegreesCwOutlinedIcon from '@mui/icons-material/Rotate90DegreesCwOutlined';

function PrintRoom({room, room_flag, onSelect}: {room: Room, room_flag: boolean | null, onSelect: () => void })
{
	const bg = room_flag ? '#0f172a' : 'primary.color';
	const icons_font = { fontSize: 'clamp(25px, 3vw, 35px)' };

	return (
		<Card onClick={onSelect} sx={{ margin: 0.4, width: '97%', height: '10vh', bgcolor: `${bg}`, borderTop: '3px solid white'}}>
			<Box sx={{width: '100%', height: '50%', position: 'relative'}}>
				<Box sx={{position: 'absolute', top: '1%', left: '3%', width: '50%', height: '100%', ...menu_text}}>Room ID: {room.code}</Box>
				<Typography className="align" sx={{ position: 'absolute', right: "3%", top: '1%', ...icons_text }}>
					<PersonIcon />{room.players.length} / {room.max_players}
				</Typography>
			</Box>
			<Box sx={{ width: '100%', height: '50%', display: 'flex', alignItems: 'center', position: 'relative', gap: '-1vw', left: '3%'}}>
				<Tooltip title={'Initial Hand Size'} arrow>
					<Chip icon={<ViewCarouselIcon sx={{ ...icons_font }} />} label={room.settings.hand_size} sx={{ ...icons_text, backgroundColor: 'transparent',
						'& .MuiChip-icon': { color: 'success.main',  mr: 0.5, }, '& .MuiChip-label': {pl: 0 } }} />
				</Tooltip>
				{room.settings.stacking && 
					<Tooltip title={'Stacking Option'} arrow>
						<Chip icon={<LayersIcon sx={{ ...icons_font }} />}
							sx={{ backgroundColor: 'transparent', '& .MuiChip-icon': { color: 'success.main', m: 0, p: 0 } }} />
					</Tooltip>
				}
				{room.settings.seven_zero &&  
					<Tooltip title={'Seven-Zero Option'} arrow>
						<Chip icon={<Rotate90DegreesCwOutlinedIcon sx={{ ...icons_font }} />}
							sx={{ backgroundColor: 'transparent', '& .MuiChip-icon': { color: 'success.main', m: 0, p: 0 } }}  />
					</Tooltip>					
				}
			</Box>
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
		setSelected(null);
		if (selected !== null)
			joinRoom(selected, message)
	}

	return (
		<Box sx={{ width: '50%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
			<Box sx={{ height: '85%', width: '100%' }}>
				<ul style={{ height: '100%', margin: 0, overflowY: 'auto' }}>
					{rooms.map((room) => (
						<li key={room.code}>
							<PrintRoom room={room} room_flag={room.code === selected} 
								onSelect={() => {setSelected(prev => prev === room.code ? null : room.code)}} />
						</li>
					))}
				</ul>
			</Box>
			<Button onClick={PublicClick} variant="contained" disabled={selected === null} sx={{ my: 1, width: '99%', height: '15%' }}>
				<Typography sx={{ ...menu_text, fontWeight: 700 }}>JOIN</Typography>
			</Button>
		</Box>
	)
}

export default JoinPublic