import { Box, Button, Card, CardContent , CardMedia, Container, Chip, IconButton,  List, ListItem, Paper, ThemeProvider, Typography } from '@mui/material';
import { createContext, useState, useContext, Fragment } from 'react';

import StarOutlinedIcon from '@mui/icons-material/StarOutlined';
import WifiOffOutlinedIcon from '@mui/icons-material/WifiOffOutlined';
import ExitToAppOutlinedIcon from '@mui/icons-material/ExitToAppOutlined';
import DisabledByDefaultOutlinedIcon from '@mui/icons-material/DisabledByDefaultOutlined';

import { useAuth } from '../core/AuthContext';

import { unoTheme } from '../ui/unoTheme';

import { getGameContext } from '../core/GameWebSocket';
import { getPopUpContext } from '../core/GamePopUps';
import type { PopUpTypes } from '../core/GamePopUps';

import { bg_image, cardBacks, defaultCardBack, direction_plus, direction_minus } from '../ui/ImagesUtils.ts';

import {easy_bot, medium_bot, hard_bot, start_game} from './messages.ts'

import type {Color, valueNum, valueAction, valueWild, GameCard, PublicPlayer, PrivatePlayer, LastAction, GameState} from './types.ts'

function getCardName({card}: {card: GameCard})
{
	const cardPath = '../assets/cards/' + (card.color + '_' + card.value) + '.png'
	return (cardPath);
}

function DrawCard(sendMessage: (message: object) => void)
{
	const message = {"type": "draw"};
	sendMessage(message);

	// DEL
	console.log(message)
}

function PlayCard({card, gameState, sendMessage, handleNewID}:
	{card: GameCard,
	gameState: GameState | null,
	sendMessage: (message: object) => void,
	handleNewID: (type: PopUpTypes, new_id: string) => void})
{
	handleNewID('game_end', card.id);
	return ;


	if (gameState?.you.id !== gameState?.turn
		|| !gameState?.you.playable?.includes(card.id))
		return null;

	let play_message = {type: 'play', card: `${card.id}`};

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
	const { gameState, sendMessage } = getGameContext();

	const uno_click = {"type": "say_uno"};
	const challenge_click = {"type": "challenge"};
	const disable_challenge = gameState?.turn !== gameState?.you.id 
			? true : gameState?.plus4_by === null ? true : false;

	const images = import.meta.glob(
		'../assets/cards/*.png',
		{ eager: true, query: '?url', import: 'default' }
	)

	const box_shadow = {boxSizing: 'content-box', borderLeft: '0.6vw solid black', borderBottom: '0.6vw solid black', borderTop: '0.15vw solid black', borderRight: '0.15vw solid black'};

	const card = gameState?.top_card;
	if (card == undefined)
		return ;

	let color: string;
	switch (gameState?.active_color)
	{
		case ('blue'):
			color = 'info.main';
			break ;
		case ('green'):
			color = 'success.main';
			break ;
		case ('red'):
			color = 'primary.main';
			break ;
		case ('yellow'):
			color = 'secondary.main';
			break ;
		default:
			color = 'black';
	}
	
	const direction = gameState?.direction === 1 ? direction_plus : direction_minus;

	return (
		<Box sx={{ height: '100%', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
			<Box sx={{ width: '50%', height: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1, }}>
				<img className="card deck_card" src={cardBacks[user?.card_back ?? ''] ?? defaultCardBack} alt="" draggable={false} onClick={() => DrawCard(sendMessage)}/>
				<img className="card deck_card" src={images[getCardName({card})]} alt="" draggable={false}/>
			</Box>
			<Box sx={{ bottom: 0, position: 'absolute', width: '30%', height: '20%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
				<img className="arrow" src={direction} alt="" draggable={false}/>
			</Box>
			<Box sx={{ width: '25%', height: '100%', right: 0, position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
				<Paper elevation={10} sx={{ width: '4vw',  aspectRatio: '1 / 1', bgcolor: color, borderRadius: 1, ...box_shadow }}></Paper>
				<Button className="rainbow-button" variant="contained" onClick={() => sendMessage(uno_click)} sx={{ width: '4vw',  aspectRatio: '1 / 1', minWidth: 0, p: 0, fontSize: 'clamp(0.2rem, 0.8rem, 1rem)', ...box_shadow }}>UNO!</Button>
				<Button variant="contained" disabled={disable_challenge} onClick={() => sendMessage(challenge_click)}sx={{ width: '4vw',  aspectRatio: '1 / 1', minWidth: 0, p: 0, fontSize: 'clamp(0.2rem, 0.8rem, 1rem)', ...box_shadow }}>DARE</Button>
			</Box>
		</Box>
	)
}


function DrawHands({deck, amount, card_class}:
	{deck: GameCard[] | undefined,
	amount: number,
	card_class: string,})
{

	const { gameState, sendMessage } = getGameContext();
	const { handleNewID } = getPopUpContext();

	if (deck === undefined)
		return (
			<DrawHidden amount={amount} card_class={card_class}/>
		)

	const images = import.meta.glob(
		'../assets/cards/*.png',
		{ eager: true, query: '?url', import: 'default' }
	)

	const horizontal = card_class === 'card-north' || card_class === 'card-south';
	const offset_multiplyer = amount > 20 ? 35 : amount > 15 ? 40 : 60;

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
	const offset_multiplyer = amount > 20 ? 20 : amount > 15 ? 35 : 60;

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

function PlayerOneHand()
{
	const { user } = useAuth();
	const { gameState } = getGameContext();

	const player = gameState?.you !== undefined ? gameState?.you : {id: 0, hand: [], platable: [], drawn: null};

	return (
		<Box className="board-south" sx={{ position: 'relative' }}>
			<Box sx={{ position: 'absolute', inset: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
				<Card className="avatar-south" elevation={0} onClick={() => console.log("IMPLEMENT EMOTICON")} sx={{ width: '4vw',
					aspectRatio: '1 / 1', overflow: 'visible', bgcolor: 'rgba(255, 255, 255, 0)', display: 'flex', justifyContent: 'center', 
					border: 0, position: 'relative', zIndex: 5, filter: player.id === gameState?.turn ? 'none' : 'grayscale(100%)' }}>
					<CardMedia component="img" sx={{ border: 1, width: '100%', height: '100%', aspectRatio: '1 / 1',
						borderRadius: '50%', objectFit: 'cover' }} image={user?.avatar} draggable={false}/>
					<Typography sx={{ color: 'black', bgcolor: 'orange', border: 1, zIndex: '10', position: 'absolute', 
						bottom: 0, transform: 'translateY(70%)', fontSize: 'clamp(0.5vh, 2vh, 3vh)' }}>{user?.nick_name}</Typography>
				</Card>
			</Box>
			<Box sx={{ position: 'absolute', inset: 0 }}>
				<DrawHands deck={player.hand} amount={player.hand.length} card_class="card-south" />
			</Box>
		</Box>
	)
}

function PlayersUI({players}: {players: PublicPlayer[]})
{
	const { gameState, sendMessage } = getGameContext();

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
		console.log(player.cards);
		if (i == 0) {
			return (<PlayerOneHand key={player.id} />)
		}
		else {
			return (
				<Box key={player.id} className={`board-${player_pos[i]}`} sx={{ position: 'relative' }}>
					<Box sx={{ position: 'absolute', inset: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
						<Card className={`avatar-${player_pos[i]}`} elevation={0} onClick={() => sendMessage({"type": "catch", "target": player.id})}
							sx={{ width: '4vw', aspectRatio: '1 / 1', overflow: 'visible', bgcolor: 'rgba(255, 255, 255, 0)', display: 'flex',
							justifyContent: 'center', border: 0, position: 'relative', zIndex: 5, filter: player.id === gameState?.turn ? 'none' : 'grayscale(100%)' }}>
							<CardMedia component="img" sx={{ border: 1, width: '100%', height: '100%', aspectRatio: '1 / 1',
								borderRadius: '50%', objectFit: 'cover' }} image={player.avatar} draggable={false}/>
							<Typography sx={{ color: 'black', bgcolor: 'orange', border: 1, zIndex: '10', position: 'absolute', 
								bottom: 0, transform: 'translateY(70%)', fontSize: 'clamp(0.5vh, 2vh, 3vh)' }}>{player.name}</Typography>
						</Card>
					</Box>
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
	const { gameState } = getGameContext();
	const player = gameState?.you;

	let players: PublicPlayer[] = [];

	if (gameState !== null)
		players = gameState.players;

	let i = 0;
	for (; i < players.length && players[i].id !== player?.id; i++)
		;

	let new_players: PublicPlayer[] = players.slice(i);
	new_players.push(...players.slice(0, i));
	return (new_players);
}

function WaitRoom()
{
	const { roomID, gameState, sendMessage, closeRoomConnection } = getGameContext();

	const host = gameState?.you.id !== gameState?.host_id;
	const room_full = gameState?.players.length !== gameState?.settings?.max_players;
	const text = room_full ? `WAITING FOR PLAYERS ${gameState?.players.length} / ${gameState?.settings?.max_players}` : 'START';

	return (
		<ThemeProvider theme={unoTheme}>
			<Container sx={{ height: '65vh', width: '50%', display: 'flex', flexDirection: 'column', my: 2, p: 0.5,
				position: 'relative', border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: 'background.paper' }}>
				<Box sx={{height: '10%', width: '100%'}}>
					<Typography variant="h5" sx={{  height: '100%', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>ROOM ID: {roomID}</Typography>
					<IconButton size="large" sx={{ position: 'absolute', top: 0, right: 0, zIndex: 1 }} onClick={() => closeRoomConnection()}>
						<ExitToAppOutlinedIcon fontSize="inherit"/>
					</IconButton>
				</Box>
				<Box sx={{ height: '90%', width: '100%' }}>
					<Box sx={{ height: '85%', width: '100%', bgcolor: 'black' }}>
						<List sx={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', p: 0 }}>
							{gameState?.players.map((player) => (
								<ListItem key={player.id} sx={{ height: '20%', width: '100%', p: 0.5 }}>
									<Card sx={{ height: '100%', width: '100%', display: 'flex', position: 'relative' }}>
										<CardMedia component="img" sx={{ width: '12%', height: 'auto', display: 'flex', alignItems: 'center' }} image={player.avatar}/>
										<CardContent sx={{display: 'flex', gap: 2}}>
											<Typography variant="h6">{player.name}</Typography>
											{player.connected 
												? <></> 
												: <Chip icon={<WifiOffOutlinedIcon />} label="Reconnecting" sx={{ backgroundColor: 'transparent',
													color: 'text.secondary', border: '1px dashed', borderColor: 'text.secondary', opacity: 0.55,
													fontSize: '0.95rem', py: 2.2, px: 0.5, '& .MuiChip-icon': { color: 'text.secondary' },}}/>}
										</CardContent>
										<CardContent>
											{
												(player.id !== gameState?.host_id)
												?	<IconButton hidden={host} size="large" sx={{ position: 'absolute', right: 2, zIndex: 1, color: 'primary.main' }}
												onClick={() => sendMessage({"type": "kick", "target": `${player.id}`})} >
														<DisabledByDefaultOutlinedIcon fontSize="inherit"/>
													</IconButton>
												: <Chip icon={<StarOutlinedIcon />} label="HOST" sx={{ position: 'absolute', right: 15, backgroundColor: 'lightgreen',
													color: '#0f172a', fontWeight: 'bold', fontSize: '0.95rem', py: 2.2, px: 0.5, '& .MuiChip-icon': { color: '#0f172a' },}}/>
											}
										</CardContent>
									</Card>
								</ListItem>
							))}
							<ListItem key={'bot_menu'} sx={{ height: '20%', width: '100%', p: 0.5 }}>
								<Card sx={{ height: '100%', width: '100%', display: 'flex', position: 'relative', alignItems: 'center' }}>
									<Typography sx={{ p: 3 }}>ADD BOT</Typography>
									<CardContent sx={{ display: 'flex', position: 'absolute', alignItems: 'center', right: 0 }}>
										<Button disabled={host || !room_full} variant="contained" sx={{ mx: 2, bgcolor: '#708c08' }} onClick={() => sendMessage(easy_bot)}>EASY</Button>
										<Button disabled={host || !room_full} variant="contained" sx={{ mx: 2, bgcolor: '#c7950e' }} onClick={() => sendMessage(medium_bot)}>MEDIUM</Button>
										<Button disabled={host || !room_full} variant="contained" sx={{ mx: 2, bgcolor: '#cf5900' }} onClick={() => sendMessage(hard_bot)}>HARD</Button>
									</CardContent> 
								</Card>
							</ListItem>
						</List>
					</Box>
					<Box sx={{ height: '15%', width: '100%' }}>
						<Button variant="contained" disabled={room_full || host} onClick={() => sendMessage(start_game)}
						sx={{ height: '100%', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
							<Typography>{text}</Typography>
						</Button>
					</Box>
				</Box>
			</Container>
		</ThemeProvider>
	)
}

function GameRoom()
{
	const new_players = RotatePlayers();
	if (new_players === null)
		return ;

	const { gameState } = getGameContext();

	return ( gameState?.phase === 'lobby' ? <WaitRoom /> :
		<ThemeProvider theme={unoTheme}>
			<Box sx={{ height: '85dvh', aspectRatio: {sm: '1.1 / 1', md: '1.5 / 1'} , position: 'relative', mx: 'auto' }}>
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