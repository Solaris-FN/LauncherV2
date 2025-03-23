"use client"

import React from "react"

type Friend = {
    id: string
    name: string
    color: string
    status: string
    presence: "online" | "away" | "busy" | "offline"
}

export default function FriendsSection() {
    const [friends] = React.useState<Friend[]>([
        {
            id: "1",
            name: "Itztiva",
            color: "from-purple-600 to-purple-700",
            status: "Playing Battle Royale - Solo - 2 Left",
            presence: "online",
        },
    ])

    const getPresenceColor = (presence: string) => {
        switch (presence) {
            case "online":
                return "bg-green-500"
            case "away":
                return "bg-yellow-500"
            case "busy":
                return "bg-red-500"
            case "offline":
                return "bg-gray-500"
            default:
                return "bg-gray-500"
        }
    }

    return (
        <div className="w-[450px] rounded-lg border border-[#3d2a4f]/50 bg-[#2a1e36]/40 p-3 text-white shadow-lg backdrop-blur-sm">
            <div className="mb-1.5 flex items-center justify-between">
                <h2 className="text-base font-bold text-gray-300">Online Friends</h2>
                <span className="text-xs text-gray-300">1 of 1</span>
            </div>

            <div className="custom-scrollbar max-h-[153px] overflow-y-auto pr-1">
                <div className="flex flex-col space-y-1.5">
                    {friends.map((friend) => (
                        <div
                            key={friend.id}
                            className="group flex w-full items-center rounded-md bg-gradient-to-r from-[#2a1e36]/80 to-[#332542]/80 px-3 py-2 transition-all duration-200 hover:from-[#2a1e36]/90 hover:to-[#332542]/90 hover:shadow-md"
                        >
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <div
                                        className={`flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br ${friend.color} shadow-inner`}
                                    >
                                        <span className="text-sm font-bold text-gray-300">{friend.name.charAt(0)}</span>
                                    </div>
                                    <div
                                        className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ${getPresenceColor(friend.presence)} ring-1 ring-[#2a1e36]`}
                                    ></div>
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-medium leading-tight tracking-tight text-gray-300">{friend.name}</span>
                                    <span className="text-xs text-gray-400">{friend.status}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(58, 41, 76, 0.2);
          border-radius: 10px;
          margin: 2px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(93, 63, 124, 0.5);
          border-radius: 10px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(111, 76, 147, 0.7);
        }
      `}</style>
        </div>
    )
}

