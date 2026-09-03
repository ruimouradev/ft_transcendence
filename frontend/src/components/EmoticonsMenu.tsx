import { Box, Card, Popover } from '@mui/material';
import { useGameContext } from '../core/GameWebSocketContext';
import { emoticon_sad, emoticon_angry, emoticon_happy, emoticon_confidence,
	emoticon_nervous, emoticon_surprised } from '../ui/ImagesUtils';

function EmoticonsMenu({anchor, handleClose, startCooldown}:
	 {anchor: HTMLElement | null, handleClose: () => void, startCooldown: () => void})
{
	const { sendMessage } = useGameContext();
	const emoticons = [emoticon_sad, emoticon_angry, emoticon_happy, emoticon_confidence, emoticon_nervous, emoticon_surprised];

	if (anchor === null)
		return (null);

	function execEmoticon(index: number)
	{
		sendMessage({"type": "emote", "icon": index + 1});
		handleClose();
		startCooldown();
	}

	return (
		<Popover open={true} anchorEl={anchor} onClose={handleClose} anchorOrigin={{ vertical: 'top', horizontal: 'center'}}
			transformOrigin={{vertical: 'center', horizontal: 'center'}} 
			slotProps={{ paper: { sx: { bgcolor: 'transparent',  boxShadow: 'none', overflow: 'visible', transform: 'translateY(-3vw) !important' }} }}>
			<Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center',
					justifyContent: 'center', gap: '1vw',}}>
				{emoticons.map((emoticon, index) => {
					const mid = (emoticons.length - 1) / 2;
					const distance = Math.abs(index - mid);
					const offset = (distance * 30) - 40;
					return (
						<Card key={index} onClick={() => execEmoticon(index)} sx={{ bgcolor: 'white', width: '5vw', aspectRatio: '1 / 1',
							display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `translateY(${offset}%)`, border: '0.1vw solid black' }}>
							<img src={emoticon} draggable={false} />
						</Card>
					)
				})}
			</Box>
		</Popover>
	)
}

export default EmoticonsMenu