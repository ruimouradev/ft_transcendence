import { useState, useEffect } from 'react';
import { Box, Container, Grid, Stack, Tab, Tabs, Typography } from '@mui/material';
import { api } from '../core/client.ts';
import { useNotification } from '../ui/useNotification.tsx';
import type { ActiveView, LeaderboardRow, MatchRecord, PlayerData } from '../core/types.ts'

import StatsPlayerCard from '../components/StatsPlayerCard.tsx';
import LeaderboardTable from '../components/LeaderboardTable.tsx';
import StatsHistoryMenu from '../components/StatsHistoryMenu.tsx';
import StatsHistoryInfo from '../components/StatsHistoryInfo.tsx';

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

function UnoDashboard() {
    const { notificationNode, showNotification } = useNotification();

	const [activeView, setActiveView] = useState<ActiveView>('summary');
    const [playerData, setPlayerData] = useState<PlayerData>(emptyPlayerData);
    const [matchHistoryData, setMatchHistoryData] = useState<MatchRecord[]>([]);
    const [leaderboardGlobal, setLeaderboardGlobal] = useState<LeaderboardRow[]>([]);
    const [leaderboardFriends, setLeaderboardFriends] = useState<LeaderboardRow[]>([]);
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
        <>
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
							{/* Player information */}
							<StatsPlayerCard playerData={playerData}/>

                            {/* Statistics tab menu */}
                            <StatsHistoryMenu playerData={playerData} winRate={winRate} activeView={activeView} setActiveView={setActiveView} />

							{/* Statistics info */}
							<StatsHistoryInfo playerData={playerData} winRate={winRate} activeView={activeView} filteredMatches={filteredMatches} />
                        </Stack>
                    </Grid>

                    {/* Leaderboard */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <LeaderboardTable
                            title={
                                <Tabs value={board} onChange={(_event, value) => setBoard(value)}
									sx={{ minHeight: 40, '& .MuiTab-root': { minHeight: 40, fontWeight: 700, fontSize: '1rem', color: '#94a3b8' }}}>
                                    <Tab label="Global" value="global" />
                                    <Tab label="Friends" value="friends" />
                                </Tabs>
                            }
                            tag={board === 'global' ? 'Top 10' : undefined}
                            rows={board === 'global' ? leaderboardGlobal : leaderboardFriends}
                            currentUserId={playerData.user.id}
                            currentUserAvatar={playerData.user.avatar}
                        />
                    </Grid>
                </Grid>
            </Container>
        </>
    );
}

export default UnoDashboard