"use client";

import { useEffect, useState } from "react";
import { Plus, Loader2, X, CheckCircle2, FileText, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import useBuilds from "@/modules/zustand/library/useBuilds";
import { HiPause, HiPlay, HiTrash } from "react-icons/hi";
import Sidebar from "@/components/core/SideBar";
import HostedBuilds from "@/components/library/HostedBuilds";

export default function Library() {
  const buildState = useBuilds();
  const [activeBuild, setActiveBuild] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hoveredBuild, setHoveredBuild] = useState<string | null>(null);
  const [isAddHovered, setIsAddHovered] = useState(false);
  const [handlers, setHandlers] = useState<any>(null);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [isBrowseBuildsModalOpen, setIsBrowseBuildsModalOpen] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<{
    progress: any;
    messages: any;
    speeds: any;
    files: string[];
    completed: string[];
  }>({
    progress: {},
    messages: {},
    speeds: {},
    files: [],
    completed: [],
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const loadHandlers = async () => {
      const { handleLaunchBuild, handleAddBuild, handleCloseBuild, checkifopen } = await import(
        "@/modules/next/library/handlers"
      );
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
      if (activeBuild === path) {
        setIsDialogOpen(true);
      } else {
        setDownloadProgress({ progress: {}, messages: {}, speeds: {}, files: [], completed: [] });
        setIsDownloadModalOpen(true);

        await handlers.handleLaunchBuild(
          path,
          version,
          activeBuild,
          setActiveBuild,
          setIsDialogOpen,
          setDownloadProgress,
          setIsDownloadModalOpen
        );
      }
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
    <div className="flex h-screen">
      <Sidebar page={{ page: "Library" }} />
      <motion.main
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="flex-grow overflow-auto scrollbar-thin scrollbar-thumb-[#3d2a4f] scrollbar-track-transparent">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-10">
            <h1 className="text-3xl font-bold text-white tracking-tight">Library</h1>
            <div className="flex gap-3 bottom-[100px] left-0">
              <button
                onClick={() => handleAddBuild()}
                disabled={isLoading}
                className="flex items-center px-4 py-2.5 bg-[#191b1c]/80 text-white border border-white/10 rounded-lg shadow-lg text-sm font-medium hover:bg-[#191b1c] transition-all focus:outline-none focus:ring-2 focus:ring-white/30 disabled:opacity-50 disabled:cursor-not-allowed">
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Add Build
              </button>
              <button
                onClick={() => setIsBrowseBuildsModalOpen(true)}
                className="flex items-center px-4 py-2.5 bg-[#2a1e36]/70 text-white border border-[#3d2a4f]/50 rounded-lg shadow-lg text-sm font-medium hover:bg-[#3d2a4f]/70 transition-all focus:outline-none focus:ring-2 focus:ring-purple-400/30">
                <Search className="h-4 w-4 mr-2" />
                Browse Builds
              </button>
            </div>
          </div>

          {builds.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center">
              <div className="w-20 h-20 mb-6 rounded-full bg-[#2a1e36]/50 flex items-center justify-center">
                <FileText className="h-10 w-10 text-purple-300/70" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">No builds found</h2>
              <p className="text-gray-400 max-w-md mb-6">
                Your library is empty. Add your first build to get started.
              </p>
              <button
                onClick={() => handleAddBuild()}
                disabled={isLoading}
                className="flex items-center px-5 py-2.5 bg-[#2a1e36]/70 text-white rounded-lg shadow-lg text-sm font-medium hover:bg-[#3d2a4f]/70 transition-all focus:outline-none focus:ring-2 focus:ring-purple-400/30 disabled:opacity-50 disabled:cursor-not-allowed">
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Add Your First Build
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {builds.map((build, index) => {
                if (!build) return null;
                const versionNumber = Number(build.version);
                const isActive = activeBuild === build.path;
                const chapterLabel =
                  versionNumber <= 10.4
                    ? "Chapter 1"
                    : versionNumber <= 18.4
                    ? "Chapter 2"
                    : "Chapter 3";

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className={`group relative overflow-hidden rounded-xl ${
                      isActive
                        ? "ring-2 ring-purple-500/50 shadow-lg shadow-purple-500/10"
                        : "border border-white/5 hover:border-[#3d2a4f]/50"
                    } bg-[#191b1c]/40 backdrop-blur-sm transition-all duration-300`}
                    onMouseEnter={() => setHoveredBuild(build.path)}
                    onMouseLeave={() => setHoveredBuild(null)}>
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30 pointer-events-none z-10" />

                    <div className="relative aspect-[16/9] overflow-hidden">
                      <img
                        src={build.splash || "/placeholder.svg"}
                        alt={`Splash: ${build.version}`}
                        className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                        width={320}
                        height={180}
                      />

                      <div className="absolute top-3 right-3 z-20">
                        <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-black/50 backdrop-blur-sm text-white border border-white/10">
                          {chapterLabel}
                        </span>
                      </div>

                      <AnimatePresence>
                        {(isActive || hoveredBuild === build.path) && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-10">
                            <motion.div
                              initial={{ scale: 0.8 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0.8 }}
                              transition={{ type: "spring", damping: 15 }}
                              className="flex flex-col items-center">
                              {isActive ? (
                                <>
                                  <div className="w-16 h-16 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md mb-3">
                                    <HiPause className="h-8 w-8 text-white" />
                                  </div>
                                  <span className="text-sm font-medium text-white">Running</span>
                                </>
                              ) : (
                                <>
                                  <div className="w-16 h-16 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md mb-3 group-hover:bg-[#2a1e36]/70">
                                    <HiPlay className="h-8 w-8 text-white" />
                                  </div>
                                  <span className="text-sm font-medium text-white">Launch</span>
                                </>
                              )}
                            </motion.div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="p-4 relative z-20">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-white text-lg">v{build.version}</h3>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (buildState && buildState.remove) {
                              buildState.remove(build.path);
                            }
                          }}
                          className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-[#2a1e36]/50 transition-colors focus:outline-none"
                          aria-label={`Remove build ${build.version}`}>
                          <HiTrash className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="text-gray-400 text-sm truncate">{build.real}</p>

                      <button
                        className="mt-3 w-full py-2 rounded-lg bg-[#2a1e36]/70 text-white text-sm font-medium border border-[#3d2a4f]/30 hover:bg-[#3d2a4f]/70 transition-all focus:outline-none focus:ring-2 focus:ring-purple-400/30"
                        onClick={() => handlelaunchBuild(build.path, build.version)}
                        disabled={activeBuild !== null && !isActive}>
                        {isActive ? "Manage" : "Launch Game"}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </motion.main>

      {isDialogOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 15, stiffness: 300 }}
            className="bg-[#2a1e36]/40 shadow-lg backdrop-blur-sm border border-[#3d2a4f]/50 p-6 rounded-lg max-w-sm w-full mx-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 to-orange-500/20 opacity-30" />
            <button
              onClick={() => setIsDialogOpen(false)}
              className="absolute top-2 right-2 text-white hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
              <X size={24} />
            </button>
            <h2 className="text-2xl font-bold mb-4 text-white relative z-10">Close Game</h2>
            <p className="mb-6 text-white relative z-10">
              Are you sure you want to close your game?
            </p>
            <div className="flex justify-end space-x-4 relative z-10">
              <button
                className="px-4 py-2 rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-500 transition-colors duration-200"
                onClick={() => setIsDialogOpen(false)}>
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 transition-colors duration-200"
                onClick={handleCloseBuild}>
                Close Game
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      <AnimatePresence>
        {isDownloadModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative mx-4 w-full max-w-md overflow-hidden rounded-xl border border-[#3d2a4f]/50 bg-[#2a1e36]/80 p-6 shadow-xl backdrop-blur-md"
              onClick={(e) => e.stopPropagation()}>
              <div className="absolute inset-0 opacity-10">
                <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full border border-purple-300/20" />
                <div className="absolute top-40 -left-20 h-60 w-60 rounded-full border border-purple-300/20" />
                <div className="absolute -bottom-20 right-20 h-40 w-40 rounded-full border border-purple-300/10" />
              </div>

              <div className="relative z-10">
                <div className="mb-6 flex items-center">
                  <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center mr-3">
                    <Loader2 className="h-5 w-5 text-purple-400 animate-spin" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Downloading Files</h2>
                    <p className="text-sm text-gray-400">
                      {downloadProgress.completed.length}/{downloadProgress.files.length} files
                    </p>
                  </div>

                  {downloadProgress.completed.length === downloadProgress.files.length && (
                    <button
                      onClick={() => setIsDownloadModalOpen(false)}
                      className="ml-auto rounded-full p-1.5 text-gray-400 transition-colors hover:bg-[#3d2a4f]/50 hover:text-white">
                      <X className="h-5 w-5" />
                    </button>
                  )}
                </div>

                <div className="mb-5">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-purple-300">
                      {Math.round(
                        downloadProgress.files.length > 0
                          ? (downloadProgress.completed.length / downloadProgress.files.length) *
                              100
                          : 0
                      )}
                      % complete
                    </span>
                    <span className="text-xs text-gray-400">
                      {downloadProgress.completed.length} of {downloadProgress.files.length} files
                    </span>
                  </div>

                  <div className="h-2 w-full overflow-hidden rounded-full bg-[#1a1424] border border-[#3d2a4f]/20">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${
                          downloadProgress.files.length > 0
                            ? (downloadProgress.completed.length / downloadProgress.files.length) *
                              100
                            : 0
                        }%`,
                      }}
                      transition={{ type: "spring", damping: 20, stiffness: 60 }}
                      className="h-full rounded-full bg-gradient-to-r from-purple-500 to-purple-400"
                    />
                  </div>
                </div>

                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-[#3d2a4f] scrollbar-track-transparent">
                  <AnimatePresence mode="wait">
                    {downloadProgress.files.map((file, index) => {
                      const isCurrentFile =
                        !downloadProgress.completed.includes(file) &&
                        downloadProgress.files.indexOf(file) ===
                          downloadProgress.files.findIndex(
                            (f) => !downloadProgress.completed.includes(f)
                          );

                      const isCompleted = downloadProgress.completed.includes(file);
                      const fileExtension = file.split(".").pop();
                      const downloadSpeed = downloadProgress.speeds?.[file] || 0;
                      const progress = downloadProgress.progress?.[file] || 0;
                      const statusMessage = downloadProgress.messages?.[file] || "";
                      const isError = statusMessage.startsWith("Error");

                      if (!isCurrentFile && !isCompleted && !isError) return null;

                      return (
                        <motion.div
                          key={file}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          transition={{
                            enter: { duration: 0.3 },
                            exit: { duration: 0.2 },
                          }}
                          className={`flex items-center rounded-lg ${
                            isError
                              ? "bg-red-900/30 border border-red-800/30"
                              : isCompleted
                              ? "bg-[#2a1e36]/60 border border-[#3d2a4f]/20"
                              : "bg-[#2a1e36]/40 border border-[#3d2a4f]/10"
                          } p-3 transition-all`}>
                          <div className="mr-3 flex h-9 w-9 items-center justify-center rounded-lg bg-[#3d2a4f]/50 text-gray-300">
                            <FileText className="h-4 w-4" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="truncate text-sm font-medium text-gray-200">{file}</p>
                            <div className="flex flex-col">
                              <p className="text-xs text-gray-400">
                                {fileExtension?.toUpperCase()} file
                              </p>
                              {statusMessage && (
                                <p
                                  className={`text-xs mt-1 ${
                                    isError ? "text-red-400" : "text-gray-400"
                                  }`}>
                                  {statusMessage}
                                </p>
                              )}
                              {!isCompleted && !isError && (
                                <div className="mt-1.5">
                                  <div className="h-1.5 w-full bg-[#1a1424] rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full"
                                      style={{ width: `${progress}%` }}
                                    />
                                  </div>
                                  <div className="flex justify-between text-xs mt-1">
                                    <span className="text-purple-300">{Math.round(progress)}%</span>
                                    {downloadSpeed > 0 && (
                                      <span className="text-purple-300">
                                        {downloadSpeed.toFixed(1)} MB/s
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="ml-3 flex-shrink-0">
                            {isError ? (
                              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-red-900/50 text-red-400">
                                <X className="h-4 w-4" />
                              </div>
                            ) : isCompleted ? (
                              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#3d2a4f]/50 text-green-400">
                                <CheckCircle2 className="h-4 w-4" />
                              </div>
                            ) : (
                              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#3d2a4f]/50 text-purple-400">
                                <Loader2 className="h-4 w-4 animate-spin" />
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>

                {downloadProgress.completed.length === downloadProgress.files.length && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-5 flex justify-center">
                    <button
                      onClick={() => setIsDownloadModalOpen(false)}
                      className="px-5 py-2 bg-[#3d2a4f] text-white rounded-lg hover:bg-[#4d3a5f] focus:outline-none focus:ring-2 focus:ring-purple-400/50 transition-colors">
                      Continue
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <HostedBuilds
        isOpen={isBrowseBuildsModalOpen}
        onClose={() => setIsBrowseBuildsModalOpen(false)}
      />
    </div>
  );
}
