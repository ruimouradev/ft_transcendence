import { Box, Grid, Paper, Typography, Avatar, LinearProgress, Chip } from '@mui/material';
import type { PlayerData } from '../core/types.ts';

import Achievements from './Achievements.tsx'

function StatsPlayerCard({playerData}: {playerData: PlayerData})
{
	return (
		<Paper sx={{ p: 3, background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' }}>
			<Grid container spacing={2} sx={{ alignItems: 'center' }}>
				<Grid>
					<Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main', fontSize: '1.75rem', fontWeight: 'bold' }} 
						src={playerData.user.avatar || undefined}>
						U
					</Avatar>
				</Grid>
				<Grid size={{ xs: 12, sm: 8 }}>
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
						<Typography variant="h6">{playerData.user.nick_name}</Typography>
						<Chip label={`Lvl ${playerData.level_info.current_level}`} color="secondary" size="small" 
							sx={{ fontWeight: 'bold', color: '#000', height: 20 }} />
					</Box>
					<Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
						Title: {playerData.level_info.title} | XP: {playerData.total_score.toLocaleString()}/{playerData.level_info.total_xp_for_next_level.toLocaleString()}
					</Typography>
					<Box sx={{ width: '100%', mt: 1.5 }}>
						<LinearProgress variant="determinate" value={playerData.level_info.progress_percentage} color="info" sx={{ height: 8, borderRadius: 4 }} />
					</Box>
				</Grid>
			</Grid>

			{/* Achievements badges */}
			<Achievements playerData={playerData} />
		</Paper>
	)
}

export default StatsPlayerCard