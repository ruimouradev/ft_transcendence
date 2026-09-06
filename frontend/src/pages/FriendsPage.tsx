import { useEffect, useState } from 'react';
import { Badge, Box, Container, InputAdornment, Tab, Tabs, TextField, Typography } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useAuth } from '../core/AuthContext';
import { useNotification } from '../ui/useNotification';
import { api } from '../core/client';
import defaultAvatar from '../assets/avatar/a_default.svg';
import FriendsTab from '../components/FriendsTab'
import PendingTab from '../components/PendingTab'
import SuggestedTab from '../components/SuggestedTab'
import type { FriendEntry } from '../core/types.ts'

const avatarVersion = Date.now();

function FriendsPage() {
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
			const amount = 10;
			let skip = 0;
			let parcialFriends;
			let friendList: FriendEntry[] = [];
            try {
				do
				{
					const friendsResponse = await api.get('/friends/all', { params: { limit: amount, skip: skip } });
					
					skip += amount;
					parcialFriends = friendsResponse.data.friends;
					friendList = [...friendList, ...parcialFriends];

				} while (amount === parcialFriends.length);
				setFriends(friendList);

				skip = 0;
				let parcialRequests;
				let requestList: FriendEntry[] = [];

				do
				{
					const requestsResponse = await api.get('/friends/pending', { params: { limit: amount, skip: skip } });
					
					skip += amount;
					parcialRequests = requestsResponse.data.requests;
					requestList = [...requestList, ...parcialRequests];

				} while (amount === parcialRequests.length);
				setRequests(requestList);

                const suggestionsResponse = await api.get('/friends/suggested');
                setSuggestions(suggestionsResponse.data.suggestions);
            } catch {
                showNotification('Failed to fetch friends data. Please try again later.', 'error');
            }
        };

        fetchFriendsData();
    }, [user, showNotification]);

    return (
        <>
            {notificationNode}
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                    <Box>
                        <Typography variant="h4" component="h1" sx={{ color: 'white' }}>
                            Friends
                        </Typography>
                        <Typography variant="body1" sx={{ mt: 0.5, color: 'white' }}>
                            Manage your connections and view online status
                        </Typography>
                    </Box>
                    <TextField placeholder="Search friends..." size="small" value={searchQuery} 
						onChange={(e) => setSearchQuery(e.target.value)} sx={{ width: { xs: '100%', sm: 300 } }}
                        slotProps={{
                            input: {startAdornment: (
								<InputAdornment position="start">
									<SearchIcon />
								</InputAdornment>),},}}
                    />
                </Box>

                <Tabs value={activeTab} onChange={(_event, value) => setActiveTab(value)} sx={{ mb: 3, '& .MuiTab-root': { fontWeight: 700 },  }}>
                    <Tab label={`Friends (${friends.length})`} value="all" />
                    <Tab value="pending" label={
                        <Badge badgeContent={requests.length} color="error" sx={{ '& .MuiBadge-badge': { right: '-10%' } }}>
                            Pending
                        </Badge>
                    } />
                    <Tab label="Suggestions" value="suggested" />
                </Tabs>

                {activeTab === 'all' && <FriendsTab filteredFriends={filteredFriends} 
					freshAvatar={freshAvatar} handleBlockFriend={handleBlockFriend} />}
				{activeTab === 'pending' && <PendingTab requests={requests} freshAvatar={freshAvatar}
					handleAcceptRequest={handleAcceptRequest} handleDeclineRequest={handleDeclineRequest} />}
                {activeTab === 'suggested' && <SuggestedTab filteredSuggestions={filteredSuggestions}
					freshAvatar={freshAvatar} handleSendRequest={handleSendRequest} />}
            </Container>
        </>
    );
}

export default FriendsPage
