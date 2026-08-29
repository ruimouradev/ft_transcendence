import { useEffect } from 'react'
import { Box } from '@mui/material'
import { getGameContext } from '../core/GameWebSocket';
import { getPopUpContext } from '../core/GamePopUps';
import { color_red, color_blue, color_green, color_yellow } from '../ui/ImagesUtils.ts'

function WildCard()
{
	const { gameState, sendMessage } = getGameContext();
	const { identifierID, resetPopUpStates } = getPopUpContext();

	const message = {"type": "play", "card": identifierID}
	const box_options = {width: '6vw', aspectRatio: '1 / 1'}
	const align = {display: 'flex', justifyContent: 'center', alignItems: 'center'};
	const image_styles: React.CSSProperties = {width: '100%', aspectRatio: '1 / 1', objectFit: 'fill', border: '0.1vw solid black', borderRadius: '10%'};

	useEffect(() => {
		if (gameState?.turn !== gameState?.you.id)
			resetPopUpStates();
	}, [gameState?.turn]);

	return (
		<Box sx={{ width: '40vw', aspectRatio: '3 / 1', ...align, border: '0.1vw solid', borderColor: 'divider', borderRadius: 2, bgcolor: '#1C1221', gap: '3vw' }}>
			<Box onClick={() => {resetPopUpStates(); sendMessage({...message, "color": "red"})}} sx={{ ...box_options, ...align }}>
				<img src={color_red} style={image_styles}/>
			</Box>
			<Box onClick={() => {resetPopUpStates(); sendMessage({...message, "color": "blue"})}} sx={{ ...box_options, ...align }}>
				<img src={color_blue} style={image_styles}/>
			</Box>
			<Box onClick={() => {resetPopUpStates(); sendMessage({...message, "color": "yellow"})}} sx={{ ...box_options, ...align }}>
				<img src={color_yellow} style={image_styles}/>
			</Box>
			<Box onClick={() => {resetPopUpStates(); sendMessage({...message, "color": "green"})}} sx={{ ...box_options, ...align }}>
				<img src={color_green} style={image_styles}/>
			</Box>
		</Box>
	)
}

export default WildCard