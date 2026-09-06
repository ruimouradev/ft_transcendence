import { Box, Paper, Typography, Table,
	TableBody, TableCell, TableContainer, TableHead, TableRow, Chip } from '@mui/material';
import type { ActiveView, MatchRecord, PlayerData } from '../core/types.ts'

function StatsHistoryInfo({playerData, winRate, activeView, filteredMatches}:
	{playerData: PlayerData, winRate: number, activeView: ActiveView, filteredMatches: MatchRecord[]})
{
	return (
		<Paper sx={{ p: 3, height: 420, overflow: 'auto' }}>
			{activeView === 'summary' ? (
				<Box sx={{ textAlign: 'center' }}>
					<Typography variant="h6" sx={{ mb: 2 }}>Win / Loss Ratio</Typography>

					<Box sx={{ position: 'relative', display: 'inline-flex', justifyContent: 'center', alignItems: 'center', my: 2 }}>
						<svg width="260" height="260" viewBox="0 0 42 42">
							<circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#f44336" strokeWidth="5" />
							<circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#4caf50" strokeWidth="5"
								strokeDasharray={`${winRate.toFixed(2)} ${(100 - winRate).toFixed(2)}`} strokeDashoffset="25"/>
						</svg>
						<Box sx={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
							<Typography variant="h5" sx={{ fontWeight: 'bold', color: '#4caf50' }}>{winRate.toFixed(2)}%</Typography>
							<Typography variant="caption" color="text.secondary">Win Rate</Typography>
						</Box>
					</Box>

					<Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mt: 1 }}>
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
							<Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#4caf50' }} />
							<Typography variant="body2">Wins ({playerData.wins})</Typography>
						</Box>
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
							<Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#f44336' }} />
							<Typography variant="body2">Losses ({playerData.losses})</Typography>
						</Box>
					</Box>
				</Box>
			) : (
				<Box>
					<Typography variant="h6" sx={{ mb: 2 }}>
						{activeView === 'all' && 'All Matches'}
						{activeView === 'wins' && 'Winning Matches'}
						{activeView === 'losses' && 'Losing Matches'}
					</Typography>
					<TableContainer>
						<Table>
							<TableHead>
								<TableRow>
									<TableCell sx={{ fontWeight: 'bold' }}>Result</TableCell>
									<TableCell sx={{ fontWeight: 'bold' }}>Score</TableCell>
									<TableCell sx={{ fontWeight: 'bold' }}>Opponents</TableCell>
									<TableCell sx={{ fontWeight: 'bold' }} align="right">Time</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{filteredMatches.map((match) => (
									<TableRow key={match.game_id} hover>
										<TableCell>
											<Chip
												label={match.is_winner ? "win" : "loss"}
												color={match.is_winner ? 'success' : 'error'}
												size="small"
												sx={{ height: 20, fontSize: '0.7rem', fontWeight: 'bold' }}
											/>
										</TableCell>
										<TableCell sx={{ fontWeight: 'bold', color: match.is_winner ? 'success.main' : 'error.main' }}>
											{match.score}
										</TableCell>
										<TableCell>
											{match.opponents || '-'}
										</TableCell>
										<TableCell align="right" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
											{new Date(match.finished_at).toLocaleString()}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</TableContainer>
				</Box>
			)}
		</Paper>
	)
}

export default StatsHistoryInfo