import { Box, IconButton, Typography } from '@mui/material';
import ClearSharpIcon from '@mui/icons-material/ClearSharp';
import CheckSharpIcon from '@mui/icons-material/CheckSharp';
import { align_noJustify, buttons_text, menu_text } from '../game/macrosConfig.ts';

function SevenZeroSettings({sevenZero, setSevenZero, defaultTooltip, setOptionsTooltip}:
	{sevenZero: boolean,
	setSevenZero: React.Dispatch<React.SetStateAction<boolean>>,
	defaultTooltip: string,
	setOptionsTooltip: React.Dispatch<React.SetStateAction<string>>})
{
	const text = "When you play a 7 card, you must swap cards in your hand with another player hands.\n  \
		When you play a 0 card, players pass their hands to the next player in play direction.";

	return (
		<Box sx={{...align_noJustify, height: '15%', width: '100%' }}>
			<Box sx={{...align_noJustify, width: '50%' }}>
				<Typography sx={{ fontWeight: 'bold', mx: 2, ...menu_text }}>Seven-Zero: </Typography>
			</Box>
			<Box onMouseEnter={() => setOptionsTooltip(text)} onMouseLeave={() => setOptionsTooltip(defaultTooltip)} sx={{ ...align_noJustify, width: '50%', height: '100%', flexShrink: 0 }}>
				<IconButton>
					<ClearSharpIcon onClick={() => setSevenZero(false)} sx={{ color: [!sevenZero ? 'primary.main' : 'gray'], border: 3, borderRadius: 1, ...buttons_text }}/>
				</IconButton>
				<IconButton >
					<CheckSharpIcon onClick={() => setSevenZero(true)} sx={{ color: [sevenZero ? 'success.main' : 'gray'], border: 3, borderRadius: 1, ...buttons_text }}/>
				</IconButton>
			</Box>
		</Box>
	)
}

export default SevenZeroSettings