import { Box, IconButton, ThemeProvider, Typography } from '@mui/material';
import { unoTheme } from '../ui/unoTheme';
import { usePopUpContext } from '../core/GamePopUpsContext';
import ClearSharpIcon from '@mui/icons-material/ClearSharp';

function Error()
{
	const { errorMessage, resetPopUpStates } = usePopUpContext();

	const text_size = {textAlign: 'center', fontSize: 'clamp(0.7rem, 1.5vw, 2rem)'};
	const align = {display: 'flex', justifyContent: 'center', alignItems: 'center'};

	return (
		<ThemeProvider theme={unoTheme}>
			<Box className="no-select" sx={{ width: '35vw', aspectRatio: '1.6 / 1', ...align, border: '0.3vw solid',
				borderColor: 'primary.main', borderRadius: 2, bgcolor: 'background.default', flexDirection: 'column' }}>
				<Box sx={{ width: '100%', height: '15%', ...align, borderBottom: '0.1vh solid', borderBottomColor: 'primary.main'  }}>
					<Typography sx={{ ...text_size }}>ERROR</Typography>
				</Box>
				<Box sx={{ width: '100%', height: '75%',...align }}>
					<Typography sx={{ ...text_size, p: '1%' }}>{errorMessage}</Typography>
				</Box>
				<IconButton >
					<ClearSharpIcon onClick={resetPopUpStates} sx={{ color: 'primary.main', border: 3, borderRadius: 1,
						fontSize: 'clamp(0.7rem, 4vw, 2.5rem)' }}/>
				</IconButton>
			</Box>
		</ThemeProvider>
	)
}

export default Error