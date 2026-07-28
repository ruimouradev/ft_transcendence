import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Box } from "@mui/material";
import { Outlet } from "react-router-dom";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0d1020] text-white">
      <Navbar />
      <main>
        
          <Outlet />
        
      </main>
      <Footer />
    </div>
  );
}