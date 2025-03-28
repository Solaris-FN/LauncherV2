"use client"

import useAuth from "@/api/authentication/zustand/state"
import Sidebar from "@/components/core/SideBar"
import NewsSection from "@/components/home/NewsSection"
import StatisticsSection from "@/components/home/StatisticsSection"
import { FaUserFriends } from "react-icons/fa"
import { motion } from "framer-motion";
import FriendsSection from "@/components/home/FriendsSection"
import { useEffect } from "react"
import { invoke } from "@tauri-apps/api/core"

export default function Home() {
    const auth = useAuth()

    useEffect(() => {
        const rpc = async () => {
            if (auth.token !== "") {
                await invoke("rich_presence", {
                    username: auth.user?.displayName,
                    character: `https://fortnite-api.com/images/cosmetics/br/cid_423_athena_commando_f_painter/icon.png`
                })
            }
        }

        rpc();
    }, []);

    return (
        <div className="flex min-h-screen">
            <Sidebar page={{ page: "Home" }} />
            <motion.main
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="flex-1 flex flex-col mt-3">
                <div className="flex justify-between items-start p-6">
                    <h1 className="text-3xl font-bold text-white mt-3">Home</h1>
                    <div className="items-center justify-center space-x-2 shadow-lg backdrop-blur-sm">

                    </div>

                    <div className="rounded-xl bg-[#2a1e36]/40 shadow-lg backdrop-blur-sm border border-[#3d2a4f]/50 p-3 w-64">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="h-10 w-10 rounded-full overflow-hidden flex items-center justify-center">
                                    <img
                                        src={`https://fortnite-api.com/images/cosmetics/br/${auth.athena?.favorite_character.replace("_solaris", "")}/icon.png`}
                                        onError={(e) => {
                                            const currentSrc = e.currentTarget.src;
                                            const characterId = auth.athena?.favorite_character.replace("_solaris", "") ?? "";

                                            if (currentSrc.includes('/icon.png')) {
                                                e.currentTarget.src = `https://fortnite-api.com/images/cosmetics/br/${characterId}/smallicon.png`;
                                            }
                                            else if (currentSrc.includes('/smallicon.png')) {
                                                const dictionary = new Set([
                                                    "character", "speed", "dial", "stallion", "aviator", "sun", "beam",
                                                    "twilight", "spot", "shine", "weave", "harbor", "wild", "cat", "cactus",
                                                    "rocker", "cereal", "box", "clash", "assassin", "craft", "glue",
                                                    "esmeralda", "christmas", "firth", "angel", "shadow", "grand", "scheme",
                                                    "kelp", "linen", "calcium", "mech", "pilot", "shark", "power", "farmer",
                                                    "shade", "armadillo", "robot", "boom", "shot", "blam", "cj", "crazy",
                                                    "eight", "dark", "ninja", "white", "division", "eternity", "fairy", "flex",
                                                    "galaxy", "team", "leader", "golden", "accomplishment", "grumble", "woof",
                                                    "hip", "hare", "ihaditog", "ice", "retreat", "ink", "demon", "jade",
                                                    "towel", "gloss", "master", "mind", "mecha", "shady", "zero", "meteor",
                                                    "man", "remix", "women", "nana", "split", "nike", "pros", "pastel",
                                                    "glaze", "gift", "pizza", "bear"
                                                ]);

                                                function segmentString(s: string, dict: Set<string>): string[] | null {
                                                    const n = s.length;
                                                    const dp: (number[][] | null)[] = new Array(n + 1).fill(null).map(() => []);
                                                    dp[0] = [];
                                                    for (let i = 0; i < n; i++) {
                                                        if (dp[i] === null) continue;
                                                        for (let j = i + 1; j <= n; j++) {
                                                            const word = s.slice(i, j);
                                                            if (dict.has(word)) {
                                                                if (dp[j] === null) dp[j] = [];
                                                                dp[j]!.push([i]);
                                                            }
                                                        }
                                                    }
                                                    if (dp[n] === null) return null;

                                                    const result: string[] = [];
                                                    let idx = n;
                                                    while (idx > 0) {
                                                        const prevIdx = dp[idx]![0][0];
                                                        result.unshift(s.slice(prevIdx, idx));
                                                        idx = prevIdx;
                                                    }
                                                    return result;
                                                }

                                                function toPascalCase(str: string): string {
                                                    return str.split('_').map(part => {
                                                        if (part === part.toLowerCase()) {
                                                            const words = segmentString(part, dictionary);
                                                            if (words) {
                                                                return words.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('');
                                                            }
                                                        }
                                                        return part.charAt(0).toUpperCase() + part.slice(1);
                                                    }).join('_');
                                                }

                                                const pascalCaseId = toPascalCase(characterId);
                                                e.currentTarget.src = `https://cdn.solarisfn.org/Icons/${pascalCaseId}.png`;
                                            }

                                        }}
                                        className="rounded-xs scale-x-[-1]"
                                        style={{
                                            width: "40px",
                                            height: "40px",
                                        }}
                                        alt="Character"
                                    />
                                </div>
                                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-black/30" />
                            </div>
                            <div className="flex flex-col">
                                <h3 className="font-medium text-white">{auth.user?.displayName}</h3>
                                <span className="text-xs text-gray-300">Online</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="px-5 pb-3 w-full rounded-lg mb-6 mt-2">
                    <NewsSection />
                </div>
                <div className="px-5 pb-3 w-full rounded-lg flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2">
                    <div className="flex-grow mr-6">
                        <StatisticsSection />
                    </div>
                    <div>
                        <FriendsSection />
                    </div>
                </div>
            </motion.main>
        </div>
    )
}

