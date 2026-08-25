import { Box, Button, Card, CardMedia, Container, Typography } from '@mui/material';
import { useState, Fragment } from 'react';

import { useAuth } from '../core/AuthContext';
import { getGameContext } from '../core/GameWebSocket';

import { cardBacks, defaultCardBack } from '../ui/cardBacks';

import type {Color, valueNum, valueAction, valueWild, GameCard, PublicPlayer, PrivatePlayer, GameState} from './types.ts'

type Pops = 'wildcard' | 'seven' | 'game_end' | 'disabled'

function getCardName({card}: {card: GameCard})
{
	const cardPath = '../assets/cards/' + (card.color + '_' + card.value) + '.png'
	return (cardPath);
}

function DrawCard()
{
	console.log("deck clicked")
}

function PlayCard({card, popUp, setPopUp}:
	{card: GameCard,
	popUp: string,
	setPopUp: React.Dispatch<React.SetStateAction<Pops>>})
{
	const {gameState} = getGameContext();
	if (popUp !== 'disabled')
		return null;

	// Not my turn? Return ;
	if (gameState?.turn !== gameState?.you.id)
		return ;



	let play_message = {type: 'play', card: `${card.id}`};
	// Send message if not wildcard !




	if (card.color === 'wild')
	{
		setPopUp('wildcard');
		Object.assign(play_message, {color: `${popUp}`});
	}

	console.log(play_message)



	// Is wildcard?
	// Trigger color
	// Save color in a state
	// Send message()

	// Is valid play?
	// No? return()


}

function DeckArea()
{
	const { user } = useAuth();
	const { gameState } = getGameContext();

	const images = import.meta.glob(
		'../assets/cards/*.png',
		{ eager: true, query: '?url', import: 'default' }
	)

	const card = gameState?.top_card;
	if (card == undefined)
		return ;

	return (
		<ul>
			<li className="list" key={"deck"}>
				{/* <img className="card deck_card" src={cardBacks[user?.card_back ?? ''] ?? defaultCardBack} alt="" draggable={false} onClick={DrawCard}/> */}
			</li>
			<li className="list" key={"top"}>
				{/* <img className="card deck_card" src={images[getCardName({card})]} alt="" draggable={false}/> */}
			</li>
			<Box sx={{ transform: 'translateY(-100px) translateX(60px)' }}>
				
			</Box>
			<Button className="rainbow-button" variant="contained" sx={{ transform: 'translateY(50px) translateX(40px)' }}>UNO!</Button>
		</ul>
	);
}

function WildCard({setPopUp}: {setPopUp: React.Dispatch<React.SetStateAction<Pops>>})
{
	return (
		<Box sx={{ bgcolor: 'white', width: '99%', height: '15vh', display: 'flex', justifyContent: 'center', alignItems: 'center', border: 3, borderRadius: '2%' }}>
			<Box sx={{ width: '25%', height: '50%' }}>
				<Button onClick={() => {setPopUp('disabled')}} sx={{ height: '100%', bgcolor: 'red'}}/>
			</Box>
			<Box sx={{ width: '25%', height: '50%' }}>
				<Button onClick={() => {setPopUp('disabled')}} sx={{ height: '100%', bgcolor: 'blue'}}/>
			</Box>
			<Box sx={{ width: '25%', height: '50%' }}>
				<Button onClick={() => {setPopUp('disabled')}} sx={{ height: '100%', bgcolor: 'yellow'}}/>
			</Box>
			<Box sx={{ width: '25%', height: '50%' }}>
				<Button onClick={() => {setPopUp('disabled')}} sx={{ height: '100%', bgcolor: 'green'}}/>
			</Box>
		</Box>
	)
}

function PopUp({popUp, setPopUp}: {popUp: Pops, setPopUp: React.Dispatch<React.SetStateAction<Pops>>})
{
	if (popUp === 'disabled')
		return null;
	return (
		 popUp === 'wildcard' && <WildCard setPopUp={setPopUp} />
	)
}

function DrawHands({deck, amount, card_class, popUp, setPopUp}:
	{deck: GameCard[] | undefined,
	amount: number,
	card_class: string,
	popUp: Pops,
	setPopUp: React.Dispatch<React.SetStateAction<Pops>>})
{

	if (deck === undefined)
		return (
			<DrawHidden amount={amount} card_class={card_class}/>
		)

	const images = import.meta.glob(
		'../assets/cards/*.png',
		{ eager: true, query: '?url', import: 'default' }
	)

	const ul_class = (card_class === 'card-north' || card_class === 'card-south' ? "ul-horizontal" : "ul-vertical")

	return (
		<>
		<ul className={ul_class}>
			{ deck.map((card) => (
				<li className="list" key={card.id}>
					<img className={`card ${card_class}`} src={images[getCardName({card})]} alt="" draggable={false} onClick={() => PlayCard({card, popUp, setPopUp})}/>
					
				</li>
			))}
		</ul>
		</>
	);
}

function DrawHidden({amount, card_class}: {amount: number, card_class: string})
{
	const { user } = useAuth();

	const ul_class = (card_class === 'card-north' || card_class === 'card-south' ? "ul-horizontal" : "ul-vertical")

	const arr = Array.from({ length: amount });
	return (
		<ul className={ul_class}>
		{arr.map((_, index) => (
			<li className="list" key={index}>
				{/* <img className={`card ${card_class}`} src={cardBacks[user?.card_back ?? ''] ?? defaultCardBack} alt="" draggable={false}/> */}
			</li>
		))}
		</ul>
	)
}

function PlayersUI({players, popUp, setPopUp}:
	{players: PublicPlayer[], popUp: Pops, setPopUp: React.Dispatch<React.SetStateAction<Pops>>})
{
	const { user  } = useAuth();

	let player_pos: string[];

	if (players.length == 2) {
		player_pos = [
			"south",
			"north" ]
	}
	else if (players.length == 3) {
		player_pos = [
			"south",
			"west",
			"east" ]
	}
	else {
		player_pos = [
			"south",
			"west",
			"north",
			"east" ]
	}

	return (players.map((player, i) => {
		if (i == 0) {
			return (
				<Box key={player.id} className={`board-${player_pos[i]}`} sx={{ position: 'relative' }}>
					<Box sx={{ position: 'absolute', inset: 0, display: 'flex', justifyContent: 'center' }}>
						<Card elevation={0} sx={{ height: 85, width: 100, backgroundColor: 'rgba(255, 255, 255, 0)', transform: 'translateY(-90px)', display: 'flex', justifyContent: 'center' }}>
							<CardMedia component="img" sx={{ border: 3, height: 64, width: 64, borderRadius: '50%' }} image={user?.avatar} draggable={false}/>
							<Typography sx={{ color: 'black', bgcolor: 'orange', border: 3, my: '60px', zIndex: '10', position: 'absolute', px: 1 }}>{user?.nick_name}</Typography>
						</Card>
					</Box>
					<Box sx={{ position: 'absolute', inset: 0 }}>
						{/* <DrawHands deck={player.hand} amount={player.handCount} card_class={`card-${player_pos[i]}`} popUp={popUp} setPopUp={setPopUp} /> */}
					</Box>
				</Box>
			)
		}
		else {
			return (
				<Box key={player.id} className={`board-${player_pos[i]}`} sx={{ position: 'relative' }}>
					<Box className={`avatar-${player_pos[i]}`} sx={{ position: 'absolute', inset: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
						<Card elevation={0} sx={{ height: 95, width: 100, backgroundColor: 'rgba(255, 255, 255, 0)', transform: 'translateY(0px)', display: 'flex', justifyContent: 'center' }}>
							<CardMedia component="img" sx={{ border: 3, height: 64, width: 64, borderRadius: '50%' }} image="/avatar/f01.png" draggable={false}/>
							<Typography sx={{ color: 'black', bgcolor: 'orange', border: 3, my: '60px', position: 'absolute', px: 1 }}>{player.name}</Typography>
						</Card>
					</Box>
					<Box sx={{position: 'absolute', inset: 0}}>
						<DrawHidden amount={player.cards} card_class={`card-${player_pos[i]}`}/>
					</Box>
				</Box>
			)
		}
	}))
}

function GameRoom()
{
	const { gameState } = getGameContext();
	const [popUp, setPopUp] = useState<Pops>('disabled');

	let players: PublicPlayer[] = [];
	const player = gameState?.you;
	if (gameState !== null)
		players = gameState.players;

	let i = 0;
	for (; i < players.length && players[i].id !== player?.id; i++)
		;

	let new_players: PublicPlayer[] = players.slice(i);
	new_players.push(...players.slice(0, i));

	// const room = sessionStorage.getItem('roomID');
	// const token = sessionStorage.getItem('reconnectToken');

	// console.log('test');
	// console.log(room);
	// console.log(token);

	// const [users, setValidPlayer] = useState<game.Player[]>(players_old);

	// const [game, setGameState] = useState<typeof gameState>(gameState);

	return (
		<Box sx={{ width: '100%', height: '85vh', position: 'relative'}}>
		<Container sx={{ bgcolor: 'black', width: '100%', height: '100%', mtop: '15px', display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gridTemplateRows: 'repeat(12, 1fr)' }}>
			<PlayersUI players={new_players} popUp={popUp} setPopUp={setPopUp} />
			<Box sx={{ gridColumn: '4/8', gridRow: '5/9', bgcolor: '#6d6d6d'}}>
					<PopUp popUp={popUp} setPopUp={setPopUp} />
					<DeckArea />
			</Box>
		</Container>
		</Box>
	);
}

export default GameRoom