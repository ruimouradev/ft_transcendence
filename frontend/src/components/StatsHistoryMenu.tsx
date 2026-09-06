import { Grid, Paper, Typography, Tooltip } from '@mui/material';
import type { ActiveView, PlayerData } from '../core/types.ts';

function StatTile({ label, value, color, active, tooltip, onClick }:
	{ label: string; value: string; color: string; active: boolean; tooltip: string; onClick: () => void })
{
    return (
        <Grid size={{ xs: 6, sm: 3 }}>
            <Tooltip title={tooltip} arrow>
                <Paper onClick={onClick} sx={{ p: 1.5, textAlign: 'center', borderTop: `4px solid ${color}`,
					cursor: 'pointer', transition: 'transform 0.2s, background-color 0.2s', bgcolor: active ? `${color}26` : 'background.paper',
					'&:hover': { transform: 'translateY(-3px)', bgcolor: `${color}1a` } }}>
                    <Typography variant="body2" color="text.secondary" noWrap sx={{ fontWeight: 600 }}>{label}</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{value}</Typography>
                </Paper>
            </Tooltip>
        </Grid>
    );
}

function StatsHistoryMenu({playerData, winRate, activeView, setActiveView}:
	{playerData: PlayerData, winRate: number, activeView: ActiveView, setActiveView: React.Dispatch<React.SetStateAction<ActiveView>>})
{
	return (
		<Grid container spacing={1}>
			<StatTile label="Total" value={String(playerData.total_games)} color="#2196f3" active={activeView === 'all'}
				tooltip="Click to view all match history" onClick={() => setActiveView('all')}/>
			<StatTile label="Wins" value={String(playerData.wins)} color="#4caf50" active={activeView === 'wins'}
				tooltip="Click to filter winning matches" onClick={() => setActiveView('wins')}/>
			<StatTile label="Losses" value={String(playerData.losses)} color="#f44336" active={activeView === 'losses'}
				tooltip="Click to filter losing matches" onClick={() => setActiveView('losses')}/>
			<StatTile label="Win Rate" value={`${winRate.toFixed(0)}%`} color="#ffeb3b" active={activeView === 'summary'}
				tooltip="Click to view the summary chart" onClick={() => setActiveView('summary')}/>
		</Grid>
	)
}

export default StatsHistoryMenu