import { Avatar, Badge, Box, Chip, Grid, IconButton, Paper, Tooltip, Typography, } from '@mui/material';
import BlockIcon from '@mui/icons-material/Block';
import type { FriendEntry } from '../core/types.ts';

function FriendsTab({filteredFriends, freshAvatar, handleBlockFriend}:
	{filteredFriends: FriendEntry[], freshAvatar: (url: string | null) => string, handleBlockFriend: (friend: FriendEntry) => void})
{
	return (
		<Grid container spacing={2}>
			{filteredFriends.map((friend) => (
				<Grid key={friend.id} size={{ xs: 12, sm: 6, md: 4 }}>
					<Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
						<Badge overlap="circular" anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} variant="dot"
							sx={{ '& .MuiBadge-badge': { backgroundColor: friend.online ? '#4caf50' : '#64748b', width: 14, height: 14, borderRadius: '50%', border: '2px solid #1e293b', }, }}>
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
	)
}

export default FriendsTab