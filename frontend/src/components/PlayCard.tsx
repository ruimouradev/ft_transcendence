import type { PopUpTypes } from '../core/types.ts';
import type { GameCard, GameState } from '../core/types.ts';

function PlayCard({card, gameState, sendMessage, handleNewID}:
	{card: GameCard,
	gameState: GameState | null,
	sendMessage: (message: object) => void,
	handleNewID: (type: PopUpTypes, new_id: string) => void})
{
	if (gameState?.you.id !== gameState?.turn
		|| !gameState?.you.playable?.includes(card.id))
		return null;

	// NEEDED FOR TESTING !!!! DEL LATER
	// handleNewID('plus4', '');
	// return ;

	const play_message = {type: 'play', card: `${card.id}`};

	if (gameState?.settings?.seven_zero === true && card.value == '7')
		handleNewID('seven', card.id);
	else if (card.color === 'wild')
		handleNewID('wildcard', card.id);
	else
		sendMessage(play_message);
}

export default PlayCard