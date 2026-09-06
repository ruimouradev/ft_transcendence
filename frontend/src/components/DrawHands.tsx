import { Box, List, ListItem } from '@mui/material';
import { useGameContext } from '../core/GameWebSocketContext';
import { usePopUpContext } from '../core/GamePopUpsContext';
import type { GameCard } from '../core/types.ts';
import DrawHidden from '../components/DrawHidden';
import PlayCard from '../components/PlayCard';

function getCardName({card}: {card: GameCard})
{
	const cardPath = '../assets/cards/' + (card.color + '_' + card.value) + '.png'
	return (cardPath);
}

function DrawHands({deck, amount, card_class}:
	{deck: GameCard[] | undefined,
	amount: number,
	card_class: string,})
{

	const { gameState, sendMessage } = useGameContext();
	const { handleNewID } = usePopUpContext();

	if (deck === undefined)
		return (
			<DrawHidden amount={amount} card_class={card_class}/>
		)

	const images = import.meta.glob(
		'../assets/cards/*.png',
		{ eager: true, query: '?url', import: 'default' }
	)

	const horizontal = card_class === 'card-north' || card_class === 'card-south';
	const offset_multiplyer = amount > 20 ? 25 : amount > 15 ? 35 : amount > 10 ? 50 : 60;

	return (
		<List sx={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', p: 0 }}>
			{ deck.map((card, index) => {
				const center = (deck.length - 1) / 2;
                const offset = (index - center) * offset_multiplyer;

				return (
					<ListItem className="z-index" key={card.id} sx={{ gridArea: '1 / 1', width: 'auto', p: 0, zIndex: index,
						transform: horizontal ? `translateX(${offset}%)` : `translateY(${offset}%)` }}>
						<Box className="box-card">
							<img className={`card ${card_class}`} src={images[getCardName({card})]} alt=""
								draggable={false} onClick={() => PlayCard({card, gameState, sendMessage, handleNewID})}/>
						</Box>
					</ListItem>
				)})}
		</List>
	);
}

export default DrawHands