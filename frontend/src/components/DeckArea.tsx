import { Box, Button, Paper, Typography } from '@mui/material';
import { useAuth } from '../core/AuthContext';
import { useGameContext } from '../core/GameWebSocketContext';
import { cardBacks, defaultCardBack, direction_plus, direction_minus } from '../ui/ImagesUtils.ts';
import { color_red, color_blue, color_green, color_yellow } from '../ui/ImagesUtils.ts';
import type { Color, GameCard } from '../core/types.ts';

function getCardName({card}: {card: GameCard})
{
	const cardPath = '../assets/cards/' + (card.color + '_' + card.value) + '.png'
	return (cardPath);
}

function getColor(color: Color | null | undefined)
{
	switch (color)
	{
		case ('blue'):
			return (color_blue);
		case ('green'):
			return (color_green);
		case ('red'):
			return (color_red);
		case ('yellow'):
			return (color_yellow);
		default:
			return ('black');
	}
}

function DeckArea()
{
	const { user } = useAuth();
	const { gameState, sendMessage } = useGameContext();

	const uno_click = {"type": "say_uno"};

	const images = import.meta.glob(
		'../assets/cards/*.png',
		{ eager: true, query: '?url', import: 'default' }
	)

	const box_shadow = {boxSizing: 'content-box', borderLeft: '0.5vw solid black',
		borderBottom: '0.5vw solid black', borderTop: '0.15vw solid black', borderRight: '0.15vw solid black'};

	const card = gameState?.top_card;
	if (card == undefined)
		return ;

	const color = getColor(gameState?.active_color);

	function handleUno()
	{
		const player = gameState?.you;
		if (player && player.hand.length > 1 && player?.id !== gameState?.turn)
			return ;
		sendMessage(uno_click);
	}

	function DrawCard()
	{
		const player = gameState?.you;
		if (player?.id !== gameState?.turn)
			return ;
		sendMessage({"type": "draw"});
	}

	const box_width = 'clamp(2.2rem, 4vw, 5.5rem)';
	const direction = gameState?.direction === 1 ? direction_plus : direction_minus;
	const image_styles: React.CSSProperties = {width: '100%', aspectRatio: '1 / 1', objectFit: 'fill'};

	return (
		<Box sx={{ height: '80%', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', transform: 'translateY(10%)' }}>
			<Box sx={{ width: '50%', height: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1, top: 0, position: 'absolute' }}>
				<img className="card card_small" src={cardBacks[user?.card_back ?? ''] ?? defaultCardBack} alt="" draggable={false} onClick={DrawCard}/>
				<img className="card card_small" src={images[getCardName({card})]} alt="" draggable={false}/>
			</Box>
			<Box sx={{ bottom: 0, position: 'absolute', width: '50%', height: '50%', display: 'flex', justifyContent: 'center', alignItems: 'end' }}>
				<img className="arrow" src={direction} alt="" draggable={false}/>
			</Box>
			<Box sx={{ width: '25%', height: '100%', right: 0, position: 'absolute', display: 'flex', flexDirection: 'column',
				alignItems: 'flex-end', gap: 2, transform: 'translateX(20%) translateY(-15%)' }}>
				<Paper elevation={0} sx={{ width: box_width, aspectRatio: '1 / 1', bgcolor: color, borderRadius: 1, ...box_shadow }}>
					<img src={color} draggable={false} style={image_styles}/>
				</Paper>
				<Button className="rainbow-button" variant="contained" onClick={handleUno} 
					sx={{ width: box_width,  aspectRatio: '1 / 1', minWidth: 0, p: 0, fontSize: 'clamp(0.2rem, 1.4vh, 1rem)', ...box_shadow }}>UNO!
				</Button>
			</Box>
			<Box sx={{ width: '25%', height: '100%', left: 0, position: 'absolute', display: 'flex', flexDirection: 'column',
				alignItems: 'flex-start', gap: 2, transform: 'translateX(-20%) translateY(-15%)' }}>
				{gameState?.stack !== 0 && <Paper elevation={0} sx={{ width: box_width, aspectRatio: '1 / 1', bgcolor: color, borderRadius: 1, ...box_shadow }}>
					<Typography sx={{ width: '100%', height: '100%', color: 'background.paper', fontSize: 'clamp(0.2rem, 1.4vh, 1rem)',
						display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
						<span>STACK</span> <span>{gameState?.stack}</span>
					</Typography>
				</Paper>}
			</Box>
		</Box>
	)
}

export default DeckArea