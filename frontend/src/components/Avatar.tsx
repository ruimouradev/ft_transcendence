import { useEffect, useState } from 'react';
import { Box, Card, CardMedia, Typography } from '@mui/material';
import { useGameContext } from '../core/GameWebSocketContext';
import type { PublicPlayer } from '../core/types.ts';
import EmoticonsMenu from './EmoticonsMenu';
import { bot_easy, bot_medium, bot_hard } from '../ui/ImagesUtils.ts';

function Avatar({player, position}: {player: PublicPlayer, position: string})
{
	const { gameState, sendMessage } = useGameContext();
	const [cooldown, setCooldown] = useState(false);
	const [anchor, setAnchor] = useState<HTMLElement | null>(null);

	useEffect(() => {
		if (cooldown === false)
			return ;
		// setAnchor(null);
		const timer = setTimeout(() => {
			setCooldown(false);
		}, 2000)
		return () => clearTimeout(timer);
	}, [cooldown]);

	function handleEmoticon(event: React.MouseEvent<HTMLElement>)
	{    
		if (cooldown === true)
        	return;
		setAnchor(event.currentTarget);
	}

	function handleClose()
	{
		setAnchor(null);
	}

	function startCooldown()
	{
		setAnchor(null);
		setCooldown(true);
	}

	function catchPlayer(player: PublicPlayer)
	{
		if (player.uno === true || player.cards > 1)
			return ;
		sendMessage({"type": "catch", "target": player.id});
	}

	const function_call = position !== 'south' 
		?  () => catchPlayer(player) 
		: handleEmoticon;

	const avatar = player.bot ? 
		(player?.bot_level === 'easy' ? bot_easy
			: player.bot_level === 'medium' ? bot_medium
			: bot_hard) : player.avatar;
	
	return (
		<Box sx={{ position: 'absolute', inset: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
			<EmoticonsMenu anchor={anchor} handleClose={handleClose} startCooldown={startCooldown}/>
			<Card className={`avatar-${position}`} elevation={0} onClick={function_call}
				sx={{ width: '4vw', aspectRatio: '1 / 1', overflow: 'visible', bgcolor: 'rgba(255, 255, 255, 0)', display: 'flex',
				justifyContent: 'center', border: 0, position: 'relative', zIndex: 5,
				filter: player.id === gameState?.turn ? 'none' : 'grayscale(100%)', pointerEvents: position === 'south' && cooldown ? 'none' : 'auto' }}>
				<CardMedia component="img" sx={{ border: 1, width: '100%', height: '100%', aspectRatio: '1 / 1',
					borderRadius: '50%', objectFit: 'cover' }} image={avatar} draggable={false}/>
				<Typography sx={{ color: 'black', bgcolor: 'orange', border: 1, zIndex: '10', position: 'absolute', 
					bottom: 0, transform: 'translateY(70%)', fontSize: 'clamp(0.5vh, 2vh, 3vh)', px: '5%', whiteSpace: 'nowrap' }}>
						{ player.name.length > 12 ? player.name.slice(0, 10) + '..' : player.name }
					</Typography>
			</Card>
		</Box>
	)
}

export default Avatar
