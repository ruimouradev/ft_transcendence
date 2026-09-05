import { Avatar, Box, Chip, Grid, IconButton, Paper, Tooltip, Typography, } from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import type { FriendEntry } from '../core/types.ts';

function SuggestedTab({filteredSuggestions, freshAvatar, handleSendRequest}:
	{filteredSuggestions: FriendEntry[], freshAvatar: (url: string | null) => string,
	handleSendRequest: (suggestion: FriendEntry) => void})
{
	return (
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
	)
}

export default SuggestedTab