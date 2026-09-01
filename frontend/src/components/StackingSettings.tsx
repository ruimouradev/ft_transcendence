import { Box, IconButton, Typography } from '@mui/material';
import ClearSharpIcon from '@mui/icons-material/ClearSharp';
import CheckSharpIcon from '@mui/icons-material/CheckSharp';
import { align_noJustify, buttons_text, menu_text } from '../game/macrosConfig.ts';

function StackingSettings({stacking, setStacking, defaultTooltip, setOptionsTooltip}: 
	{stacking: boolean,
	setStacking: React.Dispatch<React.SetStateAction<boolean>>,
	defaultTooltip: string,
	setOptionsTooltip: React.Dispatch<React.SetStateAction<string>>})
{
	const text = "Allows +2 and +4 cards to be stacked, passing the punishment to the next player.";

	return (
		<Box sx={{...align_noJustify, height: '15%', width: '100%' }}>
			<Box sx={{...align_noJustify, width: '50%'}}>
				<Typography sx={{ fontWeight: 'bold', mx: 2, ...menu_text }}>Stacking: </Typography>
			</Box>
			<Box onMouseEnter={() => setOptionsTooltip(text)} onMouseLeave={() => setOptionsTooltip(defaultTooltip)} sx={{...align_noJustify, width: '50%'}}>
				<IconButton >
					<ClearSharpIcon onClick={() => setStacking(false)} sx={{ color: [!stacking ? 'primary.main' : 'gray'], border: 3, borderRadius: 1, ...buttons_text }}/>
				</IconButton>
				<IconButton >
					<CheckSharpIcon onClick={() => setStacking(true)} sx={{ color: [stacking ? 'success.main' : 'gray'], border: 3, borderRadius: 1, ...buttons_text }}/>
				</IconButton>
			</Box>
		</Box>
	)
}

export default StackingSettings