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

export default function UserMenu() {
  const { isLoggedIn, logout } = useAuth();
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
    setAnchorEl(null); // 关闭菜单
    if (action) {
      action(); // 执行对应的逻辑（跳转或登出）
    }
  };

  const handleClose = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(null);
    console.log('Menu item clicked:', event.currentTarget.textContent);
    if (event.currentTarget.textContent === 'Logout') {
      logout();
      navigate('/');
    }else if (event.currentTarget.textContent === 'Profile') {
      navigate('/profile');
    }
  };

  return (
    <div>
    {!isLoggedIn ? (<Box sx={{ display: 'flex', gap: 1 }}>
            <LoginDrawer />
            <SignUpDrawer />
        </Box>) : (<>
      <Button
        id={buttonId}
        aria-controls={open ? menuId : undefined}
        aria-haspopup="true"
        aria-expanded={open}
        onClick={handleClick}
      >
        <div className="flex items-center gap-4">
            <img src="src/assets/avatar/a00.jpeg" className="w-12 h-12 rounded-full" />
            <div>
                <div>Super Uno</div>
                <div className="text-sm text-gray-400">
                    Level 8
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
       </> )}
    </div>
  );
}
