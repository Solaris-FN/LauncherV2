import { StatisticsResponse } from "@/api/account/interfaces/StatisticsResponse";
import { generateStatisticsResponse } from "@/api/account/requests/statistics";
import useAuth from "@/api/authentication/zustand/state";
import { useEffect, useState } from "react";

export default function StatisticsSection() {
    const [statistics, setStatistics] = useState<StatisticsResponse | null>(null)

    useEffect(() => {
        const fetch = async () => {
            const statsreq = await generateStatisticsResponse(useAuth.getState().token);
            setStatistics(statsreq.data);
        }

        fetch().catch((error) => {
            console.error("Error fetching statistics:", error);
        });
    }, []);

    return (
        <div className="bg-[#2a1e36]/40 shadow-lg backdrop-blur-sm border border-[#3d2a4f]/50 p-3 rounded-lg w-full max-w-xl text-left shadow-lg backdrop-blur-sm border border-[#3d2a4f] relative overflow-hidden">
            <h2 className="text-[#b69dd8] text-base font-semibold mb-2 relative">
                Your Statistics
            </h2>

            <div className="space-y-1.5 relative">
                <div className="mb-4">
                    <h3 className="text-[#b69dd8] text-sm font-semibold mb-1">This Season</h3>
                    <div className="flex justify-between items-center border-b border-[#3d2a4f]/50 py-1">
                        <span className="text-[#d8c4ff] text-sm">Eliminations</span>
                        <span className="text-white font-medium bg-[#3d2a4f]/70 px-2.5 py-0.5 rounded text-sm backdrop-blur-sm">
                            {statistics ? statistics.Solos.kills + statistics.Duos.kills + statistics.Squads.kills : 0}
                        </span>
                    </div>

                    <div className="flex justify-between items-center border-b border-[#3d2a4f]/50 py-1">
                        <span className="text-[#d8c4ff] text-sm">Victory Royales</span>
                        <span className="text-white font-medium bg-[#3d2a4f]/70 px-2.5 py-0.5 rounded text-sm backdrop-blur-sm">
                            {statistics ? statistics.Solos.wins + statistics.Duos.wins + statistics.Squads.wins : 0}
                        </span>
                    </div>

                    <div className="flex justify-between items-center border-b border-[#3d2a4f]/50 py-1">
                        <span className="text-[#d8c4ff] text-sm">Matches Played</span>
                        <span className="text-white font-medium bg-[#3d2a4f]/70 px-2.5 py-0.5 rounded text-sm backdrop-blur-sm">
                            {statistics ? statistics.Solos.matches_played + statistics.Duos.matches_played + statistics.Squads.matches_played : 0}
                        </span>
                    </div>
                </div>

                <div>
                    <h3 className="text-[#b69dd8] text-sm font-semibold mb-1">All Time</h3>
                    <div className="flex justify-between items-center py-1">
                        <span className="text-[#d8c4ff] text-sm">Matches Played</span>
                        <span className="text-white font-medium bg-[#3d2a4f]/70 px-2.5 py-0.5 rounded text-sm backdrop-blur-sm">
                            {statistics ? statistics.MatchesPlayed : 0}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
