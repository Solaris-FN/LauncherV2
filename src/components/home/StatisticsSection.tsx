export default function StatisticsSection() {
    return (
        <div className="bg-[#2a1e36]/40 shadow-lg backdrop-blur-sm border border-[#3d2a4f]/50 p-3 rounded-lg w-full max-w-xl text-left shadow-lg backdrop-blur-sm border border-[#3d2a4f] relative overflow-hidden">
            <h2 className="text-[#b69dd8] text-base font-semibold mb-2 relative">
                Your Statistics
            </h2>

            <div className="space-y-1.5 relative">
                <div className="flex justify-between items-center border-b border-[#3d2a4f]/50 py-1">
                    <span className="text-[#d8c4ff] text-sm">Eliminations</span>
                    <span className="text-white font-medium bg-[#3d2a4f]/70 px-2.5 py-0.5 rounded text-sm backdrop-blur-sm">
                        200
                    </span>
                </div>

                <div className="flex justify-between items-center border-b border-[#3d2a4f]/50 py-1">
                    <span className="text-[#d8c4ff] text-sm">Victory Royales</span>
                    <span className="text-white font-medium bg-[#3d2a4f]/70 px-2.5 py-0.5 rounded text-sm backdrop-blur-sm">
                        1002424
                    </span>
                </div>

                <div className="flex justify-between items-center border-b border-[#3d2a4f]/50 py-1">
                    <span className="text-[#d8c4ff] text-sm">Matches Played</span>
                    <span className="text-white font-medium bg-[#3d2a4f]/70 px-2.5 py-0.5 rounded text-sm backdrop-blur-sm">
                        329
                    </span>
                </div>

                <div className="flex justify-between items-center py-1">
                    <span className="text-[#d8c4ff] text-sm">Time Played</span>
                    <span className="text-white font-medium bg-[#3d2a4f]/70 px-2.5 py-0.5 rounded text-sm backdrop-blur-sm">
                        1m
                    </span>
                </div>
            </div>
        </div>
    );
}
