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
    Popover,
    Tooltip,
} from '@mui/material';

import { api } from '../client';
import GamePlayers from '../components/GamePlayers';

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

export default function UnoDashboard() {
    // activeView state: 'summary' (pie chart), 'all' (all matches), 'wins' (only wins), 'losses' (only losses)
    const [activeView, setActiveView] = useState('summary');
    const [playerData, setPlayerData] = useState({
        user: {
            email: '',
            full_name: '',
            avatar: '',
            is_active: false,
            is_superuser: false,
            is_verified: false,
            use2fa: false,
            id: "",
            created_at: '',
        },
        total_games: 0,
        wins: 0,
        losses: 0,
        total_score: 0,
        level_info: {
            current_level: 0,
            total_xp: 0,
            xp_in_current_level: 0,
            xp_required_for_next_level: 0,
            progress_percentage: 0,
            total_xp_for_next_level: 0,
            title: ''
        }
    });
    const [matchHistoryData, setMatchHistoryData] = useState([]);
    const [leaderboardDataGlobal, setLeaderboardDataGlobal] = useState([]);
    const [leaderboardDataFriends, setLeaderboardDataFriends] = useState([]);
    const [gamePlayers, setGamePlayers] = useState([]);

    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

    const handleRowClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };
    const open = Boolean(anchorEl);

    const filteredMatches = matchHistoryData.filter((match) => {
        if (activeView === 'wins') return match.is_winner;
        if (activeView === 'losses') return !match.is_winner;
        return true;
    });

    const handleGameRowClick = async (gameId) => {

        try {
            const response = await api.get(`/static/game/${gameId}/players`);
            // console.log('Fetched game players:', response.data);
            setGamePlayers(response.data);
        } catch (error) {
            console.error('Error fetching game players:', error);
        }
    }

    useEffect(() => {
        try {
            const fetchData = async () => {
                const response = await api.get('/static/maininfo');
                setPlayerData(response.data);
                // console.log('Fetched player stats:', response.data);

                const response1 = await api.get('/static/staticdetails');
                setMatchHistoryData(response1.data);
                // console.log('Fetched player stats all games:', response1.data);

                const response2 = await api.get('/static/leaderboard/friends');
                setLeaderboardDataFriends(response2.data);
                // console.log('Fetched player stats friends:', response2.data);

                const response3 = await api.get('/static/leaderboard/global');
                setLeaderboardDataGlobal(response3.data);
                // console.log('Fetched player stats global:', response3.data);
            };
            fetchData();
        } catch (error) {
            console.error('Error fetching player stats:', error);
        }
    }, []);

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
                                                border: '0px solid #ffeb3b',
                                            }}
                                            src={playerData.user.avatar || undefined}
                                        >
                                            U
                                        </Avatar>
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 8 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography variant="h6">{playerData.user.full_name}</Typography>
                                            <Chip
                                                label={`Lvl ${playerData.level_info.current_level}`}
                                                color="secondary"
                                                size="small"
                                                sx={{ fontWeight: 'bold', color: '#000', height: 20 }}
                                            />
                                        </Box>
                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                            Title: {playerData.level_info.title} | XP: {playerData.total_score.toLocaleString()}/{playerData.level_info.total_xp_for_next_level.toLocaleString()}
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
                                            onClick={() => { setActiveView('all'); setGamePlayers([]); }}
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
                                            <Typography variant="h6" sx={{ mt: 0.5, fontWeight: 'bold' }}>{playerData.total_games}</Typography>
                                        </Paper>
                                    </Tooltip>
                                </Grid>

                                <Grid size={{ xs: 3 }}>
                                    <Tooltip title="Click to filter winning matches" arrow>
                                        <Paper
                                            onClick={() => { setActiveView('wins'); setGamePlayers([]); }}
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
                                            onClick={() => { setActiveView('losses'); setGamePlayers([]); }}
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
                                            onClick={() => { setActiveView('summary'); setGamePlayers([]); }}
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
                                            <Typography variant="h6" sx={{ mt: 0.5, fontWeight: 'bold', color: 'secondary.main' }}>{(playerData.wins / (playerData.total_games || 1) * 100).toFixed(2)}%</Typography>
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
                                                    strokeDasharray={`${(playerData.wins / (playerData.total_games || 1) * 100).toFixed(2)} ${(100 - (playerData.wins / (playerData.total_games || 1) * 100)).toFixed(2)}`}
                                                    strokeDashoffset="25"
                                                />
                                            </svg>
                                            <Box sx={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#4caf50' }}>{(playerData.wins / (playerData.total_games || 1) * 100).toFixed(2)}%</Typography>
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
                                                        <TableRow key={match.game_id} hover onClick={(event) => { handleGameRowClick(match.game_id); setAnchorEl(event.currentTarget); }} sx={{ cursor: 'pointer' }}>
                                                            <TableCell component="th" scope="row" sx={{ fontFamily: 'monospace' }}>
                                                                {match.game_id.slice(0, 0) + '...' + match.game_id.slice(-5)}
                                                            </TableCell>
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
                                                            <TableCell align="right" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                                                                {match.finished_at.split('T')[0] + ' ' + match.finished_at.split('T')[1].split('.')[0]}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    </Box>
                                )}
                            </Paper>
                            {/* {gamePlayers.length > 0 && (
                                <Paper sx={{ p: 3, minHeight: 320 }}>
                                    <Typography variant="h6" sx={{ mb: 2 }}>Match History</Typography>
                                    <GamePlayers players={gamePlayers} currentPlayerId={playerData.user.id} />
                                </Paper>
                            )} */}

                            <Popover open={open} anchorEl={anchorEl} onClose={handleClose}
                                anchorOrigin={{
                                    vertical: "top",
                                    horizontal: "right",
                                }} >
                                {gamePlayers.length > 0 && (
                                <Paper sx={{ minWidth: 400, p:3, minHeight: 220 }}>
                                    <Typography variant="h6" sx={{ mb: 2 }}>Match History</Typography>
                                    <GamePlayers players={gamePlayers} currentPlayerId={playerData.user.id} />
                                </Paper>
                            )}
                            </Popover>

                            {/* <Paper sx={{ p: 3, minHeight: 320 }}>
                                <Typography variant="h6" sx={{ mb: 2 }}>Match History</Typography>
                                <GamePlayers players={gamePlayers} currentPlayerId={playerData.user.id} />
                            </Paper> */}
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
                                        {leaderboardDataFriends.map((row) => (
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
                                                    {row.user_id == playerData.user.id ? <Avatar src={playerData.user.avatar} className="rounded-full avatar-shine" sx={{ width: 24, height: 24 }} /> : row.full_name}
                                                </TableCell>
                                                <TableCell>Lvl {row.level}</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>{row.total_wins}</TableCell>
                                                <TableCell align="right" sx={{ color: 'success.main', fontWeight: 'bold' }}>{row.win_rate}%</TableCell>
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
                                        {leaderboardDataGlobal.map((row) => (
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
                                                    {row.user_id == playerData.user.id ? <Avatar src={playerData.user.avatar} className="rounded-full avatar-shine" sx={{ width: 24, height: 24 }} /> : row.full_name}
                                                </TableCell>
                                                <TableCell>Lvl {row.level}</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>{row.total_wins}</TableCell>
                                                <TableCell align="right" sx={{ color: 'success.main', fontWeight: 'bold' }}>{row.win_rate}%</TableCell>
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