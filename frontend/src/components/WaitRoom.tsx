import { Box, Button, Card, CardContent , CardMedia, Container, Chip,
	IconButton,  List, ListItem, ThemeProvider, Typography } from '@mui/material';
import StarOutlinedIcon from '@mui/icons-material/StarOutlined';
import WifiOffOutlinedIcon from '@mui/icons-material/WifiOffOutlined';
import ExitToAppOutlinedIcon from '@mui/icons-material/ExitToAppOutlined';
import DisabledByDefaultOutlinedIcon from '@mui/icons-material/DisabledByDefaultOutlined';
import { unoTheme } from '../ui/unoTheme';
import { useGameContext } from '../core/GameWebSocketContext';
import {easy_bot, medium_bot, hard_bot, start_game} from '../game/macrosConfig.ts';
import { bot_easy, bot_medium, bot_hard } from '../ui/ImagesUtils.ts';

function WaitRoom()
{
	const { roomID, gameState, sendMessage, leaveRoom } = useGameContext();

	const host = gameState?.you.id !== gameState?.host_id;
	const room_full = gameState?.players.length !== gameState?.settings?.max_players;
	const text = room_full ? `WAITING FOR PLAYERS ${gameState?.players.length} / ${gameState?.settings?.max_players}` : 'START';

	const button_text = {fontSize: { xs: '1.6vh', md: '2vh' }}

	return (
		<ThemeProvider theme={unoTheme}>
			<Container sx={{ height: '65dvh', width: { xs: '95%', md: '80%' }, display: 'flex', flexDirection: 'column', my: 2, p: 0.5,
				position: 'relative', border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: 'background.paper' }}>
				<Box sx={{height: '10%', width: '100%'}}>
					<Typography variant="h5" sx={{  height: '100%', width: '100%', display: 'flex', justifyContent: 'center',
						alignItems: 'center', fontSize: { xs: '1.2rem', md: '1.5rem' }}}>ROOM ID: {roomID}</Typography>
					<IconButton size="large" sx={{ position: 'absolute', top: 0, right: 0, zIndex: 1 }} onClick={() => leaveRoom()}>
						<ExitToAppOutlinedIcon fontSize="inherit"/>
					</IconButton>
				</Box>
				<Box sx={{ height: '90%', width: '100%' }}>
					<Box sx={{ height: '85%', width: '100%', bgcolor: 'black' }}>
						<List className="no-select" sx={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', p: 0 }}>
							{gameState?.players.map((player) => {
									const avatar = player.bot ? 
										(player?.bot_level === 'easy' ? bot_easy
											: player.bot_level === 'medium' ? bot_medium
											: bot_hard) : player.avatar;
								return (
								<ListItem key={player.id} sx={{ height: '20%', width: '100%', p: 0.5 }}>
									<Card sx={{ height: '100%', width: '100%', display: 'flex', position: 'relative' }}>
										<CardMedia draggable={false} component="img" sx={{ width: '12%', height: 'auto', display: 'flex', alignItems: 'center' }} image={avatar}/>
										<CardContent sx={{display: 'flex', gap: 2}}>
											<Typography variant="h6">{player.name}</Typography>
											{player.connected 
												? <></> 
												: <Chip icon={<WifiOffOutlinedIcon />} label="Reconnecting" sx={{ backgroundColor: 'transparent',
													color: 'text.secondary', border: '1px dashed', borderColor: 'text.secondary', opacity: 0.55,
													fontSize: '0.95rem', py: 2.2, px: 0.5, '& .MuiChip-icon': { color: 'text.secondary' },}}/>}
										</CardContent>
										<CardContent sx={{display: 'flex', alignItems: 'center', }}>
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
							)})}
							<ListItem key={'bot_menu'} sx={{ height: '20%', width: '100%', p: 0.5 }}>
								<Card sx={{ height: '100%', width: '100%', display: 'flex', position: 'relative', alignItems: 'center' }}>
									<Typography sx={{ p: { xs: 1, md: 3 }, ...button_text }}>ADD BOT</Typography>
									<CardContent sx={{ display: 'flex', position: 'absolute', alignItems: 'center', right: 0 }}>
											<Button disabled={host || !room_full} variant="contained" sx={{ mx: '2%', bgcolor: '#708c08' }} onClick={() => sendMessage(easy_bot)}>
												<Typography sx={{...button_text}}>EASY</Typography>
											</Button>
											<Button disabled={host || !room_full} variant="contained" sx={{ mx: '2%', bgcolor: '#c7950e' }} onClick={() => sendMessage(medium_bot)}>
												<Typography sx={{...button_text}}>MEDIUM</Typography>
											</Button>
											<Button disabled={host || !room_full} variant="contained" sx={{ mx: '2%', bgcolor: '#cf5900' }} onClick={() => sendMessage(hard_bot)}>
												<Typography sx={{...button_text}}>HARD</Typography>
											</Button>
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

export default WaitRoom