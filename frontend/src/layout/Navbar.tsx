import { useState } from "react";
import { Box } from '@mui/material'
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined';
import PermIdentityOutlinedIcon from '@mui/icons-material/PermIdentityOutlined';
import SportsEsportsOutlinedIcon from '@mui/icons-material/SportsEsportsOutlined';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import UserMenu from "./UserMenu";
import { Link } from "react-router-dom";
import bgImage from '../assets/utils/home.png'
import { align_noJustify } from '../game/macrosConfig.ts'

function Navbar() 
{
  const [open, setOpen] = useState(false);

  const links = (
    <>
      <NavItem to="/play" icon={<SportsEsportsOutlinedIcon />} text="Play" onPick={() => setOpen(false)} />
      <NavItem to="/statistics" icon={<EmojiEventsOutlinedIcon />} text="Statistics" onPick={() => setOpen(false)} />
      <NavItem to="/profile" icon={<PermIdentityOutlinedIcon />} text="Profile" onPick={() => setOpen(false)} />
      <NavItem to="/friends" icon={<PeopleOutlinedIcon />} text="Friends" onPick={() => setOpen(false)} />
    </>
  );

	return (
		<header style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
			<Box sx={{ height: '80px', ...align_noJustify, justifyContent: 'space-between', px: {xs: 2, md: 5}, gap: 1.5 }}>
				<Link to="/" style={{ display: 'flex', height: '100%', alignItems: 'center', overflow: 'hidden', justifyContent: 'center' }}>
					<img style={{ height: '60%', width: 'auto', objectFit: 'cover', flexShrink: 0 }} src={bgImage} alt="UNO Online" />
				</Link>
				<Box component="nav" sx={{ display: {xs: 'none', md: 'flex'}, gap: '32px' }}>{links}</Box>
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
					<UserMenu />
					<button className="nav-button"
						onClick={() => setOpen(!open)} aria-label="Menu">
						{open ? <CloseIcon /> : <MenuIcon />}
					</button>
				</Box>
			</Box>
			{open &&
				(<Box component="nav" sx={{ display: {xs: 'flex', md: 'none'}, flexDirection: 'column', gap: '4px', px: 3, pb: 2 }}>
					{links}
				</Box>)}
		</header>
  );
}

function NavItem({ to, icon, text, onPick }:
	{ to: string; icon: React.ReactNode; text: string; onPick: () => void })
{
	return (
    	<Link to={to} onClick={onPick} className="navbar">
			{icon}
			<span style={{ display: 'inline' }}>
				{text}
			</span>
		</Link>
	);
}

export default Navbar
