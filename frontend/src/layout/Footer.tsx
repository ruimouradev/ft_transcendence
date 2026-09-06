import { Link } from "react-router-dom";
import { Box } from '@mui/material';

function Footer() 
{
	return (
	<footer style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', padding: '24px 0', textAlign: 'center', color: '#999999'}}>
    	<Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, fontSize: '14px', lineHeight: '1.4rem' }}>
			<Link to="/rules" className="footer">
        		Uno Rules
    		</Link>
			<Link to="/privacy" className="footer">
        		Privacy Policy
			</Link>
			<Link to="/terms" className="footer">
        		Terms of Service
        	</Link>
		</Box>
	</footer>
	);
}

export default Footer
