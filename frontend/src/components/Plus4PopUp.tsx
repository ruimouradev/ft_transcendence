import { useEffect } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { useGameContext } from '../core/GameWebSocketContext';
import { usePopUpContext } from '../core/GamePopUpsContext';
import  { tab_text } from '../game/macrosConfig.ts'

function Plus4PopUp()
{
	const { gameState, sendMessage } = useGameContext();
	const { resetPopUpStates } = usePopUpContext();

	const box_options = {width: '50%', aspectRatio: '1.3 / 1'};
	const box_shadow = {boxSizing: 'content-box', borderLeft: '0.5vw solid black',
		borderBottom: '0.5vw solid black', borderTop: '0.15vw solid black', borderRight: '0.15vw solid black'};
	const align = {display: 'flex', justifyContent: 'center', alignItems: 'center'};

	const button_font = {fontSize: 'clamp(0.2rem, 1.4vh, 1rem)'};

	useEffect(() => {
		if (!gameState || gameState?.turn !== gameState?.you.id)
			resetPopUpStates();
	}, [gameState, gameState?.turn, gameState?.you.id, resetPopUpStates]);

	return (
			<Box sx={{ width: 'clamp(320px, 60vw, 900px)', aspectRatio: '3 / 1', ...align, border: '0.1vw solid', borderColor: 'divider', borderRadius: 2,
				bgcolor: 'background.default', position: 'relative' }}>
				<Box sx={{ width: '50%', height: '100%', ...align }}>
					<Typography sx={{ position: 'absolute', top: '10%', ...tab_text }}>CHALLENGE</Typography>
					<Button variant="contained" onClick={() => {resetPopUpStates(); sendMessage({"type": "challenge"})}}
						sx={{ ...box_options, minWidth: 0, p: 0, ...box_shadow, ...align, flexDirection: 'column', gap: '5%' }}>
							<Typography sx={{...button_font}}>Lose: +6 </Typography>
							<Typography sx={{...button_font}}>Win: +0 </Typography>
					</Button>
				</Box>
				<Box sx={{ ...box_options, ...align }}>
					<Typography sx={{ position: 'absolute', top: '10%', ...tab_text }}>DRAW</Typography>
					<Button variant="contained" onClick={() => {resetPopUpStates(); sendMessage({"type": "draw"})}}
						sx={{ ...box_options, minWidth: 0, p: 0, fontSize: 'clamp(0.2rem, 1.4vh, 1rem)', ...box_shadow, ...align, flexDirection: 'column' }}>
						<Typography sx={{...button_font}}>Draw: +4 </Typography>
					</Button>
				</Box>
			</Box>
	)
}

export default Plus4PopUp