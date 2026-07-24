import {
  Home,
  Trophy,
  User,
  Users,
  Settings
} from "lucide-react";

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

      <div className="flex items-center gap-4">

        <img
          src="https://i.pravatar.cc/80"
          className="w-12 h-12 rounded-full"
        />

        <div>
          <div>Super Uno</div>
          <div className="text-sm text-gray-400">
            Level 8
          </div>
        </div>

      </div>

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