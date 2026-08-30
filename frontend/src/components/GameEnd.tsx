import { Box, Button, ThemeProvider, Typography } from '@mui/material'
import { getGameContext } from '../core/GameWebSocket';
import { getPopUpContext } from '../core/GamePopUps';
import { unoTheme } from '../ui/unoTheme';
import { winner_image } from '../ui/ImagesUtils'

function GameEnd()
{
	const { gameState, sendMessage, resetGameState } = getGameContext();
	const { resetPopUpStates } = getPopUpContext();

	if (gameState === null)
		return (null);

	const align = {display: 'flex', justifyContent: 'center', alignItems: 'center'}
	let winner = "No Winner";

	for (let i = 0; i < gameState.players.length; i++)
	{
		if (gameState.winner === gameState.players[i].id)
			winner = gameState.players[i].name;
	}

	function endGame(str: string)
	{
		resetPopUpStates();
		resetGameState();
		sendMessage({"type": str})
	}

	return (
		<ThemeProvider theme={unoTheme}>
			<Box sx={{ width: '40vw', aspectRatio: '2 / 1', border: '0.1vw solid', borderColor: 'divider', borderRadius: 2, bgcolor: 'background.paper', gap: '5vw' }}>
				<Box sx={{ height: '85%', width: '100%', ...align, position: 'relative', flexDirection: 'column' }}>
					<img src={winner_image} draggable={false} style={{position: 'absolute', inset: 0, height: '100%', width: '100%', }}/>
					<Box sx={{ bgcolor: 'orange', p: 0.5, border: '0.1vw solid black', borderRadius: '5%',position: 'absolute', bottom: '15%' }}><Typography sx={{ fontSize: 'clamp(0.5vw, 1.2vw, 2vw)' }}>{winner}</Typography></Box>	
				</Box>
				<Box sx={{ height: '15%', width: '100%', ...align, gap: 3 }}>
						<Button variant="contained" onClick={() => endGame("start")} sx={{ width: '45%', height: '90%', minWidth: 0   }}>
							<Typography sx={{ fontSize: 'clamp(0.5vw, 1.2vw, 2vw)' }}>TO LOBBY</Typography>
						</Button>
						<Button variant="contained" onClick={() => endGame("leave")} sx={{ width: '45%', height: '90%', minWidth: 0 }}>
							<Typography sx={{ fontSize: 'clamp(0.5vw, 1.2vw, 2vw)' }}>QUIT</Typography>
						</Button>
				</Box>
			</Box>
		</ThemeProvider>
	)
}

export default GameEnd