import { useState, useEffect } from 'react';
import {
    ThemeProvider,
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
    Tabs,
    Tab,
    Tooltip,
} from '@mui/material';

import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

import { api } from '../core/client';
import LeaderboardTable, { type LeaderboardRow } from './LeaderboardTable';
import { useNotification } from '../ui/useNotification';
import { unoTheme } from '../ui/unoTheme';

// As formas dos dados, como o backend as devolve nos endpoints /static.
interface PlayerData {
    user: {
        id: string;
        email: string;
        nick_name: string;
        avatar: string;
    };
    total_games: number;
    wins: number;
    losses: number;
    total_score: number;
    level_info: {
        current_level: number;
        total_xp: number;
        xp_in_current_level: number;
        xp_required_for_next_level: number;
        progress_percentage: number;
        total_xp_for_next_level: number;
        title: string;
    };
}

interface MatchRecord {
    game_id: string;
    is_winner: boolean;
    score: number;
    finished_at: string;
    opponents: string[];
}

// As conquistas: calculadas aqui no ecrã a partir dos contadores que
// o maininfo já traz. Desbloqueadas acendem, as outras ficam a cinza.
type BadgeKind = 'wins' | 'games' | 'score' | 'level';

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

const emptyPlayerData: PlayerData = {
    user: { id: '', email: '', nick_name: '', avatar: '' },
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
        title: '',
    },
};

// O ecrã das estatísticas: o cartão do jogador com o nível e o XP,
// os contadores clicáveis que filtram o histórico, o gráfico de
// vitórias, e os dois leaderboards.
export default function UnoDashboard() {
    const { notificationNode, showNotification } = useNotification();

    // summary mostra o gráfico, all/wins/losses mostram o histórico filtrado
    const [activeView, setActiveView] = useState<'summary' | 'all' | 'wins' | 'losses'>('summary');
    const [playerData, setPlayerData] = useState<PlayerData>(emptyPlayerData);
    const [matchHistoryData, setMatchHistoryData] = useState<MatchRecord[]>([]);
    const [leaderboardGlobal, setLeaderboardGlobal] = useState<LeaderboardRow[]>([]);
    const [leaderboardFriends, setLeaderboardFriends] = useState<LeaderboardRow[]>([]);
    // a tab escolhida do leaderboard: o obrigatorio e o Global
    const [board, setBoard] = useState<'global' | 'friends'>('global');

    const winRate = (playerData.wins / (playerData.total_games || 1)) * 100;

    const filteredMatches = matchHistoryData.filter((match) => {
        if (activeView === 'wins') return match.is_winner;
        if (activeView === 'losses') return !match.is_winner;
        return true;
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const main = await api.get('/static/maininfo');
                setPlayerData(main.data);

                const history = await api.get('/static/staticdetails');
                setMatchHistoryData(history.data);

                const friends = await api.get('/static/leaderboard/friends');
                setLeaderboardFriends(friends.data);

                const global = await api.get('/static/leaderboard/global');
                setLeaderboardGlobal(global.data);
            } catch {
                showNotification('Failed to fetch player data. Please try again later.', 'error');
            }
        };
        fetchData();
    }, [showNotification]);

    return (
        <ThemeProvider theme={unoTheme}>
            {notificationNode}
            <Container maxWidth="xl" sx={{ py: 4 }}>

                <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="h4" component="h1" sx={{ color: '#fff' }}>
                        Leaderboard & Match History
                    </Typography>
                </Box>

                <Grid container spacing={1}>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <Stack spacing={3}>
                            {/* o cartão do jogador */}
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
                                            }}
                                            src={playerData.user.avatar || undefined}
                                        >
                                            U
                                        </Avatar>
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 8 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography variant="h6">{playerData.user.nick_name}</Typography>
                                            <Chip
                                                label={`Lvl ${playerData.level_info.current_level}`}
                                                color="secondary"
                                                size="small"
                                                sx={{ fontWeight: 'bold', color: '#000', height: 20 }}
                                            />
                                        </Box>
                                        <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
                                            Title: {playerData.level_info.title} | XP: {playerData.total_score.toLocaleString()}/{playerData.level_info.total_xp_for_next_level.toLocaleString()}
                                        </Typography>
                                        <Box sx={{ width: '100%', mt: 1.5 }}>
                                            <LinearProgress variant="determinate" value={playerData.level_info.progress_percentage} color="info" sx={{ height: 8, borderRadius: 4 }} />
                                        </Box>
                                    </Grid>
                                </Grid>

                                {/* as conquistas, desbloqueadas pelos contadores */}
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
                                                        ? {
                                                            backgroundColor: badge.color,
                                                            color: '#0f172a',
                                                            fontWeight: 'bold',
                                                            fontSize: '0.95rem',
                                                            py: 2.2,
                                                            px: 0.5,
                                                            '& .MuiChip-icon': { color: '#0f172a' },
                                                        }
                                                        : {
                                                            backgroundColor: 'transparent',
                                                            color: 'text.secondary',
                                                            border: '1px dashed',
                                                            borderColor: 'text.secondary',
                                                            opacity: 0.55,
                                                            fontSize: '0.95rem',
                                                            py: 2.2,
                                                            px: 0.5,
                                                            '& .MuiChip-icon': { color: 'text.secondary' },
                                                        }}
                                                />
                                            </Tooltip>
                                        );
                                    })}
                                </Box>
                            </Paper>

                            {/* os quatro contadores clicáveis */}
                            <Grid container spacing={1}>
                                <StatTile
                                    label="Total"
                                    value={String(playerData.total_games)}
                                    color="#2196f3"
                                    active={activeView === 'all'}
                                    tooltip="Click to view all match history"
                                    onClick={() => setActiveView('all')}
                                />
                                <StatTile
                                    label="Wins"
                                    value={String(playerData.wins)}
                                    color="#4caf50"
                                    active={activeView === 'wins'}
                                    tooltip="Click to filter winning matches"
                                    onClick={() => setActiveView('wins')}
                                />
                                <StatTile
                                    label="Losses"
                                    value={String(playerData.losses)}
                                    color="#f44336"
                                    active={activeView === 'losses'}
                                    tooltip="Click to filter losing matches"
                                    onClick={() => setActiveView('losses')}
                                />
                                <StatTile
                                    label="Win Rate"
                                    value={`${winRate.toFixed(0)}%`}
                                    color="#ffeb3b"
                                    active={activeView === 'summary'}
                                    tooltip="Click to view the summary chart"
                                    onClick={() => setActiveView('summary')}
                                />
                            </Grid>

                            {/* o gráfico ou o histórico, conforme a vista.
                                A altura é fixa para o painel não saltar de
                                tamanho ao trocar entre as quatro vistas */}
                            <Paper sx={{ p: 3, height: 420, overflow: 'auto' }}>
                                {activeView === 'summary' ? (
                                    <Box sx={{ textAlign: 'center' }}>
                                        <Typography variant="h6" sx={{ mb: 2 }}>Win / Loss Ratio</Typography>

                                        {/* um donut em SVG puro: o círculo verde desenha a
                                            percentagem de vitórias por cima do vermelho */}
                                        <Box sx={{ position: 'relative', display: 'inline-flex', justifyContent: 'center', alignItems: 'center', my: 2 }}>
                                            <svg width="260" height="260" viewBox="0 0 42 42">
                                                <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#f44336" strokeWidth="5" />
                                                <circle
                                                    cx="21"
                                                    cy="21"
                                                    r="15.91549430918954"
                                                    fill="transparent"
                                                    stroke="#4caf50"
                                                    strokeWidth="5"
                                                    strokeDasharray={`${winRate.toFixed(2)} ${(100 - winRate).toFixed(2)}`}
                                                    strokeDashoffset="25"
                                                />
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
                                        {/* voltar ao gráfico é clicar na caixinha Win Rate */}
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
                                                                {match.opponents?.length ? match.opponents.join(', ') : '-'}
                                                            </TableCell>
                                                            {/* a base guarda em UTC, o browser mostra na hora local */}
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
                        </Stack>
                    </Grid>

                    {/* um leaderboard só, com as tabs dentro do painel a
                        trocar os dados. Assim os topos das duas colunas
                        ficam alinhados */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <LeaderboardTable
                            title={
                                <Tabs
                                    value={board}
                                    onChange={(_event, value) => setBoard(value)}
                                    sx={{ minHeight: 40, '& .MuiTab-root': { minHeight: 40, fontWeight: 700, fontSize: '1rem', color: '#94a3b8' }}}
                                >
                                    <Tab label="Global" value="global" />
                                    <Tab label="Friends" value="friends" />
                                </Tabs>
                            }
                            tag={board === 'global' ? 'Top 42' : undefined}
                            rows={board === 'global' ? leaderboardGlobal : leaderboardFriends}
                            currentUserId={playerData.user.id}
                            currentUserAvatar={playerData.user.avatar}
                        />
                    </Grid>
                </Grid>
            </Container>
        </ThemeProvider>
    );
}

// Um contador clicável da fila de cima. O active acende o fundo da
// vista escolhida.
function StatTile({
    label,
    value,
    color,
    active,
    tooltip,
    onClick,
}: {
    label: string;
    value: string;
    color: string;
    active: boolean;
    tooltip: string;
    onClick: () => void;
}) {
    return (
        <Grid size={{ xs: 6, sm: 3 }}>
            <Tooltip title={tooltip} arrow>
                <Paper
                    onClick={onClick}
                    sx={{
                        p: 1.5,
                        textAlign: 'center',
                        borderTop: `4px solid ${color}`,
                        cursor: 'pointer',
                        transition: 'transform 0.2s, background-color 0.2s',
                        bgcolor: active ? `${color}26` : 'background.paper',
                        '&:hover': { transform: 'translateY(-3px)', bgcolor: `${color}1a` },
                    }}
                >
                    <Typography variant="body2" color="text.secondary" noWrap sx={{ fontWeight: 600 }}>{label}</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{value}</Typography>
                </Paper>
            </Tooltip>
        </Grid>
    );
}
