import { useEffect, useState } from 'react';
import { ThemeProvider, Avatar, Badge, Box, Chip, Container, Grid, IconButton, InputAdornment, Paper, Stack, Tab, Tabs, TextField, Tooltip, Typography, } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import BlockIcon from '@mui/icons-material/Block';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';

import { useAuth } from '../core/AuthContext';
import { useNotification } from '../ui/useNotification';
import { unoTheme } from '../ui/unoTheme';
import { api } from '../core/client';
import defaultAvatar from '../assets/avatar/a_default.svg';

// Um amigo, um pedido ou uma sugestão, como o backend os devolve.
// O status vem do modelo de amizades: accepted, pending, blocked.
interface FriendEntry {
    id: string;
    nick_name: string;
    handle: string;
    avatar: string | null;
    status: string | null;
    online?: boolean;
    level: number;
    title: string;
}

// um número por visita à página, para o browser ir buscar avatares
// frescos sem os pedir outra vez a cada redesenho. Quem não tem
// avatar leva o predefinido, sem inventar um pedido a "null"
const avatarVersion = Date.now();

// A página dos amigos, com três separadores: os que já são, os
// pedidos à espera de resposta, e sugestões de gente nova. Tudo o
// que aqui se vê e faz passa pelos endpoints /friends do backend.
// A roupa é a mesma das estatísticas, o tema partilhado unoTheme.
export default function FriendsPage() {
    const { showNotification, notificationNode } = useNotification();
    const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'suggested'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const { user } = useAuth();

    const [friends, setFriends] = useState<FriendEntry[]>([]);
    const [requests, setRequests] = useState<FriendEntry[]>([]);
    const [suggestions, setSuggestions] = useState<FriendEntry[]>([]);

    const freshAvatar = (url: string | null) =>
        url ? `${url}?v=${avatarVersion}` : defaultAvatar;

    const handleAcceptRequest = (request: FriendEntry) => {
        api.post(`/friends/${request.id}/accepted`)
            .then(() => {
                setFriends([...friends, { ...request, status: 'accepted' }]);
                setRequests(requests.filter((r) => r.id !== request.id));
            })
            .catch(() => {
                showNotification('Failed to accept the request. Please try again.', 'error');
            });
    };

    // bloquear e desbloquear usam o mesmo endpoint, o que muda é o
    // status pedido: blocked para bloquear, accepted para desfazer
    const handleBlockFriend = (friend: FriendEntry) => {
        const newStatus = friend.status === 'blocked' ? 'accepted' : 'blocked';

        api.post(`/friends/${friend.id}/${newStatus}`)
            .then(() => {
                setFriends((prev) =>
                    prev.map((f) => (f.id === friend.id ? { ...f, status: newStatus } : f))
                );
                showNotification(
                    `Friend ${newStatus === 'blocked' ? 'blocked' : 'unblocked'} successfully!`,
                    'success',
                );
            })
            .catch(() => {
                showNotification('Failed to update the friend. Please try again.', 'error');
            });
    };

    const handleDeclineRequest = (id: string) => {
        api.post(`/friends/${id}/rejected`)
            .then(() => {
                setRequests(requests.filter((r) => r.id !== id));
            })
            .catch(() => {
                showNotification('Failed to decline the request. Please try again.', 'error');
            });
    };

    const handleSendRequest = (suggestion: FriendEntry) => {
        api.post(`/friends/add/${suggestion.id}`)
            .then(() => {
                setSuggestions(suggestions.map((s) =>
                    s.id === suggestion.id ? { ...s, status: 'pending' } : s
                ));
            })
            .catch(() => {
                showNotification('Failed to send the request. Please try again.', 'error');
            });
    };

    const matchesSearch = (entry: FriendEntry) =>
        entry.nick_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.handle.toLowerCase().includes(searchQuery.toLowerCase());

    const filteredFriends = friends.filter(matchesSearch);
    const filteredSuggestions = suggestions.filter(matchesSearch);

    useEffect(() => {
        const fetchFriendsData = async () => {
            try {
                const friendsResponse = await api.get('/friends/all');
                setFriends(friendsResponse.data.friends);

                const requestsResponse = await api.get('/friends/pending');
                setRequests(requestsResponse.data.requests);

                const suggestionsResponse = await api.get('/friends/suggested');
                setSuggestions(suggestionsResponse.data.suggestions);
            } catch {
                showNotification('Failed to fetch friends data. Please try again later.', 'error');
            }
        };

        fetchFriendsData();
    }, [user, showNotification]);

    return (
        <ThemeProvider theme={unoTheme}>
            {notificationNode}
            <Container maxWidth="lg" sx={{ py: 4 }}>

                <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                    <Box>
                        <Typography variant="h4" component="h1" sx={{ color: '#fff' }}>
                            Friends
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
                            Manage your connections and view online status
                        </Typography>
                    </Box>
                    <TextField placeholder="Search friends..." size="small" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} sx={{ width: { xs: '100%', sm: 300 } }}
                        slotProps={{
                            input: {
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon />
                                    </InputAdornment>
                                ),
                            },
                        }}
                    />
                </Box>

                <Tabs value={activeTab} onChange={(_event, value) => setActiveTab(value)} sx={{ mb: 3, '& .MuiTab-root': { fontWeight: 700 } }}>
                    <Tab label={`Friends (${friends.length})`} value="all" />
                    <Tab value="pending" label={
                        <Badge badgeContent={requests.length} color="error" sx={{ '& .MuiBadge-badge': { right: -12 } }}>
                            Pending
                        </Badge>
                    } />
                    <Tab label="Suggestions" value="suggested" />
                </Tabs>

                {/* separador 1: os amigos */}
                {activeTab === 'all' && (
                    <Grid container spacing={2}>
                        {filteredFriends.map((friend) => (
                            <Grid key={friend.id} size={{ xs: 12, sm: 6, md: 4 }}>
                                <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                                    {/* o ponto de presença, aceso pelo websocket do servidor */}
                                    <Badge overlap="circular" anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} variant="dot" sx={{ '& .MuiBadge-badge': { backgroundColor: friend.online ? '#4caf50' : '#64748b', width: 14, height: 14, borderRadius: '50%', border: '2px solid #1e293b', }, }}>
                                        <Avatar src={freshAvatar(friend.avatar)} alt={friend.nick_name} sx={{ width: 56, height: 56, filter: friend.status === 'blocked' ? 'grayscale(1)' : 'none' }} />
                                    </Badge>
                                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                        <Tooltip title={friend.nick_name}>
                                            <Typography variant="h6" noWrap>{friend.nick_name}</Typography>
                                        </Tooltip>
                                        <Chip label={`${friend.title} - Lvl ${friend.level}`} size="small" variant="outlined" sx={{ mt: 0.5 }} />
                                    </Box>
                                    <Tooltip title={friend.status === 'blocked' ? 'Unblock friend' : 'Block friend'}>
                                        <IconButton onClick={() => handleBlockFriend(friend)} color={friend.status === 'blocked' ? 'primary' : 'default'}>
                                            <BlockIcon />
                                        </IconButton>
                                    </Tooltip>
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>
                )}

                {/* separador 2: pedidos à espera */}
                {activeTab === 'pending' && (
                    <Stack spacing={2} sx={{ maxWidth: 640 }}>
                        {requests.length === 0 ? (
                            <Paper sx={{ p: 4, textAlign: 'center' }}>
                                <Typography color="text.secondary">
                                    No pending requests right now.
                                </Typography>
                            </Paper>
                        ) : (
                            requests.map((req) => (
                                <Paper key={req.id} sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Avatar src={freshAvatar(req.avatar)} alt={req.nick_name} sx={{ width: 48, height: 48 }} />
                                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                        <Typography variant="h6" noWrap>{req.nick_name}</Typography>
                                        <Chip label={`${req.title} - Lvl ${req.level}`} size="small" variant="outlined" sx={{ mt: 0.5 }} />
                                    </Box>
                                    <Tooltip title="Accept">
                                        <IconButton color="success" onClick={() => handleAcceptRequest(req)}>
                                            <CheckIcon />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Decline">
                                        <IconButton color="primary" onClick={() => handleDeclineRequest(req.id)}>
                                            <CloseIcon />
                                        </IconButton>
                                    </Tooltip>
                                </Paper>
                            ))
                        )}
                    </Stack>
                )}

                {/* separador 3: sugestões */}
                {activeTab === 'suggested' && (
                    <Grid container spacing={2}>
                        {filteredSuggestions.map((item) => (
                            <Grid key={item.id} size={{ xs: 12, sm: 6, md: 4 }}>
                                <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Avatar src={freshAvatar(item.avatar)} alt={item.nick_name} sx={{ width: 48, height: 48 }} />
                                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                        <Tooltip title={item.nick_name}>
                                            <Typography variant="h6" noWrap>{item.nick_name}</Typography>
                                        </Tooltip>
                                        <Chip label={`${item.title} - Lvl ${item.level}`} size="small" variant="outlined" sx={{ mt: 0.5 }} />
                                    </Box>
                                    <Tooltip title={item.status === 'pending' ? 'Request sent' : 'Send friend request'}>
                                        <span>
                                            <IconButton color="info" disabled={item.status === 'pending'} onClick={() => handleSendRequest(item)}>
                                                {item.status === 'pending' ? <HourglassEmptyIcon /> : <PersonAddIcon />}
                                            </IconButton>
                                        </span>
                                    </Tooltip>
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>
                )}

            </Container>
        </ThemeProvider>
    );
}
