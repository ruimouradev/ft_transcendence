import { Link } from "react-router-dom";

export default function Footer() {
	return (
	<footer className="border-t border-white/10 py-6 text-center text-gray-400">
    	<div className="flex justify-center gap-6 text-sm">
			<Link to="/rules" className="hover:text-white transition-colors">
        		Uno Rules
    		</Link>
			<Link to="/privacy" className="hover:text-white transition-colors">
        		Privacy Policy
			</Link>
			<Link to="/terms" className="hover:text-white transition-colors">
        		Terms of Service
        	</Link>
		</div>
	</footer>
	);
}
