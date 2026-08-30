import { getGameContext } from '../core/GameWebSocket'

function Avatar({player, position}: {player: Player, position: string})
{
	const { sendMessage } = getGameContext();

	const function_call = position === 'south' 
		?  () => sendMessage({"type": "catch", "target": player.id}) 
		: () => console.log("IMPLEMENT EMOTICON");


	return (

	)
}

export default Avatar

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