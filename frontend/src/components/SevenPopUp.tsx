import { useEffect } from 'react';
import { Box, Card, CardMedia, IconButton, ThemeProvider, Typography } from '@mui/material';
import { unoTheme } from '../ui/unoTheme.ts';
import { getGameContext } from '../core/GameWebSocket.tsx';
import { getPopUpContext } from '../core/GamePopUps.tsx';
import ClearSharpIcon from '@mui/icons-material/ClearSharp';
import { bot_easy, bot_medium, bot_hard } from '../ui/ImagesUtils.ts';

function SevenPopUp()
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
		<ThemeProvider theme={unoTheme}>
			<Box sx={{ width: '40vw', aspectRatio: '3 / 1', ...align, border: '0.1vw solid', borderColor: 'divider', 
				borderRadius: 2, bgcolor: 'background.default', gap: '5vw', position: 'relative' }}>
				{players?.map((player) => {
						const avatar = player.bot ? 
							(player?.bot_level === 'easy' ? bot_easy
								: player.bot_level === 'medium' ? bot_medium
								: bot_hard) : player.avatar;
					if (player.id === gameState?.you.id)
						return (null)
					else {
						return (
							<Box key={player.id} sx={{ width: '5vw', aspectRatio: '1 / 1', position: 'relative', ...align }}>
								<Card elevation={0} onClick={() => sendMessage({...message, "target": player.id})} sx={{ width: '100%', aspectRatio: '1 / 1',
								overflow: 'visible', bgcolor: 'rgba(255, 255, 255, 0)', display: 'flex', justifyContent: 'center', border: 0, position: 'relative', zIndex: 5 }}>
									<CardMedia component="img" sx={{ border: 1, width: '100%', height: '100%', aspectRatio: '1 / 1',
										borderRadius: '50%', objectFit: 'cover' }} image={avatar} draggable={false}/>
									<Typography sx={{ color: 'black', bgcolor: 'orange', border: 1, zIndex: '10', position: 'absolute', 
										bottom: 0, transform: 'translateY(70%)', fontSize: 'clamp(0.5vh, 2vh, 3vh)', px: '5%' }}>{player.name}</Typography>
								</Card>
							</Box>
						)
					}
				})}
				<IconButton sx={{position: 'absolute', top: 0, right: 0}}>
					<ClearSharpIcon onClick={resetPopUpStates} sx={{ color: 'primary.main', border: 3, borderRadius: 1,
						fontSize: 'clamp(0.7rem, 2vw, 2.5rem)' }}/>
				</IconButton>
			</Box>
		</ThemeProvider>
	)
}

export default SevenPopUp
