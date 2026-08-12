import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Outlet } from "react-router-dom";
import bgImg from "../assets/bg.jpeg"

export default function Home() {
    return (
        <div className="min-h-screen bg-[#0d1020] text-white flex flex-col bg-slate-950" style={{ backgroundImage: `url(${bgImg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
            {/* <Navbar /> */}
            <div className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md">
                <Navbar />
            </div>
            <main className="flex-1 p-6">
                <Outlet />
            </main>
            <Footer />
        </div>
    );
}