import { useEffect } from 'react';
import { Box, Card, CardMedia, IconButton, Typography } from '@mui/material';
import { useGameContext } from '../core/GameWebSocketContext';
import { usePopUpContext } from '../core/GamePopUpsContext.tsx';
import ClearSharpIcon from '@mui/icons-material/ClearSharp';
import { bot_easy, bot_medium, bot_hard } from '../ui/ImagesUtils.ts';

function SevenPopUp()
{
	const { gameState, sendMessage } = useGameContext();
	const { identifierID, resetPopUpStates } = usePopUpContext();

	const message = {"type": "play", "card": identifierID}
	const align = {display: 'flex', justifyContent: 'center', alignItems: 'center'};

	useEffect(() => {
		if (!gameState || gameState?.turn !== gameState?.you.id)
			resetPopUpStates();
	}, [gameState, gameState?.turn, gameState?.you.id, resetPopUpStates]);

	const players = gameState?.players;

	return (
			<Box sx={{ width: 'clamp(280px, 40vw, 52rem)', aspectRatio: '3 / 1', ...align, border: '0.1vw solid', borderColor: 'divider', 
				borderRadius: 2, bgcolor: 'background.default', gap: 'clamp(1rem, 5vw, 6.5rem)', position: 'relative' }}>
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
								<Card elevation={0} onClick={() => { resetPopUpStates(); sendMessage({...message, "target": player.id}) }} sx={{ width: '100%', aspectRatio: '1 / 1',
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
	)
}

export default SevenPopUp
