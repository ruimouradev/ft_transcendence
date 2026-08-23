import Navbar from "./Navbar";
import Footer from "./Footer";
import GameWebSocket from "../core/GameWebSocket";
import { Outlet, useLocation } from "react-router-dom";
import bgHome from "../assets/utils/bg.jpeg"
import bgPlain from "../assets/utils/bg_plain.jpeg"

// A moldura do site: navbar pegajosa em cima, footer em baixo, e a
// página de cada rota a desenhar-se no Outlet do meio.
export default function MainLayout() {
    // a imagem com o leque de cartas é o cartaz da página inicial;
    // as restantes páginas usam o mesmo céu sem cartas, para nada
    // aparecer cortado atrás dos painéis. Para mudar o fundo da home
    // basta substituir o ficheiro bg.jpeg por outra imagem
    const { pathname } = useLocation();
    const isHome = pathname === "/" || pathname === "/dashboard";
    const bgImg = isHome ? bgHome : bgPlain;

    return (
        <div
            className="relative min-h-screen overflow-x-clip text-white bg-slate-950"
            style={{ backgroundImage: `url(${bgImg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        >
            {/* um véu escuro leve por cima do fundo, para o texto ser
                legível em qualquer zona */}
            <div className="absolute inset-0 bg-slate-950/25" />

            <div className="relative z-10 flex min-h-screen flex-col">
                <div className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md">
                    <Navbar />
                </div>
                <main className="flex-1 p-6">
					<GameWebSocket>
                    	<Outlet />
					</GameWebSocket>
                </main>
            </div>
        </div>
    );
}
