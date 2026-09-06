import { Box, IconButton, Typography } from '@mui/material';
import ClearSharpIcon from '@mui/icons-material/ClearSharp';
import CheckSharpIcon from '@mui/icons-material/CheckSharp';
import { align_noJustify, buttons_text, menu_text } from '../game/macrosConfig.ts';

function PrivacySettings({privacy, setPrivacy, defaultTooltip, setOptionsTooltip}:
	{privacy: boolean,
	setPrivacy: React.Dispatch<React.SetStateAction<boolean>>,
	defaultTooltip: string,
	setOptionsTooltip: React.Dispatch<React.SetStateAction<string>>})
{
	const text = "Determines if a room will be accesible through the Lobby List or just by the Room Code."

	return (
		<Box sx={{...align_noJustify, height: '15%', width: '100%' }}>
			<Box sx={{...align_noJustify, width: '50%'}}>
				<Typography sx={{ fontWeight: 'bold', mx: 2, ...menu_text }}>Public: </Typography>
			</Box>
			<Box onMouseEnter={() => setOptionsTooltip(text)} onMouseLeave={() => setOptionsTooltip(defaultTooltip)} sx={{...align_noJustify, width: '50%'}}>
				<IconButton >
					<ClearSharpIcon onClick={() => setPrivacy(false)} sx={{ color: [!privacy ? 'primary.main' : 'gray'],
						border: 3, borderRadius: 1, ...buttons_text }}/>
				</IconButton>
				<IconButton >
					<CheckSharpIcon onClick={() => setPrivacy(true)} sx={{ color: [privacy ? 'success.main' : 'gray'],
						border: 3, borderRadius: 1, ...buttons_text }}/>
				</IconButton>
			</Box>
		</Box>
	)
}

export default PrivacySettings