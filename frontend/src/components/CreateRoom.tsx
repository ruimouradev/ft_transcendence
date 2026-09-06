import { useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { useAuth } from '../core/AuthContext';
import { useGameContext } from '../core/GameWebSocketContext';
import { menu_text } from '../game/macrosConfig.ts';
import HandCountSettings from './HandCountSettings';
import StackingSettings  from './StackingSettings';
import PlayerCountSettings  from './PlayerCountSettings';
import SevenZeroSettings  from './SevenZeroSettings';
import PrivacySettings  from './PrivacySettings';
import type { Room } from '../core/types.ts';

// Generates a 5 character Uppercase Hash
function createRoomID({ rooms }: { rooms: Room[]})
{
	function checkRoom() {
		for (let i =0; i < rooms?.length; i++) {
			if (rooms[i].code === hash)
				return (true);
		}
		return (false);
	}

	let hash = '';
	do {
		hash = Math.random().toString(36).slice(2, 7).toUpperCase();
	}
	while (hash.length < 5 || checkRoom());
	return (hash);
}

function CreateRoom({ rooms }: { rooms: Room[]})
{
	const defaultTooltip = 'Hover on options for a brief explanation';
	const [optionsTooltip, setOptionsTooltip] = useState<string>(defaultTooltip);

	const [handCount, setHandCount] = useState<number>(7);
	const [playerCount, setPlayerCount] = useState<number>(4);
	const [stacking, setStacking] = useState<boolean>(false);
	const [sevenZero, setSevenZero] = useState<boolean>(false);
	const [privacy, setPrivacy] = useState<boolean>(true);

	const { user } = useAuth();

	const { joinRoom } = useGameContext();

	function CreateRoom()
	{
		const room_id = createRoomID({rooms});
		const message = { "type": "create",
					"name": user?.nick_name,
					"settings": { "hand_size": handCount,
									"stacking": stacking,
									"seven_zero": sevenZero,
									"max_players": playerCount,
									"public": privacy }}
		joinRoom(room_id, message);
	}

	return (
		<Box sx={{ width: '100%', height: '100%' }}>
			<Box sx={{ width: '60%', height: '85%', display: 'flex', flexDirection: 'column', justifyContent: 'center', mx: 'auto' }}>
				<Box sx={{ height: '25%', borderBottom: '1pxsolid', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'auto', whiteSpace: 'pre-line', textAlign: 'center' }} >
					<Typography sx={{ fontSize: 'clamp(0.8rem, 1.15vw, 2rem)' }}>{optionsTooltip}</Typography>
				</Box>
				<HandCountSettings handCount={handCount} setHandCount={setHandCount} defaultTooltip={defaultTooltip} setOptionsTooltip={setOptionsTooltip} />
				<StackingSettings stacking={stacking} setStacking={setStacking} defaultTooltip={defaultTooltip} setOptionsTooltip={setOptionsTooltip} /> 
				<PlayerCountSettings playerCount={playerCount} setPlayerCount={setPlayerCount} defaultTooltip={defaultTooltip} setOptionsTooltip={setOptionsTooltip} />
				<SevenZeroSettings sevenZero={sevenZero} setSevenZero={setSevenZero} defaultTooltip={defaultTooltip} setOptionsTooltip={setOptionsTooltip} />
				<PrivacySettings privacy={privacy} setPrivacy={setPrivacy} defaultTooltip={defaultTooltip} setOptionsTooltip={setOptionsTooltip} />
			</Box>
				<Button onClick={CreateRoom} variant="contained" sx={{ my:'-0.5%', width: '100%', height: '15%', mx: 'auto' }}>
					<Typography sx={{ ...menu_text, fontWeight: 700 }}>CREATE ROOM</Typography>
				</Button>
		</Box>
	)
}

export default CreateRoom