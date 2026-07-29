import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import {
    Container,
    Card,
    CardContent,
    Box,
    Avatar,
    Typography,
    Alert,
    CircularProgress,
    Stack,
    Chip,
    Divider,
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

export default function ProfileCard() {
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();
    const { user, login } = useAuth();

    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);
    const handleAvatarClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const tempPreviewUrl = URL.createObjectURL(file);
        login({ ...user, avatar: tempPreviewUrl });
        const formData = new FormData();
        formData.append('file', file);

        setUploading(true);

        try {
            const response = await axios.post('/api/v1/users/uploadfile', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                withCredentials: true,
            });

            const uploadedUrl = response.data?.url || tempPreviewUrl;
            login({ ...user, avatar: uploadedUrl });
        } catch (error) {
            if (error.response.status == 403) {
                navigate('/login');
            } else {
                setError('Failed to upload avatar. Please try again.');
            }
        } finally {
            setUploading(false);
        }
    };

    if (uploading) {
        return (
            <Box display="flex" sx={{ justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Container maxWidth="sm" sx={{ mt: 4 }}>
                <Alert severity="error">{error}</Alert>
            </Container>
        );
    }

    if (!user) return null;

    return (
        <Container maxWidth="sm" sx={{ mt: 6, mb: 6 }}>
            <Card elevation={3} sx={{ borderRadius: 3, overflow: 'hidden' }}>

                <Box sx={{ height: 120, bgcolor: 'primary.main' }} />

                <CardContent sx={{ pt: 0, position: 'relative' }}>

                    <Box display="flex" sx={{ justifyContent: 'center', mt: -7, mb: 2 }}>
                        <Avatar
                            src={user.avatar}
                            alt={user.full_name}
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
                            {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
                        </Avatar>

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
                        <Typography variant="h5" component="h1" fontWeight="bold">
                            {user.full_name}
                        </Typography>

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

                    {/* <Divider sx={{ my: 3 }} />

                    <Stack spacing={2} sx={{ px: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography color="text.secondary">Account Role</Typography>
                            <Typography fontWeight="medium">
                                {user.is_superuser ? 'Administrator' : 'General User'}
                            </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography color="text.secondary">Account Status</Typography>
                            <Typography
                                fontWeight="medium"
                                color={user.is_active ? 'success.main' : 'error.main'}
                            >
                                {user.is_active ? 'Activated' : 'Pending Activation'}
                            </Typography>
                        </Box>
                    </Stack> */}
                </CardContent>
            </Card>
        </Container>
    );
}