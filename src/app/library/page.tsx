"use client";

import { useEffect, useState } from "react";
import { Trash2, Plus, Loader2, X, CheckCircle2, FileText, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import useBuilds from "@/modules/zustand/library/useBuilds";
import { HiPause, HiPlay, HiPlus, HiTrash } from "react-icons/hi";
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
    <div className="flex items-center justify-center h-screen">
      <Sidebar page={{ page: "Library" }} />
      <motion.main
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="flex-grow p-8 justify-center min-h-screen">
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
                  onMouseLeave={() => setHoveredBuild(null)}>
                  <button
                    className="w-full h-full text-left focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    onClick={() => {
                      handlelaunchBuild(build.path, build.version);
                    }}
                    disabled={activeBuild !== null && !isActive}>
                    <div className="relative">
                      <img
                        src={build.splash || "/placeholder.svg"}
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
                        <span className="font-semibold text-white text-lg">{build.version}</span>
                        <span className="text-gray-400 text-sm">
                          {versionNumber <= 10.4
                            ? "Chapter 1"
                            : versionNumber <= 18.4
                              ? "Chapter 2"
                              : "Chapter 3"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 text-sm truncate">{build.real}</span>
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
                          aria-label={`Remove build ${build.version}`}>
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
          className="fixed bottom-6 right-6 flex gap-3"
          onMouseEnter={() => setIsAddHovered(true)}
          onMouseLeave={() => setIsAddHovered(false)}>
          <button
            onClick={() => handleAddBuild()}
            disabled={isLoading}
            className="flex items-center px-4 py-2 bg-[#1F2025]/40 text-white border border-white/20 rounded-md shadow-lg text-sm font-medium hover:bg-[#2F3035] transition-colors focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-[#1F2025] disabled:opacity-50 disabled:cursor-not-allowed">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Add Build
              </>
            )}
          </button>

          <button
            onClick={() => setIsBrowseBuildsModalOpen(true)}
            className="flex items-center px-4 py-2 bg-[#2a1e36]/70 text-white border border-[#3d2a4f]/50 rounded-md hover:bg-[#3d2a4f]/70 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-400/50">
            <Search className="h-4 w-4 mr-2" />
            Download
          </button>
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{
                type: "spring",
                damping: 25,
                stiffness: 300,
              }}
              className="relative mx-4 w-full max-w-md overflow-hidden rounded-xl border border-[#3d2a4f]/50 bg-[#2a1e36]/80 p-6 shadow-xl backdrop-blur-md"
              onClick={(e) => e.stopPropagation()}>
              <div className="absolute inset-0 opacity-5">
                <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full border border-purple-300/10" />
                <div className="absolute top-40 -left-20 h-60 w-60 rounded-full border border-purple-300/10" />
                <div className="absolute -bottom-20 right-20 h-40 w-40 rounded-full border border-purple-300/5" />
              </div>

              <div className="relative z-10">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-white">Downloading Files</h2>
                  {downloadProgress.completed.length === downloadProgress.files.length && (
                    <button
                      onClick={() => setIsDownloadModalOpen(false)}
                      className="rounded-full p-1 text-gray-400 transition-colors hover:bg-[#3d2a4f]/50 hover:text-white">
                      <X className="h-5 w-5" />
                    </button>
                  )}
                </div>

                <div className="mb-5">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm text-gray-300">
                      {downloadProgress.completed.length}/{downloadProgress.files.length} files
                    </span>
                    <span className="text-xs text-gray-400">
                      {Math.round(
                        downloadProgress.files.length > 0
                          ? (downloadProgress.completed.length / downloadProgress.files.length) *
                          100
                          : 0
                      )}
                      % complete
                    </span>
                  </div>

                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#1a1424]">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${downloadProgress.files.length > 0
                          ? (downloadProgress.completed.length / downloadProgress.files.length) *
                          100
                          : 0
                          }%`,
                      }}
                      transition={{ type: "spring", damping: 20, stiffness: 60 }}
                      className="h-full rounded-full bg-purple-500"
                    />
                  </div>
                </div>

                <div className="rounded-lg bg-[#1a1424]/50 p-2">
                  <AnimatePresence mode="wait">
                    {downloadProgress.files.map((file) => {
                      const isCurrentFile =
                        !downloadProgress.completed.includes(file) &&
                        downloadProgress.files.indexOf(file) ===
                        downloadProgress.files.findIndex(
                          (f) => !downloadProgress.completed.includes(f)
                        );

                      const isLastCompleted =
                        downloadProgress.completed.length === downloadProgress.files.length &&
                        file === downloadProgress.files[downloadProgress.files.length - 1];

                      if (!isCurrentFile && !isLastCompleted) return null;

                      const isCompleted = downloadProgress.completed.includes(file);
                      const fileExtension = file.split(".").pop();
                      const downloadSpeed = downloadProgress.speeds?.[file] || 0;
                      const progress = downloadProgress.progress?.[file] || 0;
                      const statusMessage = downloadProgress.messages?.[file] || "";
                      const isError = statusMessage.startsWith("Error");

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
                          className={`flex items-center rounded-lg ${isError
                            ? "bg-red-900/30"
                            : isCompleted
                              ? "bg-[#2a1e36]/80"
                              : "bg-[#2a1e36]/40"
                            } p-2.5 transition-colors`}>
                          <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-md bg-[#3d2a4f]/50 text-gray-300">
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
                                  className={`text-xs mt-1 ${isError ? "text-red-400" : "text-gray-400"
                                    }`}>
                                  {statusMessage}
                                </p>
                              )}
                              {!isCompleted && (
                                <div className="mt-1">
                                  <div className="h-1 w-full bg-[#1a1424] rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-purple-400/80 rounded-full"
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
                              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-900/50 text-red-400">
                                <X className="h-3.5 w-3.5" />
                              </div>
                            ) : isCompleted ? (
                              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#3d2a4f]/50 text-green-400">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              </div>
                            ) : (
                              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#3d2a4f]/50 text-purple-400">
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}

                    {downloadProgress.completed.length === downloadProgress.files.length && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-3 text-center text-sm text-green-400">
                        All downloads completed!
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
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
