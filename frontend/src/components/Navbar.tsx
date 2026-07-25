import {
  Home,
  Trophy,
  User,
  Users,
  Settings
} from "lucide-react";
import UserMenu from "./UserMenu";

export default function Navbar() {

  return (
    <header className="h-20 flex items-center justify-between px-10 border-b border-white/10">

      <div className="text-4xl font-black text-yellow-400">
        UNO
      </div>

      <nav className="flex gap-8">

        <NavItem icon={<Home />} text="Home"/>

        <NavItem icon={<Trophy />} text="Play"/>

        <NavItem icon={<User />} text="Profile"/>

        <NavItem icon={<Users />} text="Friends"/>

        <NavItem icon={<Settings />} text="Settings"/>

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