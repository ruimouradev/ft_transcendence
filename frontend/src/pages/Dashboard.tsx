import Hero from "../components/Hero";
import DailyChallenges from "../components/DailyChallenges";
import FriendsPanel from "../components/FriendsPanel";
import NewsPanel from "../components/NewsPanel";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-[#0d1020] text-white">
      <Hero />
      <main className="max-w-7xl mx-auto grid grid-cols-12 gap-6 px-8 pb-12">
        <div className="col-span-4">
          <DailyChallenges />
        </div>

        <div className="col-span-4">
          <NewsPanel />
        </div>

        <div className="col-span-4">
          <FriendsPanel />
        </div>
      </main>
    </div>
  );
}