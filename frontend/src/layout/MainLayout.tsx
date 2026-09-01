import Navbar from "./Navbar";
import Footer from "./Footer";
import GamePopUps from "../core/GamePopUps";
import GameWebSocket from "../core/GameWebSocket";
import { Outlet, useLocation } from "react-router-dom";
import bgHome from '../assets/utils/bg_home.png'
import bgPlain from "../assets/utils/bg_plain.jpeg"
import PopUp from '../components/PopUp'
import { Box } from '@mui/material'

export default function MainLayout() {
    const { pathname } = useLocation();
    const isHome = pathname === "/";

    return (
        <Box sx={{ minHeight: '100vh', position: 'relative', overflowX: 'clip', color: 'white', bgcolor: 'rgba(2, 6, 23, 1)', 
			backgroundImage: `url(${bgPlain})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
            <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(2, 6, 23, 0.25)' }} />
			<Box sx={{ width: '60vw', maxHeight: '90vh', aspectRatio: '1.5 / 1', position: 'absolute', top: '50%',
				transform: 'translateY(-50%)', right: 0, backgroundImage: isHome ? `url(${bgHome})` : 'none',
				backgroundSize: 'contain', backgroundPosition: 'center', backgroundRepeat: 'no-repeat'  }} />
            <Box sx={{ minHeight: '100vh', position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ position: 'sticky', zIndex: 50, top: 0, bgcolor: 'rgba(2, 6, 23, 0.9)', backdropFilter: 'blur(12px)' }}>
                    <Navbar />
                </Box>
                <main style={{ flex: '1 1 0%' }}>
					<GamePopUps>
						<GameWebSocket>
							<PopUp />
							<Outlet />
						</GameWebSocket>
					</GamePopUps>
                </main>
				{isHome && <Footer />}
            </Box>
        </Box>
    );
}
