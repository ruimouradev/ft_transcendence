import { useState } from "react";
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined';
import PermIdentityOutlinedIcon from '@mui/icons-material/PermIdentityOutlined';
import SportsEsportsOutlinedIcon from '@mui/icons-material/SportsEsportsOutlined';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';

import UserMenu from "./UserMenu";
import { Link } from "react-router-dom";

import bgImage from '../assets/utils/home.png'

// A barra de cima, presente em todas as páginas. O logo é a imagem
// do leque e faz de link para a home (por isso não há botão Home).
// Em ecrã largo os botões ficam em linha; em telemóvel escondem-se
// atrás do botão de menu, que abre a lista ao alto. O UserMenu do
// canto troca sozinho entre "sign in / sign up" e o menu da conta.
export default function Navbar() {
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
    <header className="border-b border-white/10">
      <div className="h-20 flex items-center justify-between px-4 md:px-10 gap-3">

        <Link to="/" style={{ display: 'flex', height: '100%', alignItems: 'center', overflow: 'hidden', justifyContent: 'center' }}>
          <img style={{ height: '60%', width: 'auto', objectFit: 'cover', flexShrink: 0 }} src={bgImage} alt="UNO Online" />
        </Link>

        {/* os botões em linha, só em ecrã largo */}
        <nav className="hidden md:flex gap-8">
          {links}
        </nav>

        <div className="flex items-center gap-2">
          <UserMenu />
          {/* o botão do menu, só em telemóvel */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-white/10 transition"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
          >
            {open ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {/* a lista ao alto do telemóvel, aberta pelo botão */}
      {open && (
        <nav className="md:hidden flex flex-col gap-1 px-6 pb-4">
          {links}
        </nav>
      )}
    </header>
  );
}

// Um Link estilizado chega: um botão dentro de um link é HTML inválido
// e o browser queixa-se na consola.
function NavItem({
  to,
  icon,
  text,
  onPick,
}: {
  to: string;
  icon: React.ReactNode;
  text: string;
  onPick: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onPick}
      className="flex items-center gap-2 py-2 hover:text-yellow-300 transition"
    >
      {icon}
     <span className="md:inline">
		{text}
	</span>
    </Link>
  );
}
