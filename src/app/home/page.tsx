"use client"
import useAuth from "@/api/authentication/zustand/state"
import Sidebar from "@/components/core/SideBar"
import { FaUserFriends } from "react-icons/fa"

export default function Home() {
    const auth = useAuth();
    return (
        <div className="flex min-h-screen">
            <Sidebar page={{ page: "Home" }} />
            <div className="flex flex-1 items-center justify-center">
            </div>
            <div className="flex mr-6 mt-6">
                <div className="mr-3">
                    <div className="rounded-xl bg-[#2a1e36]/40 mt-5 p-4 h-16 w-auto flex items-center justify-center space-x-2">
                        <FaUserFriends size={20} className="text-white" />
                        <p className="text-white text-sm font-medium">0/0</p>
                    </div>
                </div>
                <div>
                    <div className="rounded-xl bg-[#2a1e36]/40 mt-5 p-3 w-64">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div
                                    className="h-full w-full rounded-full overflow-hidden bg-gray-200 flex items-center justify-center"
                                    style={{
                                        width: "40px",
                                        height: "40px",
                                    }}
                                >
                                    <img
                                        src={
                                            auth?.athena?.favorite_character
                                                ? `https://fortnite-api.com/images/cosmetics/br/${auth.athena?.favorite_character}/icon.png`
                                                : `https://fortnite-api.com/images/cosmetics/br/${auth.athena?.favorite_character}/smallicon.png`
                                        }
                                        onError={(e) => {
                                            e.currentTarget.onerror = null
                                            e.currentTarget.src = `https://fortnite-api.com/images/cosmetics/br/${auth.athena?.favorite_character}/smallicon.png`
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
            </div>
        </div>
    )
}