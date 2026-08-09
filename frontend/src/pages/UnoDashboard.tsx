import React, { useState, useEffect } from 'react';
import {
    ThemeProvider,
    createTheme,
    CssBaseline,
    Box,
    Container,
    Grid,
    Paper,
    Typography,
    Avatar,
    LinearProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Stack,
    IconButton,
    Tooltip,
} from '@mui/material';

const unoTheme = createTheme({
    palette: {
        mode: 'dark',
        primary: { main: '#f44336' },   // UNO red
        secondary: { main: '#ffeb3b' }, // UNO yellow
        success: { main: '#4caf50' },   // UNO green
        info: { main: '#2196f3' },      // UNO blue
        background: {
            default: '#0f172a',
            paper: '#1e293b',
        },
        text: {
            primary: '#f8fafc',
            secondary: '#94a3b8',
        },
    },
    typography: {
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        h4: { fontWeight: 800 },
        h5: { fontWeight: 700 },
        h6: { fontWeight: 600 },
    },
    components: {
        MuiPaper: {
            styleOverrides: {
                root: {
                    borderRadius: 16,
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    backgroundImage: 'none',
                },
            },
        },
    },
});

const leaderboardData = [
    { rank: 1, name: 'FireUno', level: 48, wins: 1250, winRate: '78%' },
    { rank: 2, name: 'StarPlayer', level: 45, wins: 1180, winRate: '76%' },
    { rank: 3, name: 'UnoLegend', level: 42, wins: 1095, winRate: '75%' },
    { rank: 4, name: 'GameMaster', level: 39, wins: 980, winRate: '73%' },
    { rank: 5, name: 'QuickPlay', level: 37, wins: 910, winRate: '71%' },
    { rank: 6, name: 'UnoChamp', level: 35, wins: 880, winRate: '70%' },
    { rank: 7, name: 'CardShark', level: 33, wins: 850, winRate: '69%' },
    { rank: 8, name: 'PlaySmart', level: 31, wins: 820, winRate: '68%' },
    { rank: 215, name: 'PlayerUno_99 (You)', level: 15, wins: 287, winRate: '69.66%', isCurrent: true },
];

const matchHistoryData = [
    { id: '#UNO-9082', result: 'WIN', duration: '4m 12s', players: 4, score: '+150 XP', date: '2026-08-07 11:20' },
    { id: '#UNO-9079', result: 'WIN', duration: '6m 45s', players: 2, score: '+220 XP', date: '2026-08-07 10:15' },
    { id: '#UNO-9055', result: 'LOSS', duration: '3m 10s', players: 4, score: '-50 XP', date: '2026-08-06 21:04' },
    { id: '#UNO-9021', result: 'WIN', duration: '8m 02s', players: 3, score: '+180 XP', date: '2026-08-06 18:30' },
    { id: '#UNO-8990', result: 'LOSS', duration: '5m 50s', players: 4, score: '-40 XP', date: '2026-08-05 15:12' },
    { id: '#UNO-8982', result: 'WIN', duration: '2m 40s', players: 2, score: '+130 XP', date: '2026-08-05 14:00' },
];

const playerData = {
    username: 'Alice Joao',
    level: 42,
    title: 'UNO Super Master',
    xp: 1520,
    xpToNextLevel: 2000,
    totalMatches: 42,
    wins: 21,
    losses: 21,
    winRate: '50.00%',
};

export default function UnoDashboard() {
    // activeView state: 'summary' (pie chart), 'all' (all matches), 'wins' (only wins), 'losses' (only losses)
    const [activeView, setActiveView] = useState('summary');

    const filteredMatches = matchHistoryData.filter((match) => {
        if (activeView === 'wins') return match.result === 'WIN';
        if (activeView === 'losses') return match.result === 'LOSS';
        return true;
    });

    return (
        <ThemeProvider theme={unoTheme}>
            <CssBaseline />
            <Container maxWidth="xl" sx={{ py: 4 }}>

                {/* Header */}
                <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography
                        variant="h4"
                        component="h1"
                        sx={{
                            background: 'linear-gradient(45deg, #f44336, #ffeb3b)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}
                    >
                        UNO Leaderboard & Match History
                    </Typography>
                    <Chip label="LIVE ONLINE" color="success" size="small" sx={{ fontWeight: 'bold' }} />
                </Box>

                <Grid container spacing={1}>

                    <Grid size={{ xs: 12, md: 4 }}>
                        <Stack spacing={3}>
                            <Paper sx={{ p: 3, background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' }}>
                                <Grid container spacing={2} sx={{ alignItems: 'center' }}>
                                    <Grid>
                                        <Avatar
                                            sx={{
                                                width: 64,
                                                height: 64,
                                                bgcolor: 'primary.main',
                                                fontSize: '1.75rem',
                                                fontWeight: 'bold',
                                                border: '3px solid #ffeb3b',
                                            }}
                                        >
                                            U
                                        </Avatar>
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 8 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography variant="h6">{playerData.username}</Typography>
                                            <Chip
                                                label={`Lvl ${playerData.level}`}
                                                color="secondary"
                                                size="small"
                                                sx={{ fontWeight: 'bold', color: '#000', height: 20 }}
                                            />
                                        </Box>
                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                            Title: {playerData.title} | XP: {playerData.xp.toLocaleString()}/{playerData.xpToNextLevel.toLocaleString()}
                                        </Typography>
                                        <Box sx={{ width: '100%', mt: 1.5 }}>
                                            <LinearProgress variant="determinate" value={76} color="info" sx={{ height: 8, borderRadius: 4 }} />
                                        </Box>
                                    </Grid>
                                </Grid>
                            </Paper>
                            <Grid container spacing={1}>
                                <Grid size={{ xs: 3 }}>
                                    <Tooltip title="Click to view all match history" arrow>
                                        <Paper
                                            onClick={() => setActiveView('all')}
                                            sx={{
                                                p: 2,
                                                textAlign: 'center',
                                                borderTop: '4px solid #2196f3',
                                                cursor: 'pointer',
                                                transition: 'transform 0.2s, background-color 0.2s',
                                                bgcolor: activeView === 'all' ? 'rgba(33, 150, 243, 0.15)' : 'background.paper',
                                                '&:hover': { transform: 'translateY(-3px)', bgcolor: 'rgba(33, 150, 243, 0.1)' },
                                            }}
                                        >
                                            <Typography variant="caption" color="text.secondary">Total ↗</Typography>
                                            <Typography variant="h6" sx={{ mt: 0.5, fontWeight: 'bold' }}>{playerData.totalMatches}</Typography>
                                        </Paper>
                                    </Tooltip>
                                </Grid>

                                <Grid size={{ xs: 3 }}>
                                    <Tooltip title="Click to filter winning matches" arrow>
                                        <Paper
                                            onClick={() => setActiveView('wins')}
                                            sx={{
                                                p: 2,
                                                textAlign: 'center',
                                                borderTop: '4px solid #4caf50',
                                                cursor: 'pointer',
                                                transition: 'transform 0.2s, background-color 0.2s',
                                                bgcolor: activeView === 'wins' ? 'rgba(76, 175, 80, 0.15)' : 'background.paper',
                                                '&:hover': { transform: 'translateY(-3px)', bgcolor: 'rgba(76, 175, 80, 0.1)' },
                                            }}
                                        >
                                            <Typography variant="caption" color="text.secondary">Wins ↗</Typography>
                                            <Typography variant="h6" sx={{ mt: 0.5, fontWeight: 'bold', color: 'success.main' }}>{playerData.wins}</Typography>
                                        </Paper>
                                    </Tooltip>
                                </Grid>

                                <Grid size={{ xs: 3 }}>
                                    <Tooltip title="Click to filter losing matches" arrow>
                                        <Paper
                                            onClick={() => setActiveView('losses')}
                                            sx={{
                                                p: 2,
                                                textAlign: 'center',
                                                borderTop: '4px solid #f44336',
                                                cursor: 'pointer',
                                                transition: 'transform 0.2s, background-color 0.2s',
                                                bgcolor: activeView === 'losses' ? 'rgba(244, 67, 54, 0.15)' : 'background.paper',
                                                '&:hover': { transform: 'translateY(-3px)', bgcolor: 'rgba(244, 67, 54, 0.1)' },
                                            }}
                                        >
                                            <Typography variant="caption" color="text.secondary">Losses ↗</Typography>
                                            <Typography variant="h6" sx={{ mt: 0.5, fontWeight: 'bold', color: 'primary.main' }}>{playerData.losses}</Typography>
                                        </Paper>
                                    </Tooltip>
                                </Grid>

                                <Grid size={{ xs: 3 }}>
                                    <Tooltip title="Click to view pie chart summary" arrow>
                                        <Paper
                                            onClick={() => setActiveView('summary')}
                                            sx={{
                                                p: 2,
                                                textAlign: 'center',
                                                borderTop: '4px solid #ffeb3b',
                                                cursor: 'pointer',
                                                transition: 'transform 0.2s, background-color 0.2s',
                                                bgcolor: activeView === 'summary' ? 'rgba(255, 235, 59, 0.15)' : 'background.paper',
                                                '&:hover': { transform: 'translateY(-3px)', bgcolor: 'rgba(255, 235, 59, 0.1)' },
                                            }}
                                        >
                                            <Typography variant="caption" color="text.secondary">Win Rate</Typography>
                                            <Typography variant="h6" sx={{ mt: 0.5, fontWeight: 'bold', color: 'secondary.main' }}>{playerData.winRate}</Typography>
                                        </Paper>
                                    </Tooltip>
                                </Grid>
                            </Grid>

                            <Paper sx={{ p: 3, minHeight: 320 }}>
                                {activeView === 'summary' ? (
                                    <Box sx={{ textAlign: 'center' }}>
                                        <Typography variant="h6" sx={{ mb: 2 }}>Win / Loss Ratio</Typography>

                                        {/* SVG Donut/Pie Chart */}
                                        <Box sx={{ position: 'relative', display: 'inline-flex', justifyContent: 'center', alignItems: 'center', my: 2 }}>
                                            <svg width="180" height="180" viewBox="0 0 42 42">
                                                <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#f44336" strokeWidth="5" />
                                                <circle
                                                    cx="21"
                                                    cy="21"
                                                    r="15.91549430918954"
                                                    fill="transparent"
                                                    stroke="#4caf50"
                                                    strokeWidth="5"
                                                    strokeDasharray="50 50"
                                                    strokeDashoffset="25"
                                                />
                                            </svg>
                                            <Box sx={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#4caf50' }}>{playerData.winRate}</Typography>
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
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                            <Typography variant="h6">
                                                {activeView === 'all' && 'All Matches'}
                                                {activeView === 'wins' && 'Winning Matches'}
                                                {activeView === 'losses' && 'Losing Matches'}
                                            </Typography>
                                            <Chip
                                                label="Back to Chart ↩"
                                                onClick={() => setActiveView('summary')}
                                                size="small"
                                                color="secondary"
                                                sx={{ cursor: 'pointer', fontWeight: 'bold', color: '#000' }}
                                            />
                                        </Box>

                                        <TableContainer>
                                            <Table size="small">
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell sx={{ fontWeight: 'bold' }}>Match ID</TableCell>
                                                        <TableCell sx={{ fontWeight: 'bold' }}>Result</TableCell>
                                                        <TableCell sx={{ fontWeight: 'bold' }}>Score</TableCell>
                                                        <TableCell sx={{ fontWeight: 'bold' }} align="right">Time</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {filteredMatches.map((match) => (
                                                        <TableRow key={match.id} hover>
                                                            <TableCell component="th" scope="row" sx={{ fontFamily: 'monospace' }}>
                                                                {match.id}
                                                            </TableCell>
                                                            <TableCell>
                                                                <Chip
                                                                    label={match.result}
                                                                    color={match.result === 'WIN' ? 'success' : 'error'}
                                                                    size="small"
                                                                    sx={{ height: 20, fontSize: '0.7rem', fontWeight: 'bold' }}
                                                                />
                                                            </TableCell>
                                                            <TableCell sx={{ fontWeight: 'bold', color: match.result === 'WIN' ? 'success.main' : 'error.main' }}>
                                                                {match.score}
                                                            </TableCell>
                                                            <TableCell align="right" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                                                                {match.date.split(' ')[1]}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    </Box>
                                )}
                            </Paper>

                        </Stack>
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                        <Paper sx={{ p: 3, height: '100%' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6">Friends</Typography>
                                {/* <Chip label="Top 42" variant="outlined" size="small" /> */}
                            </Box>

                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Rank</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Player</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Level</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }} align="right">Wins</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }} align="right">Win Rate</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {leaderboardData.map((row) => (
                                            <TableRow
                                                key={row.rank}
                                                sx={{
                                                    backgroundColor: row.isCurrent ? 'rgba(255, 235, 59, 0.15)' : 'transparent',
                                                    '&:last-child td, &:last-child th': { border: 0 },
                                                }}
                                            >
                                                <TableCell component="th" scope="row">
                                                    {row.rank === 1 && <Chip label="🥇 #1" color="secondary" size="small" sx={{ fontWeight: 'bold', color: '#000' }} />}
                                                    {row.rank === 2 && <Chip label="🥈 #2" size="small" sx={{ fontWeight: 'bold', bgcolor: '#e0e0e0', color: '#000' }} />}
                                                    {row.rank === 3 && <Chip label="🥉 #3" size="small" sx={{ fontWeight: 'bold', bgcolor: '#cd7f32', color: '#fff' }} />}
                                                    {row.rank > 3 && `#${row.rank}`}
                                                </TableCell>
                                                <TableCell sx={{ fontWeight: row.isCurrent ? 'bold' : 'normal' }}>
                                                    {row.name}
                                                </TableCell>
                                                <TableCell>Lvl {row.level}</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>{row.wins}</TableCell>
                                                <TableCell align="right" sx={{ color: 'success.main', fontWeight: 'bold' }}>{row.winRate}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Paper>
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                        <Paper sx={{ p: 3, height: '100%' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6">Global</Typography>
                                <Chip label="Top 42" variant="outlined" size="small" />
                            </Box>

                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Rank</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Player</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Level</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }} align="right">Wins</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }} align="right">Win Rate</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {leaderboardData.map((row) => (
                                            <TableRow
                                                key={row.rank}
                                                sx={{
                                                    backgroundColor: row.isCurrent ? 'rgba(255, 235, 59, 0.15)' : 'transparent',
                                                    '&:last-child td, &:last-child th': { border: 0 },
                                                }}
                                            >
                                                <TableCell component="th" scope="row">
                                                    {row.rank === 1 && <Chip label="🥇 #1" color="secondary" size="small" sx={{ fontWeight: 'bold', color: '#000' }} />}
                                                    {row.rank === 2 && <Chip label="🥈 #2" size="small" sx={{ fontWeight: 'bold', bgcolor: '#e0e0e0', color: '#000' }} />}
                                                    {row.rank === 3 && <Chip label="🥉 #3" size="small" sx={{ fontWeight: 'bold', bgcolor: '#cd7f32', color: '#fff' }} />}
                                                    {row.rank > 3 && `#${row.rank}`}
                                                </TableCell>
                                                <TableCell sx={{ fontWeight: row.isCurrent ? 'bold' : 'normal' }}>
                                                    {row.name}
                                                </TableCell>
                                                <TableCell>Lvl {row.level}</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>{row.wins}</TableCell>
                                                <TableCell align="right" sx={{ color: 'success.main', fontWeight: 'bold' }}>{row.winRate}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Paper>
                    </Grid>

                </Grid>
            </Container>
        </ThemeProvider>
    );
}