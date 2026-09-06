import { useEffect } from 'react';
import { Box, IconButton } from '@mui/material';
import { useGameContext } from '../core/GameWebSocketContext';
import { usePopUpContext } from '../core/GamePopUpsContext';
import { color_red, color_blue, color_green, color_yellow } from '../ui/ImagesUtils.ts';
import ClearSharpIcon from '@mui/icons-material/ClearSharp';

function WildCardPopUp()
{
	const { gameState, sendMessage } = useGameContext();
	const { identifierID, resetPopUpStates } = usePopUpContext();

	const message = {"type": "play", "card": identifierID}
	const box_options = {width: '6vw', aspectRatio: '1 / 1'}
	const align = {display: 'flex', justifyContent: 'center', alignItems: 'center'};
	const image_styles: React.CSSProperties = {width: '100%', aspectRatio: '1 / 1', objectFit: 'fill', border: '0.1vw solid black', borderRadius: '10%'};

	useEffect(() => {
		if (!gameState || gameState?.turn !== gameState?.you.id)
			resetPopUpStates();
	}, [gameState, gameState?.turn, gameState?.you.id, resetPopUpStates]);

	return (
			<Box sx={{ width: '40vw', aspectRatio: '3 / 1', ...align, border: '0.1vw solid', borderColor: 'divider', borderRadius: 2, bgcolor: 'background.default', gap: '3vw', position: 'relative' }}>
				<Box onClick={() => {resetPopUpStates(); sendMessage({...message, "color": "red"})}} sx={{ ...box_options, ...align }}>
					<img src={color_red} draggable={false} style={image_styles}/>
				</Box>
				<Box onClick={() => {resetPopUpStates(); sendMessage({...message, "color": "blue"})}} sx={{ ...box_options, ...align }}>
					<img src={color_blue} draggable={false} style={image_styles}/>
				</Box>
				<Box onClick={() => {resetPopUpStates(); sendMessage({...message, "color": "yellow"})}} sx={{ ...box_options, ...align }}>
					<img src={color_yellow} draggable={false} style={image_styles}/>
				</Box>
				<Box onClick={() => {resetPopUpStates(); sendMessage({...message, "color": "green"})}} sx={{ ...box_options, ...align }}>
					<img src={color_green} draggable={false} style={image_styles}/>
				</Box>
				<IconButton sx={{position: 'absolute', top: 0, right: 0}}>
					<ClearSharpIcon onClick={resetPopUpStates} sx={{ color: 'primary.main', border: 3, borderRadius: 1,
						fontSize: 'clamp(0.7rem, 2vw, 2.5rem)' }}/>
				</IconButton>
			</Box>
	)
}

export default WildCardPopUp