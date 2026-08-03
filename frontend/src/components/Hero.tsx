import { Link } from "react-router-dom";

export default function Hero() {
    return (
        <section className="max-w-7xl mx-auto px-8 py-12">

            <div className="grid grid-cols-2 items-center">

                <div>

                    <h1 className="text-7xl font-black leading-tight">
                        <span className="text-yellow-400 colorful-text-1" style={{ fontSize: '3rem' }}>
                            EXPERIENCE UNO LIVE.
                        </span>
                    </h1>

                    <p className="text-gray-400 mt-6 text-xl">

                        Challenge your friends online.

                    </p>

                    <div className="flex gap-5 mt-10">
                        <Link to="/play" className="no-underline">
                            <button className="relative px-7 py-3.5 rounded-full text-sm font-bold text-slate-900
                                                bg-gradient-to-r from-cyan-200 via-sky-200 to-pink-200
                                                shadow-[0_0_25px_rgba(56,189,248,0.6)]
                                                hover:shadow-[0_0_35px_rgba(244,114,182,0.8)]
                                                hover:scale-105 active:scale-95
                                                transition-all duration-300 ease-out cursor-pointer
                                                ">
                                Play Now (onLine)
                            </button>
                        </Link>
                        <button className="px-7 py-3.5 rounded-full text-sm font-semibold text-slate-200
                                            bg-slate-900/60 backdrop-blur-md
                                            border border-slate-700/80
                                            hover:border-slate-400 hover:bg-slate-800/80 hover:text-white
                                            hover:scale-105 active:scale-95
                                            transition-all duration-300 ease-out cursor-pointer">
                            Create Game
                        </button>
                    </div>
                    <br />             
                    <span className="font-semibold tracking-wide text-xs text-slate-300">
                        Players Online:
                    </span>
                    <span className="text-l font-extrabold text-cyan-50 text-shadow-cyan-glow">
                        4,242
                    </span>
                    <span style={{ display: 'inline-block', width: '20px' }} />
                    <span className="font-semibold tracking-wide text-xs text-slate-300">
                        Games Active:
                    </span>
                    {/* 这里可以尝试使用粉色发光作为对比，原图是淡光，可以自定义 */}
                    <span className="text-l font-extrabold text-slate-100 text-shadow-glow [text-shadow:0_0_15px_rgba(255,255,255,0.7)]">
                        4,242
                    </span>
                </div>
            </div>

        </section>
    );
}