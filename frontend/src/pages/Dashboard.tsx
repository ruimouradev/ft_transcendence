import Hero from "../components/Hero";
import DailyChallenges from "../components/DailyChallenges";
import FriendsPanel from "../components/FriendsPanel";
import { useAuth } from "../components/AuthContext";

export default function Dashboard() {
    const { isAuthenticated } = useAuth();

    return (
        <div >
            <Hero />
            <main className="flex-1 max-w-7xl mx-auto grid grid-cols-12 gap-6 px-8 pb-12">
            {isAuthenticated ? (<>
                <div className="col-span-4">
                    <DailyChallenges />
                </div>
                <div className="col-span-4">
                    <FriendsPanel />
                </div>
            </>) : null}
            </main>
        </div>
    );
}