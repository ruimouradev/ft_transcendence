import { useEffect } from 'react'
import { Box, Button, ThemeProvider, Typography } from '@mui/material'
import { getGameContext } from '../core/GameWebSocket';
import { getPopUpContext } from '../core/GamePopUps';

import { unoTheme } from '../ui/unoTheme';
import { winner_image } from '../ui/ImagesUtils'

function GameEnd()
{
	const { gameState, sendMessage } = getGameContext();
	const { identifierID, resetPopUpStates } = getPopUpContext();

	const align = {display: 'flex', justifyContent: 'center', alignItems: 'center'}

	// useEffect(() => {
	// 	if (gameState?.turn !== gameState?.you.id)
	// 		resetPopUpStates();
	// }, [gameState?.turn]);

	const winner = gameState?.winner ? gameState?.winner : "No Winner";

	return (
		<ThemeProvider theme={unoTheme}>
			<Box sx={{ width: '40vw', aspectRatio: '2 / 1', border: '0.1vw solid', borderColor: 'divider', borderRadius: 2, bgcolor: 'background.paper', gap: '5vw' }}>
				<Box sx={{ height: '85%', width: '100%', ...align, position: 'relative', flexDirection: 'column' }}>
					<img src={winner_image} draggable={false} style={{position: 'absolute', inset: 0, height: '100%', width: '100%', }}/>
					<Box sx={{ bgcolor: 'orange', p: 0.5, border: '0.1vw solid black', borderRadius: '5%',position: 'absolute', bottom: '15%' }}><Typography sx={{ fontSize: 'clamp(0.5vw, 1.2vw, 2vw)' }}>{winner}</Typography></Box>	
				</Box>
				<Box sx={{ height: '15%', width: '100%', ...align, gap: 3 }}>
						<Button variant="contained" onClick={() => {resetPopUpStates(); sendMessage({"type": "start"})}} sx={{ width: '45%', height: '90%', minWidth: 0   }}>
							<Typography sx={{ fontSize: 'clamp(0.5vw, 1.2vw, 2vw)' }}>TO LOBBY</Typography>
						</Button>
						<Button variant="contained" onClick={() => {resetPopUpStates(); sendMessage({"type": "leave"})}} sx={{ width: '45%', height: '90%', minWidth: 0 }}>
							<Typography sx={{ fontSize: 'clamp(0.5vw, 1.2vw, 2vw)' }}>QUIT</Typography>
						</Button>
				</Box>
			</Box>
		</ThemeProvider>
	)
}

export default GameEnd