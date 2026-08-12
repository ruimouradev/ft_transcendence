import React, { useState } from 'react';
import {
    Search,
    UserPlus,
    Unplug,
    ShieldX,
    MessageSquare,
    MoreVertical,
    Check,
    X,
    UserCheck,
    Clock
} from 'lucide-react';

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Tooltip from "@mui/material/Tooltip";
import { useAuth } from '../components/AuthContext';
import { useNotification } from '../components/useNotification';
import { api } from '../client';

export default function FriendsPage() {
    const { showNotification, notificationNode } = useNotification();
    const [activeTab, setActiveTab] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();
    const { user } = useAuth();

    const [friends, setFriends] = useState([]);
    const [requests, setRequests] = useState([]);
    const [suggestions, setSuggestions] = useState([]);

    // Handlers for Friend Requests
    const handleAcceptRequest = (request) => {
        api.post(`/friends/${request.id}/accepted`)
            .then((response) => {
                setFriends([...friends, { ...request, status: 'online', bio: 'New connection!' }]);
                setRequests(requests.filter((r) => r.id !== request.id));
            })
            .catch((error) => {
                console.error('Error accepting friend request:', error);
            });

    };

    const handleBlockFriend = (friend) => {
        const new_status = friend.status === 'blocked' ? 'accepted' : 'blocked';

        api.post(`/friends/${friend.id}/blocked`)
            .then((response) => {
                setFriends(prevFriends =>
                    prevFriends.map(f =>
                        friend.id === f.id
                            ? { ...f, status: new_status }
                            : f
                    )
                );
                showNotification(`Friend ${new_status === 'blocked' ? 'blocked' : 'unblocked'} successfully!`, 'success');
            })
            .catch((error) => {
                console.error('Error blocking friend:', error);
            });
    };

    const handleDeclineRequest = (id) => {
        api.post(`/friends/${id}/rejected`)
            .then((response) => {
                // console.log('Friend request declined:', response.data);
                // Remove the request from pending
                setRequests(requests.filter((r) => r.id !== id));
            })
            .catch((error) => {
                console.error('Error declining friend request:', error);
            });
    };

    const handleSendRequest = (suggestion) => {
        // console.log(suggestion);
        try {
            api.post(`/friends/add/${suggestion.id}`)
                .then((response) => {
                    // console.log('Friend request sent:', response.data);
                    // Update the suggestion's status to "pending"
                    setSuggestions(suggestions.map((s) =>
                        s.id === suggestion.id ? { ...s, status: 'pending' } : s
                    ));
                })
                .catch((error) => {
                    console.error('Error sending friend request:', error);
                });
        } catch (error) {
            console.error("Error sending friend request:", error);
        }
    }

    // Filter Friends by Search
    const filteredFriends = friends.filter((f) =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.handle.toLowerCase().includes(searchQuery.toLowerCase())
    );

    useEffect(() => {
        if (!user) {
            navigate("/login", { replace: true });
            return;
        }

        const fetchFriendsData = async () => {
            try {
                const friends_response = await api.get('/friends/all');
                setFriends(friends_response.data.friends);

                const requests_response = await api.get('/friends/pending');
                setRequests(requests_response.data.requests);

                const suggestions_response = await api.get('/friends/suggested');
                setSuggestions(suggestions_response.data.suggestions);
            } catch (error) {
                showNotification('Failed to fetch friends data. Please try again later.', 'error');
            }
        };

        fetchFriendsData();

        setSearchQuery('');
    }, []);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8">
            {notificationNode}
            <div className="max-w-6xl mx-auto space-y-6">

                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-6 rounded-2xl border border-slate-800">
                    <div>
                        <h1 className="text-2xl font-bold">Friends</h1>
                        <p className="text-sm text-slate-400 mt-1">Manage your connections and view online status</p>
                    </div>

                    {/* Search Bar */}
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search friends..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                        />
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="flex gap-2 border-b border-slate-800 pb-2">
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 ${activeTab === 'all'
                                ? 'bg-blue-600 text-white'
                                : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                            }`}
                    >
                        <UserCheck size={16} /> All Friends ({friends.length})
                    </button>

                    <button
                        onClick={() => setActiveTab('pending')}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 relative ${activeTab === 'pending'
                                ? 'bg-blue-600 text-white'
                                : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                            }`}
                    >
                        <Clock size={16} /> Pending
                        {requests.length > 0 && (
                            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                                {requests.length}
                            </span>
                        )}
                    </button>

                    <button
                        onClick={() => setActiveTab('suggested')}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 ${activeTab === 'suggested'
                                ? 'bg-blue-600 text-white'
                                : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                            }`}
                    >
                        <UserPlus size={16} /> Suggestions
                    </button>
                </div>

                {/* ------------------------------------------------------------------ */}
                {/* TAB 1: ALL FRIENDS GRID */}
                {/* ------------------------------------------------------------------ */}
                {activeTab === 'all' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {filteredFriends.map((friend) => (
                            <div
                                key={friend.id}
                                className="bg-slate-900 p-5 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex items-start justify-between">
                                        <div className="relative">
                                            <img
                                                src={friend.avatar+'?v='+Date.now()}
                                                alt={friend.name}
                                                className={`${friend.status === 'blocked' ? 'w-14 h-14 rounded-full object-cover border-2 border-slate-800 grayscale' : 'w-14 h-14 rounded-full object-cover border-2 border-slate-800'}`}
                                            />
                                            {/* Status Indicator Dot */}
                                            <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${friend.online ? 'bg-green-500' :
                                                    friend.status === 'idle' ? 'bg-yellow-500' : 'bg-slate-500'
                                                }`} />
                                        </div>
                                        <div className="mt-3">
                                            <h3 className="font-bold text-base">{friend.name}</h3>
                                            <p className="text-xs text-slate-400">{friend.handle}</p>
                                            <p className="text-xs text-slate-300 mt-2 line-clamp-2">{friend.bio}</p>
                                        </div>
                                        <Tooltip title={friend.status === "accepted" ? "Message" : ""}>
                                            <button className={` ${friend.status === 'blocked' ? 'bg-gray-500' : 'bg-blue-800 hover:bg-blue-500'} p-1 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors`}>
                                                <MessageSquare size={18} />
                                            </button>
                                        </Tooltip>
                                        <Tooltip title={friend.status === 'blocked' ? 'Unblock Friend' : 'Block Friend'}>
                                            <button onClick={() => handleBlockFriend(friend)} className={`p-1 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${friend.status === 'blocked' ? 'bg-red-500' : 'bg-blue-800 hover:bg-red-500'}`}>
                                                <ShieldX size={18} />
                                            </button>
                                        </Tooltip>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ------------------------------------------------------------------ */}
                {/* TAB 2: PENDING REQUESTS */}
                {/* ------------------------------------------------------------------ */}
                {activeTab === 'pending' && (
                    <div className="space-y-3 max-w-4xl">
                        {requests.length === 0 ? (
                            <p className="text-slate-400 text-sm py-8 text-center bg-slate-900 rounded-2xl border border-slate-800">
                                No pending requests right now.
                            </p>
                        ) : (
                            requests.map((req) => (
                                <div
                                    key={req.id}
                                    className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-3">
                                        <img src={req.avatar+'?v='+Date.now()} alt={req.name} className="w-12 h-12 rounded-full object-cover" />
                                        <div>
                                            <h4 className="font-bold text-sm">{req.name}</h4>
                                            <p className="text-xs text-slate-400">{req.mutual} mutual friends</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleAcceptRequest(req)}
                                            className="p-2 bg-green-500/10 text-green-400 hover:bg-green-500/20 rounded-xl transition-colors"
                                            title="Accept"
                                        >
                                            <Check size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDeclineRequest(req.id)}
                                            className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl transition-colors"
                                            title="Decline"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* ------------------------------------------------------------------ */}
                {/* TAB 3: SUGGESTIONS */}
                {/* ------------------------------------------------------------------ */}
                {activeTab === 'suggested' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {suggestions.map((item) => (
                            <div key={item.id} className="bg-slate-900 p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <img src={item.avatar+'?v='+Date.now()} alt={item.name} className="w-12 h-12 rounded-full object-cover" />
                                    <div>
                                        <h4 className="font-bold text-sm">{item.name}</h4>
                                        <p className="text-xs text-slate-400">{item.mutual} mutual friends</p>
                                    </div>
                                </div>

                                <button onClick={() => handleSendRequest(item)} disabled={item.status === "pending"} className="p-2.5 bg-blue-600/10 text-blue-400 hover:bg-blue-600/20 rounded-xl transition-colors">
                                    {item.status === "pending" ? <Unplug size={18} /> : <UserPlus size={18} />}
                                </button>
                            </div>
                        ))}
                    </div>
                )}

            </div>
        </div>
    );
}