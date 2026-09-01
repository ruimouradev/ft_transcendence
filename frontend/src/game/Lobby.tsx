import { Box, Container, Divider, Tabs, Tab, ThemeProvider } from '@mui/material';
import { unoTheme } from '../ui/unoTheme';
import { useState, useEffect } from 'react';
import { tab_text } from '../game/macrosConfig.ts';
import CreateRoom from '../components/CreateRoom';
import JoinPrivate from '../components/JoinPrivate';
import JoinPublic from '../components/JoinPublic';
import type { Room } from './types.ts';

function JoinRoom({rooms}: {rooms: Room[]})
{
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
			<Container sx={{ height: '75dvh', width: '80dvw', display: 'flex', flexDirection: 'column', my: 2, p: 0.5,
				border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: 'background.paper' }}>
				<Tabs value={value} onChange={handleChange} sx={{ height: '10%', width:'100%' }} >
					<Tab sx={{ ...tab_text }} label="JOIN GAME" />
					<Tab sx={{ ...tab_text }} label="CREATE GAME" />
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
		const interval = setInterval(getRooms, 2000);
		return () => clearInterval(interval);
	}, []);

	return (<JoinCreateLobby rooms={rooms}/>);
}

export default Lobby