import { Box, Button, OutlinedInput , Typography } from '@mui/material';
import { useAuth } from '../core/AuthContext';
import { useState } from 'react';
import { useGameContext } from '../core/GameWebSocketContext';
import { menu_text, tab_text } from '../game/macrosConfig.ts';

function JoinPrivate()
{
	const [code, setCode] = useState<string>('');
	const { joinRoom } = useGameContext();
	const { user } = useAuth();

	function PrivateClick()
	{
		const message = {"type": "join", "name": user?.nick_name};
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
				<Typography sx={{ ...menu_text }}>JOIN WITH CODE</Typography>
			</Button>
		</Box>
	)
}

export default JoinPrivate