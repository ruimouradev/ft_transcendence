import { Box, Button, OutlinedInput , Typography } from '@mui/material';
import { useAuth } from '../core/AuthContext';
import { useState } from 'react';
import { useGameContext } from '../core/GameWebSocketContext';
import { usePopUpContext } from '../core/GamePopUpsContext';
import { menu_text, tab_text } from '../game/macrosConfig.ts';

function JoinPrivate()
{
	const [code, setCode] = useState<string>('');
	const { joinRoom } = useGameContext();
	const { handleNewError } = usePopUpContext();
	const { user } = useAuth();

	function PrivateClick()
	{
		const message = {"type": "join", "name": user?.nick_name};
		const room_id = code.trim();
		if (room_id.length === 0)
			handleNewError("invalid code");
		else if (!room_id.match(/^[0-9A-Za-z]+$/))
			handleNewError("invalid character in code");
		else
			joinRoom(code.trim(), message)
		setCode('');
	}

	return (
		<Box sx={{ width: '50%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
			<Box sx={{ height: '85%'}}>
				<Box sx={{height: '100%'}}>
					<Typography sx={{...menu_text}}>Have a Room Code?</Typography>
					<OutlinedInput sx={{...tab_text}}placeholder="Room Code" value={code} onChange={(event) => setCode(event.target.value)}/>
				</Box>
			</Box>
			<Button onClick={PrivateClick} variant="contained" disabled={code === ''} sx={{ my: 1, width: '99%', height: '15%' }}>
				<Typography sx={{ ...menu_text, fontWeight: 700 }}>JOIN WITH CODE</Typography>
			</Button>
		</Box>
	)
}

export default JoinPrivate