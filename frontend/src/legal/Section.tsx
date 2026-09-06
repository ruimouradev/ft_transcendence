import { Box, Typography } from '@mui/material'

function Section({ title, children }: { title: string; children: React.ReactNode }) 
{
    return (
		<Box sx={{ mb: 4 }} >
			<Typography sx={{ color: 'white', fontSize: '1.25rem', fontWeight: 'bold', mb: 1.5 }}>{title}</Typography>
            <Box sx={{ color: '#d1d1d1', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: 1.5 }} >{children}</Box>
        </Box>
    );
}

export default Section
