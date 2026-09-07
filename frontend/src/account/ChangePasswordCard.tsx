import React, { useState } from 'react';
import { Container, Card, CardContent, Typography, TextField, Button, Alert, Stack, Box, CircularProgress, } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import { api, getErrorMessage } from '../core/client.ts';
import { useAuth } from '../core/AuthContext';

function ChangePasswordCard() 
{
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const { logout } = useAuth();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (newPassword !== confirmPassword) {
            setError('New passwords do not match');
            return;
        }
        if (newPassword.length < 8) {
            setError('New password must be at least 8 characters long');
            return;
        }
        if (currentPassword.length < 8) {
            setError('Current password must be at least 8 characters long');
            return;
        }
        if (currentPassword === newPassword) {
            setError('New password must be different from the current password');
            return;
        }

        setLoading(true);

        api.patch('/users/me/password', { current_password: currentPassword, new_password: newPassword, })
            .then(async (response) => {
                setSuccess(response.data.message || 'Password changed successfully!');
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                await logout();
                // A full load, the protected route reacts to the lost session
                // and its own jump to /login would drop the message
                window.location.href = '/login?info=Password changed successfully. Please log in again.';
            })
            .catch((err) => {
                setError(getErrorMessage(err));
            }).finally(() => {
                setLoading(false);
            });
    };

    return (
        <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
            <Card elevation={3} sx={{ borderRadius: 3, p: 2 }}>
                <CardContent>
                    <Box sx={{ display: 'flex', alignItems: "center", gap: 1.5, mb: 2 }} >
                        <LockIcon color="primary" fontSize="large" />
                        <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold' }}>
                            Change Password
                        </Typography>
                    </Box>
                    {error && (<Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>)}
                    {success && (<Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>)}
                    <form onSubmit={handleSubmit}>
                        <Stack spacing={3}>
                            <TextField label="Current Password" type="password" variant="outlined" fullWidth required value={currentPassword}
								onChange={(e) => setCurrentPassword(e.target.value)} />

                            <TextField label="New Password" type="password" variant="outlined" fullWidth required value={newPassword}
								onChange={(e) => setNewPassword(e.target.value)} helperText="Must be at least 8 characters and less than 33 characters" />

                            <TextField label="Confirm New Password" type="password" variant="outlined" fullWidth required value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)} />

                            <Button type="submit" variant="contained" size="large" disabled={loading} sx={{ mt: 1 }}>
                                {loading ? <CircularProgress size={24} /> : 'Update Password'}
                            </Button>
                        </Stack>
                    </form>
                </CardContent>
            </Card>
        </Container>
    );
}

export default ChangePasswordCard