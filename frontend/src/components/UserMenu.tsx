import * as React from 'react';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Link from '@mui/material/Link';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import Box from '@mui/material/Box';
import LoginDrawer from './LoginDrawer';
import SignUpDrawer from './SignUpDrawer';
import { Link as RouterLink } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';
import defaultAvatar from '../assets/avatar/a00.jpeg';

interface UserProfile {
    full_name: string;
    email: string;
    avatar: string;
    is_superuser: boolean;
    is_active: boolean;
}

export default function UserMenu() {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const { isLoggedIn, profileChanged, toggleProfileChanged, logout } = useAuth();
    const id = React.useId();
    const buttonId = `${id}-button`;
    const menuId = `${id}-menu`;
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const navigate = useNavigate();

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuAction = (action?: () => void) => {
        setAnchorEl(null);
        if (action) {
            action();
        }
    };

    const handleClose = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(null);
        if (event.currentTarget.textContent === 'Logout') {
            logout();
            navigate('/');
        } else if (event.currentTarget.textContent === 'Profile') {
            navigate('/profile');
        }
    };

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await axios.get<UserProfile>('/api/v1/users/me', {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('access_token')}`,
                    },
                });
                setProfile(response.data);
            } catch (err: any) {
                if (axios.isAxiosError(err)) {
                    navigate('/login', { replace: true });
                } else {
                    navigate('/login', { replace: true });
                }
            } finally {
                // setLoading(false);
            }
        };

        fetchProfile();
    }, [isLoggedIn, profileChanged]);

    return (<div>
            {!isLoggedIn ? (<Box sx={{ display: 'flex', gap: 1 }}>
                {/* <LoginDrawer />
            <SignUpDrawer /> */}

                <RouterLink to="/login" underline="none">
                    <Button variant="contained" color="primary">
                        sign in
                    </Button>
                </RouterLink>
                <RouterLink to="/signup" underline="none">
                    <Button variant="contained" color="secondary">
                        sign up
                    </Button>
                </RouterLink>
            </Box>) : (<>
                <Button
                    id={buttonId}
                    aria-controls={open ? menuId : undefined}
                    aria-haspopup="true"
                    aria-expanded={open}
                    onClick={handleClick}
                >
                    <div className="flex items-center gap-4">
                        <img src={profile?.avatar || defaultAvatar} className="w-12 h-12 rounded-full" />
                        <div>
                            <div>{profile?.full_name}</div>
                            <div className="text-sm text-gray-400">
                                {profile?.is_superuser ? 'Super User' : 'User'}
                            </div>
                        </div>
                    </div>
                </Button>
                <Menu id={menuId} anchorEl={anchorEl} open={open} onClose={handleClose}
                    slotProps={{
                        list: {
                            'aria-labelledby': buttonId,
                        },
                    }} >
                    <MenuItem onClick={() => handleMenuAction(() => navigate('/profile'))}>Profile</MenuItem>
                    <MenuItem component={RouterLink} to="/dashboard" onClick={handleClose}>Dashboard</MenuItem>
                    <MenuItem link="/logout" onClick={handleClose}>Logout</MenuItem>
                </Menu>
            </>)}
        </div>
    );
}
