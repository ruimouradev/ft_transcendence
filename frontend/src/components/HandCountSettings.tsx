import { Box, IconButton , Typography } from '@mui/material';
import AddSharpIcon from '@mui/icons-material/AddSharp';
import RemoveSharpIcon from '@mui/icons-material/RemoveSharp';
import { align_noJustify, buttons_text, icons_text, menu_text } from '../game/macrosConfig.ts';

function HandCountSettings({handCount, setHandCount, defaultTooltip, setOptionsTooltip}:
	{handCount: number,
	setHandCount: React.Dispatch<React.SetStateAction<number>>,
	defaultTooltip: string,
	setOptionsTooltip: React.Dispatch<React.SetStateAction<string>>})
{
	const text = "Determines the initial amount of cards in each player hands.\nRange from 3 to 10.";

	return (
		<Box sx={{...align_noJustify, height: '15%', width: '100%'}}>
			<Box sx={{...align_noJustify, width: '50%'}}>
				<Typography sx={{ fontWeight: 'bold', mx: 2, ...menu_text }} >Initial Hand: </Typography>
			</Box>
			<Box onMouseEnter={() => setOptionsTooltip(text)} onMouseLeave={() => setOptionsTooltip(defaultTooltip)} sx={{...align_noJustify, width: '50%'}}>
				<IconButton >
					<RemoveSharpIcon onClick={() => setHandCount(prev => prev > 3 ? prev - 1 : prev)} sx={{ color: 'gray', border: 3, borderRadius: 1, ...buttons_text }}/>
				</IconButton>
				<Box sx={{ color: '#ececec', border: 3, borderRadius: 1, width: 'clamp(1.3rem, 3.5vw, 2rem)', aspectRatio: '1 / 1', flexShrink: 0, ...align_noJustify, justifyContent: 'center' }}>
					<Typography sx={{ textAlign: 'center', ...icons_text }}>{handCount}</Typography>
				</Box>
				<IconButton >
					<AddSharpIcon onClick={() => setHandCount(prev => prev < 10 ? prev + 1 : prev)} sx={{ color: 'gray', border: 3, borderRadius: 1, ...buttons_text }}/>
				</IconButton>
			</Box>
		</Box>
	)
}

export default HandCountSettings