import { useEffect } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { useGameContext } from '../core/GameWebSocketContext';
import { usePopUpContext } from '../core/GamePopUpsContext';
import { winner_image } from '../ui/ImagesUtils';

function GameEndPopUp()
{
	const { gameState, leaveRoom, sendMessage, getWinnerName } = useGameContext();
	const { resetPopUpStates } = usePopUpContext();

	useEffect(() => {
		if (gameState === null)
			resetPopUpStates();
		
	}, [gameState, resetPopUpStates])

	if (gameState === null)
		return (null);

	const align = {display: 'flex', justifyContent: 'center', alignItems: 'center'}
	const winner = getWinnerName();

	function endGame(str: string)
	{	
		if (str === 'start')
			sendMessage({"type": str})
		else
			leaveRoom();
		resetPopUpStates();
	}

	return (
		<>
			<Box sx={{ width: 'clamp(260px, 40vw, 52rem)', aspectRatio: '2 / 1', border: '0.1vw solid', borderColor: 'divider', borderRadius: 2,
					bgcolor: 'background.default', gap: 'clamp(1rem, 5vw, 6.5rem)' }}>
				<Box sx={{ height: '85%', width: '100%', ...align, position: 'relative', flexDirection: 'column' }}>
					<img src={winner_image} draggable={false} style={{position: 'absolute', inset: 0, height: '100%', width: '100%', }}/>
					<Box sx={{ bgcolor: 'orange', p: 0.5, border: '0.1vw solid black', borderRadius: '5%',position: 'absolute', bottom: '15%' }}>
						<Typography sx={{ fontSize: 'clamp(0.9rem, 2vw, 2.3rem)' }}>{winner}</Typography>
					</Box>
				</Box>
				<Box sx={{ height: '15%', width: '100%', ...align, gap: 3 }}>
						<Button variant="contained" onClick={() => endGame("start")} sx={{ width: '45%', height: '90%', minWidth: 0   }}>
							<Typography sx={{ fontSize: 'clamp(0.9rem, 1.2vw, 2rem)', fontWeight: 700 }}>PLAY AGAIN</Typography>
						</Button>
						<Button variant="contained" onClick={() => endGame("leave")} sx={{ width: '45%', height: '90%', minWidth: 0 }}>
							<Typography sx={{ fontSize: 'clamp(0.9rem, 1.2vw, 2rem)', fontWeight: 700 }}>QUIT</Typography>
						</Button>
				</Box>
			</Box>
		</>
	)
}

export default GameEndPopUp