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
                const characterId = auth.athena?.favorite_character.replace("_solaris", "") ?? "";
                const primaryImage = `https://fortnite-api.com/images/cosmetics/br/${characterId}/icon.png`;
                const smallIcon = `https://fortnite-api.com/images/cosmetics/br/${characterId}/smallicon.png`;
                const fallbackImage = `https://cdn.solarisfn.org/Icons/${characterId}.png`;

                const checkImage = async (url: string) => {
                    try {
                        const response = await fetch(url, { method: "HEAD" });
                        return response.ok;
                    } catch {
                        return false;
                    }
                };

                let validImage = primaryImage;
                if (!(await checkImage(primaryImage))) {
                    if (await checkImage(smallIcon)) {
                        validImage = smallIcon;
                    } else {
                        validImage = fallbackImage;
                    }
                }

                await invoke("rich_presence", {
                    username: auth.user?.displayName,
                    character: validImage
                });
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
                <div className="flex justify-between items-start p-6 mt-2">
                    <h1 className="text-3xl font-bold text-white mt-3">Home</h1>

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
                                                console.log("Primary image failed, trying smallicon");
                                                e.currentTarget.src = `https://fortnite-api.com/images/cosmetics/br/${characterId}/smallicon.png`;
                                            }
                                            else if (currentSrc.includes('/smallicon.png')) {
                                                e.currentTarget.src = `https://cdn.solarisfn.org/Icons/${characterId}.png`;
                                            }
                                        }}
                                        className="rounded-xs scale-x-[1]"
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

                <div className="px-5 pb-5 w-full rounded-lg">
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

