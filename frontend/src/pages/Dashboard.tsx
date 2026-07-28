import Hero from "../components/Hero";
import DailyChallenges from "../components/DailyChallenges";
import FriendsPanel from "../components/FriendsPanel";
import NewsPanel from "../components/NewsPanel";
import { useEffect, useState } from "react";

export default function Dashboard() {
    const [showDashboard, setShowDashboard] = useState(false);

    useEffect(() => {
        const hasToken = Boolean(localStorage.getItem("access_token"));
        if (!hasToken) {
            setShowDashboard(false);
        } else {
            setShowDashboard(true);
        }
    }, []);

    return (
        <div >
            <Hero />
            <main className="flex-1 max-w-7xl mx-auto grid grid-cols-12 gap-6 px-8 pb-12">
            {showDashboard ? (<>
                <div className="col-span-4">
                    <DailyChallenges />
                </div>

                {/* <div className="col-span-4">
          <NewsPanel />
        </div> */}

                <div className="col-span-4">
                    <FriendsPanel />
                </div>
            </>) : null}
            </main>
        </div>
    );
}