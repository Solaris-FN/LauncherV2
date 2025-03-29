"use client"

import Sidebar from "@/components/core/SideBar"
import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import { Trophy, Search, Crown, Medal } from "lucide-react"
import { FaSkullCrossbones } from "react-icons/fa"
import { endpoints } from "@/api/config/endpoints"

export default function Leaderboard() {
    const [players, setPlayers] = useState<{ id: string; name: string; eliminations: number; wins: number; matches_played: number; score: number; avatar?: string }[]>([])

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const response = await fetch(endpoints.GET_LAUNCHER_LEADERBOARD, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    },
                })

                if (response.ok) {
                    const data = await response.json()
                    setPlayers(data)
                } else {
                    console.error("Failed to get leaderboard")
                }
            } catch (error) {
                console.error("Error getting leaderboard:", error)
            }
        }

        fetchLeaderboard()
    }, [])

    const [searchTerm, setSearchTerm] = useState("")
    const [isScrolled, setIsScrolled] = useState(false)

    useEffect(() => {
        const tableContainer = document.querySelector('.custom-scrollbar')

        const handleScroll = () => {
            if (tableContainer && tableContainer.scrollTop > 10) {
                setIsScrolled(true)
            } else {
                setIsScrolled(false)
            }
        }

        tableContainer?.addEventListener('scroll', handleScroll)

        return () => {
            tableContainer?.removeEventListener('scroll', handleScroll)
        }
    }, [])

    const calculateScore = (eliminations: number, wins: number) => {
        return eliminations + wins * 2
    }

    const sortedPlayers = [...players]
        .filter((player) => player.name.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a, b) => {
            const A = calculateScore(a.eliminations, a.wins)
            const B = calculateScore(b.eliminations, b.wins)
            return B - A  // Changed to sort in descending order
        })

    const getRankStyle = (index: number) => {
        if (index === 0) return "text-yellow-400"
        if (index === 1) return "text-gray-300"
        if (index === 2) return "text-amber-600"
        return "text-gray-400"
    }

    const getRankIcon = (index: number) => {
        if (index === 0) return <Crown className="h-5 w-5 text-gray-400" />
        if (index === 1) return <Medal className="h-5 w-5 text-gray-400" />
        if (index === 2) return <Medal className="h-5 w-5 text-gray-400" />
        return <span className="font-bold text-gray-400">{index + 1}</span>
    }

    return (
        <div className="flex min-h-screen">
            <Sidebar page={{ page: "Leaderboard" }} />

            <div className="flex-1">
                <motion.main
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex-1 flex flex-col py-6 px-4 md:px-6 h-screen"
                >
                    <div className="flex flex-col gap-6 p-6 h-full">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <h1 className="text-3xl font-bold text-white">Leaderboard</h1>
                            <div className="relative w-full md:w-64">
                                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 h-3.5 w-3.5" />
                                <input
                                    type="text"
                                    placeholder="Search players..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-8 pr-3 py-2 text-sm bg-gray-800/40 text-white rounded-lg border border-gray-700/50 focus:outline-none focus:ring-1 focus:ring-purple-500/50 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {sortedPlayers.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {sortedPlayers.slice(0, 3).map((player, index) => (
                                    <motion.div
                                        key={player.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.2, delay: index * 0.1 }}
                                        className={`rounded-xl border ${index === 0
                                            ? "bg-gradient-to-b from-yellow-500/10 to-gray-900/80 border-yellow-500/20"
                                            : index === 1
                                                ? "bg-gradient-to-b from-gray-700/10 to-gray-900/80 border-gray-600/20"
                                                : "bg-gradient-to-b from-amber-900/10 to-gray-900/80 border-amber-700/20"
                                            } p-4 flex flex-col items-center`}
                                    >
                                        <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-700 mb-2 bg-gray-800">
                                            <img
                                                src={player.avatar || "/placeholder.svg"}
                                                alt={player.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>

                                        <h3 className="text-base font-bold text-white">{player.name}</h3>
                                        <p className={`text-xs font-medium ${getRankStyle(index)} mb-2`}>Rank #{index + 1}</p>

                                        <div className="w-full grid grid-cols-2 gap-2 text-center">
                                            <div className="flex items-center justify-center gap-1.5 p-1.5 rounded-md bg-gray-800/40">
                                                <FaSkullCrossbones className="h-3.5 w-3.5 text-gray-400" />
                                                <span className="text-sm font-bold text-white">{player.eliminations}</span>
                                            </div>
                                            <div className="flex items-center justify-center gap-1.5 p-1.5 rounded-md bg-gray-800/40">
                                                <Trophy className="h-3.5 w-3.5 text-gray-400" />
                                                <span className="text-sm font-bold text-white">{player.wins}</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}

                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.3 }}
                            className="bg-gray-800/20 backdrop-blur-sm rounded-xl border border-gray-700/30 shadow-lg overflow-hidden flex-1 flex flex-col"
                        >
                            <div className="overflow-y-auto custom-scrollbar flex-1 rounded-b-xl">
                                <table className="w-full text-sm">
                                    <thead className={`sticky top-0 z-10 transition-opacity duration-200 ${isScrolled ? 'opacity-0' : 'opacity-100'}`}>
                                        <tr>
                                            <th className="bg-gray-900/20 py-4 px-4 text-center font-medium text-gray-300 w-12 first:rounded-tl-md">
                                                #
                                            </th>
                                            <th className="bg-gray-900/20 py-4 px-4 text-left font-medium text-gray-300">Player</th>
                                            <th className="bg-gray-900/20 py-4 px-4 text-left font-medium text-gray-300">
                                                <div className="flex items-center gap-1.5 justify-end md:justify-start">
                                                    <FaSkullCrossbones className="h-3.5 w-3.5 text-gray-400" />
                                                    <span>Eliminations</span>
                                                </div>
                                            </th>
                                            <th className="bg-gray-900/20 py-4 px-4 text-right md:text-left font-medium text-gray-300 last:rounded-tr-md pr-8">
                                                <div className="flex items-center gap-1.5 justify-end md:justify-start">
                                                    <Trophy className="h-3.5 w-3.5 text-gray-400" />
                                                    <span>Wins</span>
                                                </div>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sortedPlayers.map((player, index) => (
                                            <motion.tr
                                                key={player.id}
                                                initial={{ opacity: 0, y: 5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.2, delay: 0.4 + index * 0.03 }}
                                                className="border-b border-gray-700/20 hover:bg-gray-700/10 transition-colors"
                                            >
                                                <td className="py-2.5 px-4 text-center">
                                                    <div className="flex justify-center">{getRankIcon(index)}</div>
                                                </td>
                                                <td className="py-2.5 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-700 bg-gray-800">
                                                            <img
                                                                src={player.avatar || "/placeholder.svg"}
                                                                alt={player.name}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        </div>
                                                        <span className="font-medium text-white">{player.name}</span>
                                                    </div>
                                                </td>
                                                <td className="py-2.5 px-4 text-gray-200">{player.eliminations.toLocaleString()}</td>
                                                <td className="py-2.5 px-4 text-gray-200">{player.wins.toLocaleString()}</td>
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    </div>
                </motion.main>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(31, 41, 55, 0.1);
                    border-radius: 3px;
                }
                
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(107, 114, 128, 0.5);
                    border-radius: 3px;
                }
                
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(156, 163, 175, 0.6);
                }
            `}</style>
        </div>
    )
}