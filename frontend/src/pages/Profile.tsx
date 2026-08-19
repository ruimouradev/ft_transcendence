import React, { useState, useRef, useEffect } from 'react';
import {
    Container,
    Card,
    CardContent,
    Box,
    Avatar,
    Typography,
    CircularProgress,
    Stack,
    Chip,
    Tooltip,
    TextField,
    Button,
} from '@mui/material';
import {
    Email as EmailIcon,
    SupervisorAccount as AdminIcon,
    Person as UserIcon,
    CheckCircle as ActiveIcon,
    Cancel as InactiveIcon,
} from '@mui/icons-material';

import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { api } from '../client';
import NotificationSnackbar from '../components/NotificationSnackbar';

type NotificationState = {
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
};

export default function ProfileCard() {
    const [notification, setNotification] = useState<NotificationState>({
        open: false,
        message: '',
        severity: 'success',
    });
    const navigate = useNavigate();
    const { user, login } = useAuth();

    const [uploading, setUploading] = useState(false);
    const [isEditingName, setIsEditingName] = useState(false);
    const [nickName, setNickName] = useState('');
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        if (!user?.nick_name) {
            setNickName('');
            return;
        }

        setNickName(user.nick_name);
    }, [user?.nick_name]);

    const handleAvatarClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const oldAvatarUrl = user?.avatar || '';
        const tempPreviewUrl = URL.createObjectURL(file);
        
        login({ ...user, avatar: tempPreviewUrl });
        const formData = new FormData();
        formData.append('file', file);

        setUploading(true);

        try {
            const response = await api.post('/users/uploadfile', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                withCredentials: true,
            });

            const uploadedUrl = response.data?.url || tempPreviewUrl;
            login({ ...user, avatar: uploadedUrl+`?v=${Date.now()}` });
            setNotification({
                open: true,
                message: 'Avatar updated successfully.',
                severity: 'success',
            });
        } catch (error: any) {
            if (error?.response?.status === 403) {
                navigate('/login');
            } else {
                login({ ...user, avatar: oldAvatarUrl });
                setNotification({
                    open: true,
                    message: 'Failed to upload avatar. Please try again.',
                    severity: 'error',
                });
            }
        } finally {
            setUploading(false);
        }
    };

    const handleNameDoubleClick = () => {
        setIsEditingName(true);
    };

    const handleNameSave = async () => {
        if (!user) return;

        const newNickName = nickName.trim();
        try {
            await api.patch('/users/me', { nick_name: newNickName }, { withCredentials: true });
        } catch (error) {
            setNotification({
                open: true,
                message: 'Failed to update nickName. Please try again.',
                severity: 'error',
            });
            return;
        }
        login({ ...user, nick_name: newNickName || user.nick_name });
        setIsEditingName(false);
        setNotification({
            open: true,
            message: 'NickName updated successfully.',
            severity: 'success',
        });
    };

    const handleNameCancel = () => {
        if (!user?.nick_name) {
            setNickName('');
            setIsEditingName(false);
            return;
        }

        setNickName(user.nick_name);
        setIsEditingName(false);
    };

    if (uploading) {
        return (
            <Box display="flex" sx={{ justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!user) return null;

    const handleSnackbarClose = (
        _event?: React.SyntheticEvent | Event,
        reason?: string,
    ) => {
        if (reason === 'clickaway') {
            return;
        }

        setNotification((prev: NotificationState) => ({ ...prev, open: false }));
    };

    return (
        <Container maxWidth="sm" sx={{ mt: 6, mb: 6 }}>
            <NotificationSnackbar
                open={notification.open}
                message={notification.message}
                severity={notification.severity}
                onClose={handleSnackbarClose}
            />

            <Card elevation={3} sx={{ borderRadius: 3, overflow: 'hidden' }}>

                <Box sx={{ height: 120, bgcolor: 'primary.main' }} />

                <CardContent sx={{ pt: 0, position: 'relative' }}>

                    <Box display="flex" sx={{ justifyContent: 'center', mt: -7, mb: 2 }}>
                    <Tooltip title={uploading ? "Uploading..." : "Click to change avatar"} arrow>
                        <Avatar
                            src={user.avatar}
                            alt={user.nick_name}
                            onClick={handleAvatarClick}
                            sx={{
                                width: 100,
                                height: 100,
                                border: '4px solid white',
                                boxShadow: 2,
                                fontSize: 36,
                                bgcolor: 'secondary.main',
                                cursor: 'pointer',
                                opacity: uploading ? 0.6 : 1,
                                transition: 'all 0.2s ease-in-out',
                                '&:hover': {
                                    transform: 'scale(1.04)',
                                    boxShadow: 4,
                                },
                            }}
                        >
                            {user.nick_name ? user.nick_name.charAt(0).toUpperCase() : 'U'}
                        </Avatar>
                    </Tooltip>
                        <input
                            type="file"
                            ref={fileInputRef}
                            accept="image/*"
                            disabled={uploading}
                            onChange={handleFileUpload}
                            style={{ display: 'none' }}
                        />
                    </Box>

                    <Stack spacing={1} sx={{ alignItems: 'center', textAlign: 'center' }}>
                        {isEditingName ? (
                            <Stack spacing={1} sx={{ width: '100%', alignItems: 'center' }}>
                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ width: '100%', justifyContent: 'center' }}>
                                    <TextField
                                        label="Nick name"
                                        size="small"
                                        value={nickName}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNickName(e.target.value)}
                                        sx={{ minWidth: 140 }}
                                    />
                                </Stack>
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
                            <Typography
                                variant="h5"
                                component="h1"
                                fontWeight="bold"
                                onDoubleClick={handleNameDoubleClick}
                                sx={{ cursor: 'pointer', userSelect: 'none' }}
                            >
                                {user.nick_name}
                            </Typography>
                        )}

                        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }} color="text.secondary">
                            <EmailIcon fontSize="small" />
                            <Typography variant="body1">{user.email}</Typography>
                        </Stack>
                        <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                            {user.is_superuser ? (
                                <Chip
                                    icon={<AdminIcon />}
                                    label="Superuser"
                                    color="secondary"
                                    variant="filled"
                                    size="small"
                                />
                            ) : (
                                <Chip
                                    icon={<UserIcon />}
                                    label="Standard User"
                                    variant="outlined"
                                    size="small"
                                />
                            )}

                            {user.is_active ? (
                                <Chip
                                    icon={<ActiveIcon />}
                                    label="Active"
                                    color="success"
                                    variant="soft"
                                    size="small"
                                />
                            ) : (
                                <Chip
                                    icon={<InactiveIcon />}
                                    label="Inactive"
                                    color="error"
                                    variant="soft"
                                    size="small"
                                />
                            )}
                        </Stack>
                    </Stack>
                </CardContent>
            </Card>
        </Container>
    );
}