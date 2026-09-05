import { Link } from "react-router-dom";
import { Box, Button, Container, Typography } from '@mui/material'
import { small_text, big_text } from '../game/macrosConfig.ts'

 function HomePage() 
 {
    return (
        <Container maxWidth={false} sx={{ maxWidth: '75vw', py: '5%' }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, alignItems: 'center' }}>
                <Box sx={{ width: '45%' }}>
					<Typography sx={{ color: 'white', mt: '15%', ...big_text, whiteSpace: 'nowrap' }}>
						EXPERIENCE UNO
					</Typography>
					<Typography sx={{ color: 'white', ...big_text }}>
						LIVE<span style={{ color: '#fb2c36' }}>.</span>
					</Typography>
					<Typography sx={{ color: '#d1d5dc', mt: '10%', ...small_text, whiteSpace: 'nowrap', filter: 'drop-shadow(1px 1px 1px black)' }}>
						Challenge your friends online.
					</Typography>
                    <Box sx={{ display: 'flex', mt: "20%" }}>
						<Button draggable={false} component={Link} to="/play" className="play-button"
							sx={{ textTransform: 'none', color: 'black', py: '5%',px: '10%', borderRadius: '10000px', fontWeight: 'bold',
							fontSize: 'clamp(0.5rem, 2vh, 1.5rem)', whiteSpace: 'nowrap' }}>
							Play Now
						</Button>
                    </Box>
                </Box>
            </Box>
        </Container>
    );
}

export default HomePage
