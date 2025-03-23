"use client"
import useAuth from "@/api/authentication/zustand/state"
import Sidebar from "@/components/core/SideBar"
import NewsSection from "@/components/home/NewsSection"
import StatisticsSection from "@/components/home/StatisticsSection"
import { FaUserFriends } from "react-icons/fa"
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
    const auth = useAuth()

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
                                <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                                    <img
                                        src={
                                            auth?.athena?.favorite_character
                                                ? `https://fortnite-api.com/images/cosmetics/br/${auth.athena?.favorite_character.replace("_solaris", "")}/icon.png`
                                                : `https://fortnite-api.com/images/cosmetics/br/${auth.athena?.favorite_character.replace("_solaris", "")}/smallicon.png`
                                        }
                                        onError={(e) => {
                                            e.currentTarget.onerror = null
                                            e.currentTarget.src = `https://fortnite-api.com/images/cosmetics/br/${auth.athena?.favorite_character.replace("_solaris", "")}/smallicon.png`
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
                            <div className="rounded-xl bg-[#2a1e36]/60 ml-7 p-4 h-12 flex items-center justify-center space-x-2 shadow-lg backdrop-blur-sm">
                                <FaUserFriends size={20} className="text-white" />
                                <p className="text-white text-sm font-medium">0/0</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="px-5 pb-3 w-full rounded-lg mb-6 mt-2">
                    <NewsSection />
                </div>
                <div className="px-5 pb-3 w-full rounded-lg">
                    <div className="flex-grow mr-6">
                        <StatisticsSection />
                    </div>
                </div>
            </motion.main>
        </div>
    )
}

