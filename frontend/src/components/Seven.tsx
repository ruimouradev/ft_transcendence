import { useEffect } from 'react'
import { Box, Card, CardMedia, Typography } from '@mui/material'
import { getGameContext } from '../core/GameWebSocket';
import { getPopUpContext } from '../core/GamePopUps';

function Seven()
{
	const { gameState, sendMessage } = getGameContext();
	const { identifierID, resetPopUpStates } = getPopUpContext();

	const message = {"type": "play", "card": identifierID}
	const align = {display: 'flex', justifyContent: 'center', alignItems: 'center'};

	useEffect(() => {
		if (gameState?.turn !== gameState?.you.id)
			resetPopUpStates();
	}, [gameState?.turn]);

	const players = gameState?.players;

	return (
		<Box sx={{ width: '40vw', aspectRatio: '3 / 1', ...align,
			border: '0.1vw solid', borderColor: 'divider', borderRadius: 2, bgcolor: '#1C1221', gap: '5vw' }}>
			{players?.map((player) => {
				if (player.id === gameState?.you.id)
					return (null)
				else {
					return (
						<Box key={player.id} sx={{ width: '5vw', aspectRatio: '1 / 1', position: 'relative', ...align }}>
							<Card elevation={0} onClick={() => sendMessage({...message, "target": player.id})} sx={{ width: '100%', aspectRatio: '1 / 1',
							overflow: 'visible', bgcolor: 'rgba(255, 255, 255, 0)', display: 'flex', justifyContent: 'center', border: 0, position: 'relative', zIndex: 5 }}>
								<CardMedia component="img" sx={{ border: 1, width: '100%', height: '100%', aspectRatio: '1 / 1',
									borderRadius: '50%', objectFit: 'cover' }} image={player.avatar} draggable={false}/>
								<Typography sx={{ color: 'black', bgcolor: 'orange', border: 1, zIndex: '10', position: 'absolute', 
									bottom: 0, transform: 'translateY(70%)', fontSize: 'clamp(0.5vh, 2vh, 3vh)' }}>{player.name}</Typography>
							</Card>
						</Box>
					)
				}
			})}
		</Box>
	)
}

export default Seven
