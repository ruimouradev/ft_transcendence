import { Link } from "react-router-dom";
import Footer from "../layout/Footer";

// O cartaz da página de entrada. O texto vive na metade esquerda,
// que é a zona calma da imagem de fundo, e a metade direita fica
// para a própria imagem respirar. Sem números inventados: quando
// quiseres mostrar jogadores online ou mesas a decorrer a sério,
// a lista pública de salas (GET /api/rooms) dá-te os verdadeiros.
export default function HomePage() {
    return (
        <section className="max-w-7xl mx-auto px-8 py-16 ">
            <div className="grid md:grid-cols-2 items-center ">
                <div>
                    {/* titulo sobrio: branco forte, e a cor fica toda
                        num unico detalhe, o ponto final em vermelho */}
                    <h1 className="text-5xl font-black tracking-tight text-white leading-tight">
                        EXPERIENCE UNO LIVE<span className="text-red-500">.</span>
                    </h1>

                    <p className="text-gray-300 mt-6 text-xl">
                        Challenge your friends online.
                    </p>

                    {/* um link com cara de botao: um button dentro de
                        um link e HTML invalido e o browser queixa-se */}
                    <div className="flex mt-10">
                        <Link to="/play" className="px-12 py-4 rounded-full text-lg font-bold text-slate-900 no-underline bg-gradient-to-r from-cyan-200 via-sky-200 to-pink-200 shadow-[0_0_25px_rgba(56,189,248,0.6)] hover:shadow-[0_0_35px_rgba(244,114,182,0.8)] hover:scale-105 active:scale-95 transition-all duration-300 ease-out">
                            Play Now
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
