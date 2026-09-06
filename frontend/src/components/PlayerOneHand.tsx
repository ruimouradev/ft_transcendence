import { Box } from '@mui/material';
import { useGameContext } from '../core/GameWebSocketContext';
import Avatar from '../components/Avatar';
import Emoticons from '../components/Emoticons';
import type { Notice, PublicPlayer } from '../core/types.ts';

import DrawHands from '../components/DrawHands';

function PlayerOneHand({player, notice}: {player: PublicPlayer, notice: Notice | undefined})
{
	const { gameState } = useGameContext();

	if (!gameState)
		return null;
	const private_player = gameState.you;

	return (
		<Box className="board-south" sx={{ position: 'relative' }}>
			{(notice !== undefined  && notice.sender === player.id) && <Emoticons position={'south'} playerID={player.id} notice={notice}/>}
			<Avatar player={player} position={'south'} />
			<Box sx={{ position: 'absolute', inset: 0 }}>
				<DrawHands deck={private_player.hand} amount={private_player.hand.length} card_class="card-south" />
			</Box>
		</Box>
	)
}

export default PlayerOneHand