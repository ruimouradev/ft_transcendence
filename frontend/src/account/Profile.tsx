import React, { useState, useRef } from 'react';
import { Container, Card, CardContent, Box, Avatar, Typography, Stack, Chip, Tooltip, TextField, Button, } from '@mui/material';
import { Email as EmailIcon, CheckCircle as ActiveIcon, Cancel as InactiveIcon, } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../core/AuthContext';
import { api } from '../core/client';
import axios from 'axios';
import NotificationSnackbar from '../ui/NotificationSnackbar';
import CardBackSelector from './CardBackSelector';
import { cardBacks, defaultCardBack } from '../ui/ImagesUtils';
import Enable2FADialog from './Enable2FADialog';
import Disable2FADialog from './Disable2FADialog';
import type { NotificationState } from '../core/types.ts';

const cardBackUrls = Object.values(cardBacks);

function ProfileCard()
{
    const [notification, setNotification] = useState<NotificationState>({
        open: false,
        message: '',
        severity: 'success',
    });
    const navigate = useNavigate();
    const { user, login } = useAuth();

    const [nickName, setNickName] = useState('');
    const [uploading, setUploading] = useState(false);
    const [isEditingName, setIsEditingName] = useState(false);
    const [enable2FADialogOpen, setEnable2FADialogOpen] = useState(false);
    const [disable2FADialogOpen, setDisable2FADialogOpen] = useState(false);
	
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    // Upload do avatar: mostra logo a pré-visualização local, envia o
    // ficheiro, e se o servidor recusar volta ao avatar antigo.
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        const oldAvatarUrl = user.avatar || '';
        const tempPreviewUrl = URL.createObjectURL(file);

        login({ ...user, avatar: tempPreviewUrl });
        const formData = new FormData();
        formData.append('file', file);

        setUploading(true);

        try {
            const response = await api.post('/users/uploadfile', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            // o ?v= força o browser a ir buscar a imagem nova, o nome
            // do ficheiro no servidor é sempre o mesmo
            const uploadedUrl = response.data?.url || tempPreviewUrl;
            login({ ...user, avatar: uploadedUrl + `?v=${Date.now()}` });
            setNotification({ open: true, message: 'Avatar updated successfully.', severity: 'success', });
        } catch (error) {
			if (axios.isAxiosError(error)) {
				if (axiosStatus(error) === 403) {
					navigate('/login');
				} else {
					login({ ...user, avatar: oldAvatarUrl });
					setNotification({ open: true, message: error.response?.data?.detail || 'Failed to upload avatar. Please try again.', severity: 'error', });
				}
			}
        } finally {
            setUploading(false);
        }
    };

    const handleNameSave = async () => {
        if (!user) return;

        const newNickName = nickName.trim();
        try {
            await api.patch('/users/me', { nick_name: newNickName });
        } catch {
            setNotification({ open: true, message: 'Failed to update the nick name. Please try again.', severity: 'error', });
            return;
        }
        login({ ...user, nick_name: newNickName || user.nick_name });
        setIsEditingName(false);
        setNotification({ open: true, message: 'Nick name updated successfully.', severity: 'success', });
    };

    const handleNameCancel = () => {
        setNickName(user?.nick_name ?? '');
        setIsEditingName(false);
    };

    const handleCardBackChange = async (newCardBackUrl: string) => {
        if (!user) return;
        // o seletor devolve o caminho da imagem; traduz-se para o nome
        // de código antes de gravar, que é o que a base deve conhecer
        const key = Object.keys(cardBacks).find((k) => cardBacks[k] === newCardBackUrl,) ?? 'back00';
        try {
            await api.patch('/users/me', { card_back: key });
            login({ ...user, card_back: key });
            setNotification({ open: true, message: 'Card back updated successfully.', severity: 'success', });
        } catch {
            setNotification({ open: true, message: 'Failed to update the card back. Please try again.', severity: 'error', });
        }
    };

    const handleSnackbarClose = (_event?: React.SyntheticEvent | Event, reason?: string,) => {
        if (reason === 'clickaway') return;
        setNotification((prev) => ({ ...prev, open: false }));
    };

    const handle2FAClick = () => {
        if (user?.use2fa) {
            setDisable2FADialogOpen(true);
        }else{
            setEnable2FADialogOpen(true);
        }
    };

    const handle2FADisabled = () => {
        if (!user) return;
        login({ ...user, use2fa: false });
        setNotification({ open: true, message: '2FA disabled successfully.', severity: 'success', });
    }

    const handle2FAEnabled = () => {
        if (!user) return;
        login({ ...user, use2fa: true });
        setNotification({ open: true, message: '2FA enabled successfully.', severity: 'success', });
    }

    if (!user) return null;

    return (
        <Container maxWidth="sm" sx={{ mt: 6, mb: 6 }}>
            <NotificationSnackbar open={notification.open} message={notification.message} severity={notification.severity} onClose={handleSnackbarClose} />

            <Card elevation={3} sx={{ borderRadius: 3, overflow: 'hidden' }}>

                <Tooltip title="Click to change card back" arrow>
                    <Box sx={{ position: 'relative', top: 0, display: 'flex', justifyContent: 'left' }}>
                        <CardBackSelector cardBacks={cardBackUrls} value={cardBacks[user.card_back ?? ''] ?? defaultCardBack} onChange={handleCardBackChange} cardWidth={600} cardHeight={120} optionWidth={65} columns={5} />
                    </Box>
                </Tooltip>

                <CardContent sx={{ pt: 0, position: 'relative' }}>

                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: -7, mb: 2 }}>
                        <Tooltip title={uploading ? "Uploading..." : "Click to change avatar"} arrow>
                            <Avatar src={user.avatar} alt={user.nick_name} onClick={handleAvatarClick} sx={{ width: 100, height: 100,
								border: '4px solid white', boxShadow: 2, fontSize: 36, bgcolor: 'secondary.main', cursor: 'pointer',
								opacity: uploading ? 0.6 : 1, transition: 'all 0.2s ease-in-out', '&:hover': { transform: 'scale(1.04)', boxShadow: 4, }, }}>
                                {user.nick_name ? user.nick_name.charAt(0).toUpperCase() : 'U'}
                            </Avatar>
                        </Tooltip>
                        <input type="file" ref={fileInputRef} accept="image/*" disabled={uploading} onChange={handleFileUpload} style={{ display: 'none' }} />
                    </Box>

                    <Stack spacing={1} sx={{ alignItems: 'center', textAlign: 'center' }}>
                        {isEditingName ? (
                            <Stack spacing={1} sx={{ width: '100%', alignItems: 'center' }}>
                                <TextField label="Nick name" size="small" value={nickName}
									onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNickName(e.target.value)} sx={{ minWidth: 140 }} />
                                <Stack direction="row" spacing={1}>
                                    <Button variant="contained" size="small" onClick={handleNameSave}>
                                        Save
                                    </Button>
                                    <Button variant="outlined" size="small" onClick={handleNameCancel}>
                                        Cancel
                                    </Button>
                                </Stack>
                            </Stack>
                        ) : (
                            <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold', cursor: 'pointer', userSelect: 'none' }}
                                // o campo de edição nasce com o nome atual
                                onDoubleClick={() => { setNickName(user.nick_name ?? ''); setIsEditingName(true); }}>
                                {user.nick_name}
                            </Typography>
                        )}

                        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }} color="text.secondary">
                            <EmailIcon fontSize="small" />
                            <Typography variant="body1">{user.email}</Typography>
                        </Stack>
                        <Stack direction="row" spacing={1} sx={{ mt: 2 }}>                            
                            <Chip icon={<ActiveIcon />} label="Active" color="success" variant="outlined" size="small" />
                            
                            <Tooltip title="Click to manage 2FA settings" arrow>
                                {user.use2fa ? (
                                        <Chip icon={<ActiveIcon />} label="2FA Enabled" color="success" onClick={handle2FAClick} variant="filled" size="small" />
                                    ) : (
                                        <Chip icon={<InactiveIcon />} label="2FA Disabled" color="warning" onClick={handle2FAClick} variant="outlined" size="small" />
                                    )}
                            </Tooltip>
                            <Enable2FADialog open={enable2FADialogOpen} onClose={() => setEnable2FADialogOpen(false)} onSuccess={handle2FAEnabled} />
                            <Disable2FADialog open={disable2FADialogOpen} onClose={() => setDisable2FADialogOpen(false)} onSuccess={handle2FADisabled} />
                        </Stack>
                    </Stack>
                </CardContent>
            </Card>
        </Container>
    );
}

// Lê o status HTTP de um erro sem importar o axios só para isto.
function axiosStatus(error: unknown): number | undefined {
    if (typeof error === 'object' && error !== null && 'response' in error) {
        const response = (error as { response?: { status?: number } }).response;
        return response?.status;
    }
    return undefined;
}

export default ProfileCard