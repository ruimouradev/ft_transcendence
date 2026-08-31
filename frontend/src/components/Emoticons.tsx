import { useEffect } from 'react';
import { Box, Card } from '@mui/material';
import { getGameContext } from '../core/GameWebSocket';
import { emoticon_catch, emoticon_sad, emoticon_angry, emoticon_happy, emoticon_confidence, emoticon_nervous, emoticon_surprised, emoticon_uno } from '../ui/ImagesUtils';

function Emoticons({position}: {position: string})
{
	const { notice, resetNotice } = getGameContext();
	const emoticons = [emoticon_sad, emoticon_angry, emoticon_happy, emoticon_confidence, emoticon_nervous, emoticon_surprised, emoticon_catch, emoticon_uno];

	useEffect(() => {
		if (notice === null)
			return ;
		const timer = setTimeout(() => {
			resetNotice();
		}, 2000);
		 return () => clearTimeout(timer);
	}, [notice]);

	let choosen_emoticon;
	switch (notice?.kind)
	{
		case ('uno'):
			choosen_emoticon = emoticon_uno;
			break ;
		case ('catch'):
			choosen_emoticon = emoticon_catch;
			break ;
		case ('emote'):
			choosen_emoticon = emoticons[notice?.icon - 1];
			break ;
		default:
			return null;
	}

	return (
		<Box sx={{ position: 'absolute', inset: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', pointerEvents: 'none' }}>
			<Card className={`emoticon-${position}`} sx={{ bgcolor: 'white', width: '5vw', aspectRatio: '1 / 1', overflow: 'visible',
				display: 'flex', alignItems: 'center', justifyContent: 'center', border: '0.2vw solid black', zIndex: 999, position: 'relative' }}>
				<img src={choosen_emoticon} draggable={false} />
				<Box className={`emoticon-arrow-${position}`}>
					<Box className={`emoticon-inner-${position}`}/>
				</Box>
			</Card>
		</Box>
	)
}

export default Emoticons