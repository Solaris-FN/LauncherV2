"use client";

import { useEffect, useState } from "react";
import { Trash2, Plus, Loader2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import useBuilds from "@/modules/zustand/library/useBuilds";
import { HiPause, HiPlay, HiPlus, HiTrash } from "react-icons/hi";
import Sidebar from "@/components/core/SideBar";

export default function Library() {
    const buildState = useBuilds();
    const [activeBuild, setActiveBuild] = useState<string | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [hoveredBuild, setHoveredBuild] = useState<string | null>(null);
    const [isAddHovered, setIsAddHovered] = useState(false);
    const [handlers, setHandlers] = useState<any>(null);

    useEffect(() => {
        if (typeof window === "undefined") {
            return;
        }

        const loadHandlers = async () => {
            const {
                handleLaunchBuild,
                handleAddBuild,
                handleCloseBuild,
                checkifopen,
            } = await import("@/modules/next/library/handlers");
            setHandlers({
                handleLaunchBuild,
                handleAddBuild,
                handleCloseBuild,
                checkifopen,
            });
        };

        loadHandlers();
    }, []);

    useEffect(() => {
        if (handlers && handlers.checkifopen) {
            handlers.checkifopen(setActiveBuild);
        }
    }, [handlers]);

    const handlelaunchBuild = async (path: string, version: string) => {
        if (handlers && handlers.handleLaunchBuild) {
            await handlers.handleLaunchBuild(
                path,
                version,
                activeBuild,
                setActiveBuild,
                setIsDialogOpen
            );
        }
    };

    const handleAddBuild = async () => {
        if (handlers && handlers.handleAddBuild) {
            await handlers.handleAddBuild(setIsLoading);
        }
    };

    const handleCloseBuild = async () => {
        if (handlers && handlers.handleCloseBuild) {
            await handlers.handleCloseBuild(setActiveBuild, setIsDialogOpen);
            setActiveBuild(null);
            setIsDialogOpen(false);
        }
    };

    const builds = Array.from(buildState?.builds?.values() || []);

    return (
        <div className="flex items-center justify-center h-screen">
            <Sidebar page={{ page: "Library" }} />
            <motion.main
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="flex-grow p-8 justify-center min-h-screen"
            >
                <div className="max-w-6xl mx-auto">
                    <h1 className="text-3xl font-bold text-white mt-3">Library</h1>

                    <br></br>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-3 gap-8">
                        {builds.map((build, index) => {
                            if (!build) return null;
                            const versionNumber = Number(build.version);
                            let isActive = activeBuild === build.path;

                            return (
                                <div
                                    key={index}
                                    className={`bg-[#191b1c]/40 rounded-lg overflow-hidden shadow-lg transition-all duration-300 ${isActive ? "ring-2 ring-gray-400/40" : "hover:shadow-3xl"
                                        }`}
                                    onMouseEnter={() => setHoveredBuild(build.path)}
                                    onMouseLeave={() => setHoveredBuild(null)}
                                >
                                    <button
                                        className="w-full h-full text-left focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                        onClick={() => {
                                            handlelaunchBuild(build.path, build.version);
                                        }}
                                        disabled={activeBuild !== null && !isActive}
                                    >
                                        <div className="relative">
                                            <img
                                                src={build.splash}
                                                alt={`Splash: ${build.version}`}
                                                className="w-full h-40 object-cover object-top"
                                                width={240}
                                                height={160}
                                            />
                                            {isActive && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                                                    <HiPause className="h-16 w-16 text-gray-400/90" />
                                                </div>
                                            )}
                                            {hoveredBuild === build.path && !isActive && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 transition-opacity duration-300">
                                                    <HiPlay className="h-16 w-16 text-gray-400/90" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-4">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="font-semibold text-white text-lg">
                                                    {build.version}
                                                </span>
                                                <span className="text-gray-400 text-sm">
                                                    {versionNumber <= 10.40
                                                        ? "Chapter 1"
                                                        : versionNumber <= 18.40
                                                            ? "Chapter 2"
                                                            : "Chapter 3"}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-400 text-sm truncate">
                                                    {build.real}
                                                </span>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (buildState && buildState.remove) {
                                                            console.log("Removing build:", build.path);
                                                            buildState.remove(build.path);
                                                        } else {
                                                            console.error("Remove function not available");
                                                        }
                                                    }}
                                                    className="text-gray-500 hover:text-gray-600 focus:outline-none cursor-pointer"
                                                    aria-label={`Remove build ${build.version}`}
                                                >
                                                    <HiTrash className="h-5 w-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div
                    className="fixed bottom-8 right-8 flex items-center"
                    onMouseEnter={() => setIsAddHovered(true)}
                    onMouseLeave={() => setIsAddHovered(false)}
                >
                    <button
                        className="fixed bottom-4 right-4 shadow-lg bg-[#1F2025]/40 text-white border border-white/20 rounded-md px-3 py-2 text-sm font-medium flex items-center justify-center hover:bg-[#2F3035] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#1F2025] focus:ring-white/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        onClick={() => handleAddBuild()}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <>
                                <Plus className="h-4 w-4 mr-1.5" />
                                Add
                            </>
                        )}
                    </button>
                </div>
            </motion.main>

            {isDialogOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50"
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ type: "spring", damping: 15, stiffness: 300 }}
                        className="bg-slate-900/70 p-6 rounded-lg max-w-sm w-full mx-4 relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 to-orange-500/20 opacity-30" />
                        <button
                            onClick={() => setIsDialogOpen(false)}
                            className="absolute top-2 right-2 text-white hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                            <X size={24} />
                        </button>
                        <h2 className="text-2xl font-bold mb-4 text-white relative z-10">Close Game</h2>
                        <p className="mb-6 text-white relative z-10">
                            Are you sure you want to close your game?
                        </p>
                        <div className="flex justify-end space-x-4 relative z-10">
                            <button
                                className="px-4 py-2 rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-500 transition-colors duration-200"
                                onClick={() => setIsDialogOpen(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 transition-colors duration-200"
                                onClick={handleCloseBuild}
                            >
                                Close Game
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </div>
    );
}