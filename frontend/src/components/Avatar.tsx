import { useEffect, useState } from 'react';
import { Box, Card, CardMedia, Typography } from '@mui/material';
import { useGameContext } from '../core/GameWebSocketContext';
import type { PublicPlayer } from '../core/types.ts';
import EmoticonsMenu from './EmoticonsMenu';
import { avatar_offline, bot_easy, bot_medium, bot_hard } from '../ui/ImagesUtils.ts';

function Avatar({player, position}: {player: PublicPlayer, position: string})
{
	const { gameState, sendMessage } = useGameContext();
	const [cooldown, setCooldown] = useState(false);
	const [anchor, setAnchor] = useState<HTMLElement | null>(null);

	useEffect(() => {
		if (cooldown === false)
			return ;
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


	function getPlayerInfo() {

		if (!player.connected)
			return ({nickname: 'OFFLINE', avatar: avatar_offline});
		if (!player.bot)
			return ({nickname: player.name, avatar: player.avatar});
		if (player.bot_level === 'easy')
			return ({nickname: player.name, avatar: bot_easy});
		if (player.bot_level === 'medium')
			return ({nickname: player.name, avatar: bot_medium});
		return ({nickname: player.name, avatar: bot_hard});
	}

	const turn_class = player.id === gameState?.turn ? 'player_turn' : ''
	const { nickname, avatar } = getPlayerInfo();
	const bg_color = !player.connected ? 'black' : player.id === gameState?.turn ? 'none' : 'grayscale(100%)';
	const letter_color = !player.connected ? 'white' : 'black'

	return (
		<Box sx={{ position: 'absolute', inset: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
			<EmoticonsMenu anchor={anchor} handleClose={handleClose} startCooldown={startCooldown}/>
			<Card className={`avatar-${position} `} elevation={0} onClick={function_call}
				sx={{ width: '4vw', aspectRatio: '1 / 1', overflow: 'visible', bgcolor: 'rgba(255, 255, 255, 0)', display: 'flex',
				justifyContent: 'center', border: 0, position: 'relative', zIndex: 5,
				filter: bg_color, pointerEvents: position === 'south' && cooldown ? 'none' : 'auto' }}>
				<CardMedia className={turn_class} component="img" sx={{ border: 1, width: '100%', height: '100%', aspectRatio: '1 / 1',
					borderRadius: '50%', objectFit: 'cover' }} image={avatar} draggable={false}/>
				<Typography sx={{ color: letter_color, bgcolor: !player.connected ? 'black' : 'orange', border: 1, zIndex: '10', position: 'absolute', 
					bottom: 0, transform: 'translateY(70%)', fontSize: 'clamp(0.5vh, 2vh, 3vh)', px: '5%', whiteSpace: 'nowrap' }}>
						{ nickname }
				</Typography>
			</Card>
		</Box>
	)
}

export default Avatar
