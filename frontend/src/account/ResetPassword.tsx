import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// import axios from 'axios';
import { Container, Card, CardContent, Typography, TextField, Button, Alert, Stack, Box, CircularProgress, } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import { api, getErrorMessage } from '../core/client.ts';

function ResetPassword()
{
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const navigate = useNavigate();

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

        setLoading(true);

        api.post('/set-password', { password: newPassword, token: new URLSearchParams(window.location.search).get('token'), })
            .then(() => {
                navigate('/login?info=Password reset successfully');
            })
            .catch((err: unknown) => {
                setError(getErrorMessage(err));
            }).finally(() => {
                setLoading(false);
            });
    };

    return (
        <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
            <Card elevation={3} sx={{ borderRadius: 3, p: 2 }}>
                <CardContent>
                    <Box sx={{ display: 'flex', alignItems: "center", gap: 1.5, mb: 2 }}>
                        <LockIcon color="primary" fontSize="large" />
                        <Typography variant="h5" component="h1" sx={{fontWeight: 'bold'}}>
                            Reset Password
                        </Typography>
                    </Box>
                    {error && (<Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>)}
                    {success && (<Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>)}
                    <form onSubmit={handleSubmit}>
                        <Stack spacing={3}>
                            <TextField label="New Password" type="password" variant="outlined" fullWidth required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} helperText="Must be at least 8 characters and less than 33 characters" />

                            <TextField label="Confirm New Password" type="password" variant="outlined" fullWidth required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />

                            <Button type="submit" variant="contained" size="large" disabled={loading} sx={{ mt: 1 }}              >
                                {loading ? <CircularProgress size={24} /> : 'Update Password'}
                            </Button>
                        </Stack>
                    </form>
                </CardContent>
            </Card>
        </Container>
    );
}

export default ResetPassword