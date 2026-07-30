import {
  Home,
  Trophy,
  User,
  Users,
  Settings
} from "lucide-react";
import UserMenu from "./UserMenu";
import { Link } from "react-router-dom";

export default function Navbar() {

  return (
    <header className="h-20 flex items-center justify-between px-10 border-b border-white/10">

      <div className="text-4xl font-black text-yellow-400 colorful-text-animated">
        UNO Online
      </div>

      <nav className="flex gap-8">
        <Link to="/" className="flex items-center gap-2 hover:text-yellow-300 transition">
          <NavItem icon={<Home />} text="Home"/>
        </Link>

        <Link to="/play" className="flex items-center gap-2 hover:text-yellow-300 transition">
          <NavItem icon={<Trophy />} text="Play"/>
        </Link>

        <Link to="/profile" className="flex items-center gap-2 hover:text-yellow-300 transition">
          <NavItem icon={<User />} text="Profile"/>
        </Link>
        <Link to="/friends" className="flex items-center gap-2 hover:text-yellow-300 transition">
          <NavItem icon={<Users />} text="Friends"/>
        </Link>
        {/* <NavItem icon={<Settings />} text="Settings"/> */}

      </nav>
        <UserMenu />
    </header>
  );
}

function NavItem({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <button className="flex items-center gap-2 hover:text-yellow-300 transition">
      {icon}
      {text}
    </button>
  );
}