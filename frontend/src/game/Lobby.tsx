import { Accordion, AccordionDetails, AccordionSummary, Box, Button, Card, Container, Divider, 
	FormGroup, FormControlLabel, IconButton , OutlinedInput , Slider, Switch, Tabs, Tab, ThemeProvider, Tooltip, Typography } from '@mui/material'
import InfoOutlineRoundedIcon from '@mui/icons-material/InfoOutlineRounded';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';

import { unoTheme } from '../ui/unoTheme';

import PersonIcon from '@mui/icons-material/Person';
import ClearSharpIcon from '@mui/icons-material/ClearSharp';
import CheckSharpIcon from '@mui/icons-material/CheckSharp';
import AddSharpIcon from '@mui/icons-material/AddSharp';
import RemoveSharpIcon from '@mui/icons-material/RemoveSharp';

import { useAuth } from '../core/AuthContext';

import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';

import { getGameContext } from '../core/GameWebSocket'

type Room = {
	code: string,
	host: string,
	max_players: number,
	players: string[],
	settings: {
		hand_size: number,
		max_players: number,
		public: boolean,
		seven_zero: boolean,
		stacking: boolean,
	}
}

// Generates a 5 character Uppercase Hash.
function createRoomID({ rooms }: { rooms: Room[]})
{
	function checkRoom()
	{
		for (let i =0; i < rooms?.length; i++)
		{
			if (rooms[i].code === hash)
				return (true);
		}
		return (false);
	}

	let hash = '';
	do
	{
		hash = Math.random().toString(36).slice(2, 7).toUpperCase();
	}
	while (hash.length < 5 || checkRoom()); // Need to check here if the room already exists
	return (hash);
}

function EachRoom({room, room_flag, onSelect}: {room: Room, room_flag: boolean | null, onSelect: () => void })
{
	const bg = room_flag ? '#0f172a' : 'primary.color';

	console.log("single room")
	console.log(room)

	return (
		<Card onClick={onSelect} sx={{ margin: 0.4, width: '97%', height: '10vh', bgcolor: `${bg}`, display: 'flex', borderTop: '3px solid white'}}>
			<div>Room ID: {room.code}</div>
			<h2 className="flex items-center"><PersonIcon />{room.players.length} / {room.max_players}</h2>
		</Card>
	)
}

function HandCount({handCount, setHandCount, defaultTooltip, setOptionsTooltip}:
	{handCount: number,
	setHandCount: React.Dispatch<React.SetStateAction<number>>,
	defaultTooltip: string,
	setOptionsTooltip: React.Dispatch<React.SetStateAction<string>>})
{
	const text = "Determines the initial amount of cards in each player hands.\n\nRange from 3 to 10.";

	return (
		<Box sx={{display: 'flex', flexDirection: { xs: 'column', sm: 'row'}, alignItems: 'center', height: '15%'}}>
			<Box sx={{display: 'flex', alignItems: 'center', width: '35%'}}>
				<Typography sx={{ fontWeight: 'bold', mx: 2 }} >Initial Hand: </Typography>
			</Box>
			<Box onMouseEnter={() => setOptionsTooltip(text)} onMouseLeave={() => setOptionsTooltip(defaultTooltip)} sx={{display: 'flex', alignItems: 'center', width: '50%'}}>
				<IconButton >
					<RemoveSharpIcon onClick={() => setHandCount(prev => prev > 3 ? prev - 1 : prev)} sx={{ color: 'gray', border: 3, borderRadius: 1, fontSize: 35 }}/>
				</IconButton>
				<Box sx={{ color: '#ececec', border: 3, borderRadius: 1, width: '3vw', aspectRatio: '1 / 1', fontSize: 30, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{handCount}</Box>
				<IconButton >
					<AddSharpIcon onClick={() => setHandCount(prev => prev < 10 ? prev + 1 : prev)} sx={{ color: 'gray', border: 3, borderRadius: 1, fontSize: 35 }}/>
				</IconButton>
			</Box>
		</Box>
	)
}

function PlayerCount({playerCount, setPlayerCount, defaultTooltip, setOptionsTooltip}:
	{playerCount: number,
	setPlayerCount: React.Dispatch<React.SetStateAction<number>>,
	defaultTooltip: string,
	setOptionsTooltip: React.Dispatch<React.SetStateAction<string>>})
{
	const text = "Determines how many players will be in the game.\n\nRange from 2 to 4."

	return (
		<Box sx={{display: 'flex', flexDirection: { xs: 'column', sm: 'row'}, alignItems: 'center', height: '15%'}}>
			<Box sx={{display: 'flex', alignItems: 'center', width: '35%'}}>
				<Typography sx={{ fontWeight: 'bold', mx: 2 }}>Player Count: </Typography>
			</Box>
			<Box onMouseEnter={() => setOptionsTooltip(text)} onMouseLeave={() => setOptionsTooltip(defaultTooltip)} sx={{display: 'flex', alignItems: 'center', width: '50%'}}>
				<IconButton >
					<RemoveSharpIcon onClick={() => setPlayerCount(prev => prev > 2 ? prev - 1 : prev)} sx={{ color: 'gray', border: 3, borderRadius: 1, fontSize: 35 }}/>
				</IconButton>
				<Box sx={{ color: '#ececec', border: 3, borderRadius: 1, width: '3vw', aspectRatio: '1 / 1', fontSize: 30, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{playerCount}</Box>
				<IconButton >
					<AddSharpIcon onClick={() => setPlayerCount(prev => prev < 4 ? prev + 1 : prev)} sx={{ color: 'gray', border: 3, borderRadius: 1, fontSize: 35 }}/>
				</IconButton>
			</Box>
		</Box>
	)
}

function Stacking({stacking, setStacking, defaultTooltip, setOptionsTooltip}: 
	{stacking: boolean,
	setStacking: React.Dispatch<React.SetStateAction<boolean>>,
	defaultTooltip: string,
	setOptionsTooltip: React.Dispatch<React.SetStateAction<string>>})
{
	const text = "Allows +2 and +4 cards to be stacked, passing the punishment to the next player.";

	return (
		<Box sx={{display: 'flex', flexDirection: { xs: 'column', sm: 'row'}, alignItems: 'center', height: '15%'}}>
			<Box sx={{display: 'flex', alignItems: 'center', width: '35%'}}>
				<Typography sx={{ fontWeight: 'bold', mx: 2 }}>Stacking: </Typography>
			</Box>
			<Box onMouseEnter={() => setOptionsTooltip(text)} onMouseLeave={() => setOptionsTooltip(defaultTooltip)} sx={{display: 'flex', alignItems: 'center', width: '50%'}}>
				<IconButton >
					<ClearSharpIcon onClick={() => setStacking(false)} sx={{ color: [!stacking ? 'primary.main' : 'gray'], border: 3, borderRadius: 1, fontSize: 35 }}/>
				</IconButton>
				<IconButton >
					<CheckSharpIcon onClick={() => setStacking(true)} sx={{ color: [stacking ? 'success.main' : 'gray'], border: 3, borderRadius: 1, fontSize: 35 }}/>
				</IconButton>
			</Box>
		</Box>
	)
}

function SevenZero({sevenZero, setSevenZero, defaultTooltip, setOptionsTooltip}:
	{sevenZero: boolean,
	setSevenZero: React.Dispatch<React.SetStateAction<boolean>>,
	defaultTooltip: string,
	setOptionsTooltip: React.Dispatch<React.SetStateAction<string>>})
{
	const text = "When you play a 7 card, you must swap cards in your hand with another player hands.\n\n  \
		When you play a 0 card, ALL players pass their hands to the next player following play direction.";

	return (
		<Box sx={{display: 'flex', flexDirection: { xs: 'column', sm: 'row'}, alignItems: 'center', height: '15%'}}>
			<Box sx={{display: 'flex', alignItems: 'center', width: '35%'}}>
				<Typography sx={{ fontWeight: 'bold', mx: 2 }}>Seven-Zero: </Typography>
			</Box>
			<Box onMouseEnter={() => setOptionsTooltip(text)} onMouseLeave={() => setOptionsTooltip(defaultTooltip)} sx={{ display: 'flex', alignItems: 'center', width: '50%', height: '100%' }}>
				<IconButton>
					<ClearSharpIcon onClick={() => setSevenZero(false)} sx={{ color: [!sevenZero ? 'primary.main' : 'gray'], border: 3, borderRadius: 1, fontSize: 35 }}/>
				</IconButton>
				<IconButton >
					<CheckSharpIcon onClick={() => setSevenZero(true)} sx={{ color: [sevenZero ? 'success.main' : 'gray'], border: 3, borderRadius: 1, fontSize: 35 }}/>
				</IconButton>
			</Box>
		</Box>
	)
}

function Privacy({privacy, setPrivacy, defaultTooltip, setOptionsTooltip}:
	{privacy: boolean,
	setPrivacy: React.Dispatch<React.SetStateAction<boolean>>,
	defaultTooltip: string,
	setOptionsTooltip: React.Dispatch<React.SetStateAction<string>>})
{
	const text = "Determines if a room will be accesible through the Lobby List or just by the Room Code."

	return (
		<Box sx={{display: 'flex', flexDirection: { xs: 'column', sm: 'row'}, alignItems: 'center', height: '15%'}}>
			<Box sx={{display: 'flex', alignItems: 'center', width: '35%'}}>
				<Typography sx={{ fontWeight: 'bold', mx: 2 }}>Public: </Typography>
			</Box>
			<Box onMouseEnter={() => setOptionsTooltip(text)} onMouseLeave={() => setOptionsTooltip(defaultTooltip)} sx={{display: 'flex', alignItems: 'center', width: '50%'}}>
				<IconButton >
					<ClearSharpIcon onClick={() => setPrivacy(false)} sx={{ color: [!privacy ? 'primary.main' : 'gray'], border: 3, borderRadius: 1, fontSize: 35 }}/>
				</IconButton>
				<IconButton >
					<CheckSharpIcon onClick={() => setPrivacy(true)} sx={{ color: [privacy ? 'success.main' : 'gray'], border: 3, borderRadius: 1, fontSize: 35 }}/>
				</IconButton>
			</Box>
		</Box>
	)
}

function CreateRoom({ rooms }: { rooms: Room[]})
{
	const defaultTooltip = 'Hover on options for a brief explanation';
	const [optionsTooltip, setOptionsTooltip] = useState<string>(defaultTooltip);

	const [handCount, setHandCount] = useState<number>(7);
	const [playerCount, setPlayerCount] = useState<number>(4);
	const [stacking, setStacking] = useState<boolean>(false);
	const [sevenZero, setSevenZero] = useState<boolean>(false);
	const [privacy, setPrivacy] = useState<boolean>(true);

	const { user } = useAuth();

	const { joinRoom } = getGameContext();

	function CreateRoom()
	{
		const room_id = createRoomID({rooms});
		const message = { "type": "create",
					"name": user?.nick_name,
					"settings": { "hand_size": handCount,
									"stacking": stacking,
									"seven_zero": sevenZero,
									"max_players": playerCount,
									"public": privacy }}
		joinRoom(room_id, message);
	}

	return (
		<Box sx={{ width: '100%', height: '85%' }}>
			<Box sx={{ width: '50%', height: '85%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
				<Box sx={{ height: '25%', borderBottom: '1pxsolid', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'auto', whiteSpace: 'pre-line', textAlign: 'center' }} >
					<Typography sx={{ fontSize: {xs: '0.6rem', sm: '0.8rem', md: '1rem'} }}>{optionsTooltip}</Typography>
				</Box>
				<HandCount handCount={handCount} setHandCount={setHandCount} defaultTooltip={defaultTooltip} setOptionsTooltip={setOptionsTooltip} />
				<Stacking stacking={stacking} setStacking={setStacking} defaultTooltip={defaultTooltip} setOptionsTooltip={setOptionsTooltip} /> 
				<PlayerCount playerCount={playerCount} setPlayerCount={setPlayerCount} defaultTooltip={defaultTooltip} setOptionsTooltip={setOptionsTooltip} />
				<SevenZero sevenZero={sevenZero} setSevenZero={setSevenZero} defaultTooltip={defaultTooltip} setOptionsTooltip={setOptionsTooltip} />
				<Privacy privacy={privacy} setPrivacy={setPrivacy} defaultTooltip={defaultTooltip} setOptionsTooltip={setOptionsTooltip} />
			</Box>
				<Button onClick={CreateRoom} variant="contained" sx={{ my:1, width: '98%', height: '15%' }}>CREATE ROOM</Button>
		</Box>
	)
}

function JoinPublic({rooms}: {rooms: Room[]})
{
	const [selected, setSelected] = useState<string | null>(null);

	const { joinRoom } = getGameContext();
	const { user } = useAuth();

	function PublicClick()
	{
		// Need to validate the join
		// Room member++ (State)
		// Need to track the user nickname

		const message = {"type": "join", "name": user?.nick_name};
		console.log(message);
		setSelected(null);
		if (selected !== null)
			joinRoom(selected, message)
	}

	return (
		<Box sx={{ width: '50%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
			<Box sx={{ height: '85%', width: '100%' }}>
				<ul className="flex-1 overflow-y-auto">
					{rooms.map((room) => (
						<li key={room.code}>
							<EachRoom room={room} room_flag={room.code === selected} onSelect={() => {setSelected(prev => prev === room.code ? null : room.code)}}   />
						</li>
					))}
				</ul>
			</Box>
			<Button onClick={PublicClick} variant="contained" disabled={selected === null} sx={{ my: 1, width: '99%', height: '15%' }}>JOIN</Button>
		</Box>
	)
}

function JoinPrivate()
{
	const [code, setCode] = useState<string>('');
	const { joinRoom } = getGameContext();
	const { user } = useAuth();

	function PrivateClick()
	{
		const message = {"type": "join", "name": user?.nick_name};
		joinRoom(code.trim(), message)
		setCode('');
	}

	return (
		<Box sx={{ width: '50%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
			<Box sx={{ height: '85%'}}>
				<Box sx={{height: '100%'}}>
					<h3> Have a Room Code?</h3>
					<OutlinedInput placeholder="Room Code" value={code} onChange={(event) => setCode(event.target.value)}/>
				</Box>
			</Box>
			<Button onClick={PrivateClick} variant="contained" disabled={code === ''} sx={{ my: 1, width: '99%', height: '15%' }}>
				<Typography>JOIN WITH CODE</Typography>
			</Button>
		</Box>
	)
}

function JoinRoom({rooms}: {rooms: Room[]})
{
	// flexDirection: {xs: 'column', md: 'row'}, 
	return (
		<Box sx={{ height: '100%', width: '100%', display: 'flex', overflow: 'hidden' }}>
			<JoinPublic rooms={rooms}/>
			<Divider orientation="vertical" flexItem/>
			<JoinPrivate />
		</Box>
	)
}

function JoinCreateLobby({ rooms }: { rooms: Room[]})
{
	const [value, setValue] = useState(0);

	function handleChange(_: React.SyntheticEvent, newValue: number) {
		setValue(newValue)
	}

	return (
		 <ThemeProvider theme={unoTheme}>
			<Container sx={{ height: '75dvh', width: '80dvw', display: 'flex', flexDirection: 'column', my: 2, p: 0.5, border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: 'background.paper' }}>
				<Tabs value={value} onChange={handleChange} sx={{ height: '10%', width:'100%', '& .MuiTab-root': { minHeight: 40, fontWeight: 700, fontSize: '1rem' }}} >
					<Tab sx={{ width: '50%'}} label="JOIN GAME" />
					<Tab sx={{ width: '50%'}} label="CREATE GAME" />
				</Tabs>
				<Box sx={{height: '90%', display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
						{value === 0 ? <JoinRoom rooms={rooms}/> : <CreateRoom rooms={rooms}/>}
				</Box>
			</Container>
		</ThemeProvider>
	)
}

function Lobby()
{
	const [rooms, setRooms] = useState<Room[]>([]);

	useEffect(() => {
		async function getRooms() {
			try {
				const response = await fetch('/api/rooms');
	
				if (!response.ok) {
					throw new Error(`HTTP error: ${response.status}`);
				}
				
				const rooms = await response.json();
				setRooms(rooms);
			}
			catch (error) {
				console.log('Request failed:', error);
			}
		}
		getRooms();
		const interval = setInterval(getRooms, 1500);
		return () => clearInterval(interval);
	}, []);

	return (<JoinCreateLobby rooms={rooms}/>);
}

export default Lobby


