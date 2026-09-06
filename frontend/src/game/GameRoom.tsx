import { Box, Container } from '@mui/material';
import { useEffect } from 'react';
import { useGameContext } from '../core/GameWebSocketContext';
import { usePopUpContext } from '../core/GamePopUpsContext';
import { bg_image } from '../ui/ImagesUtils.ts';
import WaitRoom from '../components/WaitRoom';
import type { PublicPlayer } from '../core/types.ts';
import DeckArea from '../components/DeckArea';
import PlayersUI from '../components/PlayersUI';

function RotatePlayers(): PublicPlayer[]
{
	const { gameState } = useGameContext();
	const player = gameState?.you;

	let players: PublicPlayer[] = [];

	if (gameState)
		players = gameState.players;

	let i = 0;
	for (; i < players.length && players[i].id !== player?.id; i++)
		;

	const new_players: PublicPlayer[] = players.slice(i);
	new_players.push(...players.slice(0, i));
	return (new_players);
}

function GameRoom()
{
	const new_players = RotatePlayers();
	const { gameState } = useGameContext();
	const { handleGameEnd } = usePopUpContext();

	useEffect(() => {
		if (gameState?.winner != null)
			handleGameEnd();
	}, [gameState?.winner, handleGameEnd]);

	if (new_players === null)
		return ;

	return ( gameState === null || gameState.phase === 'lobby' ? <WaitRoom /> :
		<Box className="no-select" sx={{  height: { xs: 'auto', sm: '85dvh' },
			width: { xs: '90vw', sm: 'auto' }, maxWidth: '90vw', aspectRatio: {xs: '1 / 1', sm: '1.1 / 1', md: '1.4 / 1' },
			position: 'relative', mx: 'auto', my: '1%' }}>
		<Container sx={{ width: '100%', height: '100%', display: 'grid',
			gridTemplateColumns: 'repeat(10, 1fr)', gridTemplateRows: 'repeat(12, 1fr)',
			backgroundImage: `url(${bg_image})`, backgroundSize: 'cover',
			backgroundPosition: 'center', backgroundRepeat: 'no-repeat', border: '2px solid black' }}>
			<PlayersUI players={new_players} />
			<Box sx={{ gridColumn: '4/8', gridRow: '5/9' }}>
				<DeckArea />
			</Box>
		</Container>
		</Box>
	);
}

export default GameRoom