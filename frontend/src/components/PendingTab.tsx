import { Avatar, Box, Chip, IconButton, Paper, Stack, Tooltip, Typography, } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import type { FriendEntry } from '../core/types.ts'

function PendingTab({requests, freshAvatar, handleAcceptRequest, handleDeclineRequest}:
	{requests: FriendEntry[], freshAvatar: (url: string | null) => string,
	handleAcceptRequest: (request: FriendEntry) => void, handleDeclineRequest: (id: string) => void})
{
	return (
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
	)
}

export default PendingTab