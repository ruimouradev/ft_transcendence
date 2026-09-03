import { Box, Button, Container, List, ListItem, Paper, ThemeProvider, Typography } from '@mui/material';
import { useEffect } from 'react';

import { useAuth } from '../core/AuthContext';

import { unoTheme } from '../ui/unoTheme';

import { useGameContext } from '../core/GameWebSocketContext';
import { usePopUpContext } from '../core/GamePopUpsContext';
import type { PopUpTypes } from '../core/types.ts';

import { bg_image, cardBacks, defaultCardBack, direction_plus, direction_minus } from '../ui/ImagesUtils.ts';

import { color_red, color_blue, color_green, color_yellow } from '../ui/ImagesUtils.ts'

import Avatar from '../components/Avatar'
import Emoticons from '../components/Emoticons'
import WaitRoom from '../components/WaitRoom'

import type {GameCard, Notice, PublicPlayer, GameState} from '../core/types.ts'

function getCardName({card}: {card: GameCard})
{
	const cardPath = '../assets/cards/' + (card.color + '_' + card.value) + '.png'
	return (cardPath);
}

function DrawCard(sendMessage: (message: object) => void)
{
	const message = {"type": "draw"};
	sendMessage(message);
}

function PlayCard({card, gameState, sendMessage, handleNewID}:
	{card: GameCard,
	gameState: GameState | null,
	sendMessage: (message: object) => void,
	handleNewID: (type: PopUpTypes, new_id: string) => void})
{
	// NEEDED FOR TESTING !!!! DEL LATER
	// handleNewID('seven', card.id);
	// return ;

	if (gameState?.you.id !== gameState?.turn
		|| !gameState?.you.playable?.includes(card.id))
		return null;

	const play_message = {type: 'play', card: `${card.id}`};

	if (gameState?.settings?.seven_zero === true && card.value == '7')
		handleNewID('seven', card.id);
	else if (card.color === 'wild')
		handleNewID('wildcard', card.id);
	else
		sendMessage(play_message);
}

function DeckArea()
{
	const { user } = useAuth();
	const { gameState, sendMessage } = useGameContext();

	const uno_click = {"type": "say_uno"};
	const challenge_click = {"type": "challenge"};
	const disable_challenge = gameState?.turn !== gameState?.you.id 
			? true : gameState?.plus4_by === null ? true : false;

	const images = import.meta.glob(
		'../assets/cards/*.png',
		{ eager: true, query: '?url', import: 'default' }
	)

	const box_shadow = {boxSizing: 'content-box', borderLeft: '0.5vw solid black', borderBottom: '0.5vw solid black', borderTop: '0.15vw solid black', borderRight: '0.15vw solid black'};

	const card = gameState?.top_card;
	if (card == undefined)
		return ;

	let color: string;
	switch (gameState?.active_color)
	{
		case ('blue'):
			color = color_blue;
			break ;
		case ('green'):
			color = color_green;
			break ;
		case ('red'):
			color = color_red;
			break ;
		case ('yellow'):
			color = color_yellow;
			break ;
		default:
			color = 'black';
	}

	const direction = gameState?.direction === 1 ? direction_plus : direction_minus;
	const image_styles: React.CSSProperties = {width: '100%', aspectRatio: '1 / 1', objectFit: 'fill'};

	return (
		<Box sx={{ height: '80%', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', transform: 'translateY(10%)' }}>
			<Box sx={{ width: '50%', height: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1, top: 0, position: 'absolute' }}>
				<img className="card card_small" src={cardBacks[user?.card_back ?? ''] ?? defaultCardBack} alt="" draggable={false} onClick={() => DrawCard(sendMessage)}/>
				<img className="card card_small" src={images[getCardName({card})]} alt="" draggable={false}/>
			</Box>
			<Box sx={{ bottom: 0, position: 'absolute', width: '50%', height: '50%', display: 'flex', justifyContent: 'center', alignItems: 'end' }}>
				<img className="arrow" src={direction} alt="" draggable={false}/>
			</Box>
			<Box sx={{ width: '25%', height: '100%', right: 0, position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, transform: 'translateX(20%) translateY(-15%)' }}>
				<Paper elevation={0} sx={{ width: '4vw', aspectRatio: '1 / 1', bgcolor: color, borderRadius: 1, ...box_shadow }}>
					<img src={color} draggable={false} style={image_styles}/>
				</Paper>
				<Button className="rainbow-button" variant="contained" onClick={() => sendMessage(uno_click)} 
					sx={{ width: '4vw',  aspectRatio: '1 / 1', minWidth: 0, p: 0, fontSize: 'clamp(0.2rem, 1.4vh, 1rem)', ...box_shadow }}>UNO!
				</Button>
			</Box>
			<Box sx={{ width: '25%', height: '100%', left: 0, position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2, transform: 'translateX(-20%) translateY(-15%)' }}>
				<Button variant="contained" disabled={disable_challenge} onClick={() => sendMessage(challenge_click)}
					sx={{ width: '4vw',  aspectRatio: '1 / 1', minWidth: 0, p: 0, fontSize: 'clamp(0.2rem, 1.4vh, 1rem)', ...box_shadow }}>DARE
				</Button>
				{gameState?.stack !== 0 && <Paper elevation={0} sx={{ width: '4vw', aspectRatio: '1 / 1', bgcolor: color, borderRadius: 1, ...box_shadow }}>
					<Typography sx={{ width: '100%', height: '100%', color: 'backgorund.paper', fontSize: 'clamp(0.2rem, 1.4vh, 1rem)',
						display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
						<span>STACK</span> <span>{gameState?.stack}</span>
					</Typography>
				</Paper>}
			</Box>
		</Box>
	)
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
		<ThemeProvider theme={unoTheme}>
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
		</ThemeProvider>
	);
}

export default GameRoom