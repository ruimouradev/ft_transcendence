import { useEffect } from 'react'
import { Box, Button } from '@mui/material'
import { getGameContext } from '../core/GameWebSocket';
import { getPopUpContext } from '../core/GamePopUps';

function Error()
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
			<Box sx={{ width: '25%', height: '50%' }}>
				<Button onClick={() => {resetPopUpStates(); console.log({"type": "play", "card": identifierID, "color": "red"})}} sx={{ height: '100%', bgcolor: 'red'}}/>
			</Box>
			<Box sx={{ width: '25%', height: '50%', ...align }}>
				<Button onClick={() => {resetPopUpStates(); console.log({"type": "play", "card": identifierID, "color": "blue"})}}  sx={{ height: '100%', bgcolor: 'blue'}}/>
			</Box>
			<Box sx={{ width: '25%', height: '50%', ...align }}>
				<Button onClick={() => {console.log({"type": "play", "card": identifierID, "color": "yellow"})}}  sx={{ height: '100%', bgcolor: 'yellow'}}/>
			</Box>
			<Box sx={{ width: '25%', height: '50%', ...align }}>
				<Button onClick={() => {console.log({"type": "play", "card": identifierID, "color": "green"})}}  sx={{ height: '100%', bgcolor: 'green'}}/>
			</Box>
		</Box>
	)
}

export default Error