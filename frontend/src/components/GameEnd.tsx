import { useEffect } from 'react'
import { Box, Button } from '@mui/material'
import { getGameContext } from '../core/GameWebSocket';
import { getPopUpContext } from '../core/GamePopUps';

function GameEnd()
{
	const { gameState, sendMessage } = getGameContext();
	const { identifierID, resetPopUpStates } = getPopUpContext();

	const align = {display: 'flex', justifyContent: 'center', alignItems: 'center'}

	// useEffect(() => {
	// 	if (gameState?.turn !== gameState?.you.id)
	// 		resetPopUpStates();
	// }, [gameState?.turn]);

	return (
		<Box sx={{ bgcolor: 'white', width: '99%', height: '15vh', ...align, border: 3, borderRadius: '2%' }}>
			HELLO
		</Box>
	)
}

export default GameEnd