import { Box, Typography, Chip, Tooltip } from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import type { BadgeKind, PlayerData } from '../core/types.ts';

const BADGES: { name: string; need: number; kind: BadgeKind; color: string }[] = [
    { name: 'First Game', need: 1, kind: 'games', color: '#2196f3' },
    { name: 'First Win', need: 1, kind: 'wins', color: '#4caf50' },
    { name: 'Champion', need: 10, kind: 'wins', color: '#ffeb3b' },
    { name: 'Veteran', need: 25, kind: 'games', color: '#2196f3' },
    { name: 'Unstoppable', need: 25, kind: 'wins', color: '#f44336' },
    { name: 'Marathoner', need: 50, kind: 'games', color: '#ab47bc' },
    { name: 'High Roller', need: 500, kind: 'score', color: '#ff9800' },
    { name: 'Level 10', need: 10, kind: 'level', color: '#4caf50' },
];

const BADGE_UNITS: Record<BadgeKind, string> = {
    wins: 'wins',
    games: 'games',
    score: 'points',
    level: 'levels',
};

function Achievements({playerData}: {playerData: PlayerData})
{
	return (
		<>
			<Typography variant="subtitle1" sx={{ mt: 2.5, mb: 1.5, fontWeight: 700 }}>
				Achievements
			</Typography>
			<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.2 }}>
				{BADGES.map((badge) => {
					const values: Record<BadgeKind, number> = {
						wins: playerData.wins,
						games: playerData.total_games,
						score: playerData.total_score,
						level: playerData.level_info.current_level,
					};
					const value = values[badge.kind];
					const unlocked = value >= badge.need;
					const progress = `${value}/${badge.need} ${BADGE_UNITS[badge.kind]}`;
					return (
						<Tooltip key={badge.name} title={unlocked ? 'Unlocked!' : progress} arrow>
							<Chip
								icon={<EmojiEventsIcon />}
								label={badge.name}
								sx={unlocked
									? { backgroundColor: badge.color, color: '#0f172a', fontWeight: 'bold', fontSize: '0.95rem', py: 2.2,
										px: 0.5, '& .MuiChip-icon': { color: '#0f172a' } }
									: { backgroundColor: 'transparent', color: 'text.secondary', border: '1px dashed', borderColor: 'text.secondary',
										opacity: 0.55, fontSize: '0.95rem', py: 2.2, px: 0.5, '& .MuiChip-icon': { color: 'text.secondary' } }}
							/>
						</Tooltip>
					);
				})}
			</Box>
		</>
	)
}

export default Achievements