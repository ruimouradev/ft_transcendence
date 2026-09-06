import { Box } from '@mui/material';
import { useGameContext } from '../core/GameWebSocketContext';
import Avatar from '../components/Avatar';
import Emoticons from '../components/Emoticons';
import type { PublicPlayer } from '../core/types.ts';
import PlayerOneHand from '../components/PlayerOneHand';
import DrawHidden from '../components/DrawHidden';

function PlayersUI({players}: {players: PublicPlayer[]})
{
	const { notices, gameState } = useGameContext();

	if (!gameState)
		return null;

	let player_pos: string[];

	if (players.length == 2) {
		player_pos = [ "south", "north" ]
	}
	else if (players.length == 3) {
		player_pos = [ "south", "west", "east" ]
	}
	else {
		player_pos = [ "south", "west", "north", "east" ]
	}

	return (players.map((player, i) => {
		const notice = notices[player.id];
		if (i == 0) {
			return (<PlayerOneHand key={player.id} player={player} notice={notice}/>)
		}
		else {
			return (
				<Box key={player.id} className={`board-${player_pos[i]}`} sx={{ position: 'relative' }}>
					{(notice !== undefined  && notice.sender === player.id) && <Emoticons position={player_pos[i]} playerID={player.id} notice={notice}/>}
					<Avatar player={player} position={player_pos[i]} />
					<Box sx={{position: 'absolute', inset: 0, }}>
						<DrawHidden amount={player.cards} card_class={`card-${player_pos[i]}`} />
					</Box>
				</Box>
			)
		}
	}))
}

export default PlayersUI