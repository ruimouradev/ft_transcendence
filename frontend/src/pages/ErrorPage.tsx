import { Box, Button, Typography } from '@mui/material'
import { Link } from 'react-router';
import { align, menu_text, tab_text } from '../game/macrosConfig.ts'

function ErrorPage()
{
	const big_text = {fontSize: 'clamp(0.6rem, 5vw, 3rem)'}

	return (
		<>
			<Box sx={{ bgcolor: 'gray', width: 'min(70%, 100dvh)', aspectRatio: '1.5 / 1', mx: 'auto', mt: '2%', ...align,
				flexDirection: 'column', borderRadius: '1%' }}>
				<Box sx={{ bgcolor: '#070707', height: '90%', width: '95%', my: '2%', overflow: 'hidden' }}>
					<Box sx={{ height: '20%', width: '100%'}}>
						<Typography sx={{ m: '1%', ...menu_text }}>
							<span style={{ color: 'lightgreen', ...menu_text }}>bash$ </span> cd {window.location.href}
						</Typography>
						<Typography sx={{ m: '1%', ...menu_text }}>Segmentation fault (core dumped)</Typography>
					</Box>
					<Box sx={{ height: '80%', width: '100%', ...align }}>
						<Typography sx={{ ...big_text }}>404 Not Found</Typography>
					</Box>
				</Box>
				<Button variant="contained" sx={{ width: '10%', height: '10%', mx: 'auto',
					transform: 'TranslateY(-20%)', minWidth: 0, minHeight: 0 }}>
					<Link to='/'>
						<Typography sx={{ ...tab_text }}>Home</Typography>
					</Link>
				</Button>
			</Box>
			<Box sx={{ bgcolor: 'gray', width: '10%', height: '8dvh', mx: 'auto', transform: 'TranslateY(-3%)', }}></Box>
			<Box sx={{ bgcolor: 'gray', width: '30%', height: '2dvh', mx: 'auto', transform: 'TranslateY(-20%)', }}></Box>
		</>
	)
}

export default ErrorPage
