import { List, ListItem } from '@mui/material';
import { useAuth } from '../core/AuthContext';
import { cardBacks, defaultCardBack } from '../ui/ImagesUtils.ts';

function DrawHidden({amount, card_class}: {amount: number, card_class: string})
{
	const { user } = useAuth();

	const arr = Array.from({ length: amount });
	const horizontal = card_class === 'card-north' || card_class === 'card-south';
	const offset_multiplyer = amount > 20 ? 25 : amount > 15 ? 35 : amount > 10 ? 50 : 60;

	return (
		<List sx={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', p: 0 }}>
		{arr.map((_, index) => {
			const center = (amount - 1) / 2;
            const offset = (index - center) * offset_multiplyer;
			return (
				<ListItem key={index} sx={{ gridArea: '1 / 1', width: 'auto', p: 0, zIndex: index,
						transform: horizontal ? `translateX(${offset}%)` : `translateY(${offset}%)` }}>
					<img className={`card card_small ${card_class}`} src={cardBacks[user?.card_back ?? ''] ?? defaultCardBack} alt="" draggable={false}/>			
				</ListItem>
			)})}
		</List>
	)
}

export default DrawHidden