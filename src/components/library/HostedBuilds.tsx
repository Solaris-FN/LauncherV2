"use client";

import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { DownloadProgressType, HostedBuild } from "./hosted-builds/types";
import useBuildStore from "@/modules/zustand/library/useBuilds";
import {
  cancelDownload,
  downloadBuild,
  getAvailableVersions,
  getDefaultInstallDir,
  getManifestForVersion,
  selectInstallDirectory,
} from "@/lib/download/downloadBuild";
import { BackgroundParticles } from "./hosted-builds/sub/BackgroundParticles";
import { DirectorySelectionModal } from "./DirectorySelectionModal";
import { Tab } from "./hosted-builds/sub/Tab";
import { SearchBar } from "./hosted-builds/sub/SearchBar";
import { BuildCard } from "./hosted-builds/sub/BuildCard";
import { EmptyBuildList } from "./hosted-builds/sub/EmptyBuildList";
import { X } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { useDownloadStore } from "@/modules/zustand/library/useDownloadStore";

interface HostedBuildsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HostedBuilds({ isOpen, onClose }: HostedBuildsProps) {
  const [selectedCategory, setSelectedCategory] = useState("BUILDS");
  const [otherBuildsSearchQuery, setOtherBuildsSearchQuery] = useState("");
  const [hoveredBuild, setHoveredBuild] = useState<string | null>(null);
  const [defaultInstallDir, setDefaultInstallDir] = useState<string>("");
  const [selectedBuild, setSelectedBuild] = useState<HostedBuild | null>(null);
  const [manifestBuilds, setManifestBuilds] = useState<HostedBuild[]>([]);
  const builds = useBuildStore();

  const { downloadState, setDownloadState, resetDownloadState } = useDownloadStore();

  const resetDownload = useCallback(() => {
    resetDownloadState();
    setSelectedBuild(null);
  }, [resetDownloadState]);

  const fetchData = useCallback(async () => {
    if (!isOpen) return;

    try {
      const [dir, versions] = await Promise.all([getDefaultInstallDir(), getAvailableVersions()]);
      setDefaultInstallDir(dir);

      if (downloadState.status === "downloading" && downloadState.buildId) {
        const isActive = await invoke("is_download_active", {
          buildId: downloadState.buildId,
        });
        if (!isActive) resetDownload();
      }

      const newManifestBuilds = versions.map((version) => ({
        id: version,
        title: `Fortnite ${version}`,
        version,
        buildId: version,
        size: "Unknown",
        imageUrl:
          "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fi.pinimg.com%2Foriginals%2F56%2F99%2F76%2F569976a6a9b483d9bcf4da782552f7d1.jpg&f=1&nofb=1&ipt=d7a982bc35824a9ab8f7b283cef1a2699125df6c8e968218d8c8b5e3f71e6065&ipo=images",
        tags: ["Manifest"],
        useManifest: true,
      }));

      setManifestBuilds(newManifestBuilds);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
  }, [downloadState.buildId, downloadState.status, isOpen, resetDownload]);

  useEffect(() => {
    fetchData();
  }, [isOpen, downloadState, resetDownload, fetchData]);

  const handleDownload = async (build: HostedBuild) => {
    if (downloadState.status === "downloading") {
      if (downloadState.buildId) {
        await cancelDownload(downloadState.buildId);
        resetDownload();
      }
      return;
    }

    if (build.useManifest && build.version) {
      try {
        const manifest = await getManifestForVersion(build.version);
        const sizeInBytes = manifest.size;
        const sizeInGB = (sizeInBytes / (1024 * 1024 * 1024)).toFixed(2);

        build = {
          ...build,
          size: `${sizeInGB} GB`,
        };
      } catch (error) {
        console.error("Failed to fetch manifest:", error);
      }
    }

    setSelectedBuild(build);
    setDownloadState({
      buildId: build.id,
      progress: 0,
      status: "selecting_location",
      speed: "0 KB/s",
      downloaded: "0 KB",
      total: build.size,
      installDir: defaultInstallDir,
    });
  };

  const handleSelectDirectory = async () => {
    if (!selectedBuild) return;

    try {
      const selectedDir = await selectInstallDirectory(
        downloadState.installDir || defaultInstallDir
      );

      if (!selectedDir) {
        resetDownloadState();
        return;
      }

      useDownloadStore.getState().setDownloadState({
        ...useDownloadStore.getState().downloadState,
        installDir: selectedDir,
        status: "downloading",
      });

      startDownload(selectedBuild, selectedDir);
    } catch (error) {
      console.error("Error selecting directory:", error);
      resetDownloadState();
    }
  };

  const handleUseDefaultDirectory = () => {
    if (!selectedBuild || !defaultInstallDir) return;

    useDownloadStore.getState().setDownloadState({
      ...useDownloadStore.getState().downloadState,
      installDir: defaultInstallDir,
      status: "downloading",
    });

    startDownload(selectedBuild, defaultInstallDir);
  };

  const startDownload = async (build: HostedBuild, installDir: string) => {
    try {
      console.log(build);
      console.log(installDir);
      await downloadBuild(
        build.id,
        "",
        installDir,
        (progress: DownloadProgressType) => {
          useDownloadStore.getState().setDownloadState({
            ...useDownloadStore.getState().downloadState,
            progress: progress.percentage,
            speed: progress.speed,
            downloaded: progress.downloaded,
            total: progress.total,
            eta: progress.eta,
          });
        },
        undefined,
        async () => {
          const escapedPath = installDir.replace(/\\/g, "\\\\");
          const shippingPath = `${escapedPath}\\${build.id}\\FortniteGame\\Binaries\\Win64\\FortniteClient-Win64-Shipping.exe`;

          // todo for tiva - check if file exists then add it etc
        },
        handleDownloadSuccess,
        handleDownloadError,
        undefined,
        build.useManifest,
        build.version
      );
    } catch (error) {
      console.error("Failed to start download:", error);
      handleDownloadError("Failed to start download");
    }
  };

  const handleDownloadSuccess = () => {
    useDownloadStore.getState().setDownloadState({
      ...useDownloadStore.getState().downloadState,
      status: "success",
    });
    setTimeout(useDownloadStore.getState().resetDownloadState, 2000);
  };

  const handleDownloadError = (error: string) => {
    console.error("Download error:", error);
    useDownloadStore.getState().setDownloadState({
      ...useDownloadStore.getState().downloadState,
      status: "error",
    });
    setTimeout(useDownloadStore.getState().resetDownloadState, 2000);
  };

  const handleCancelDownload = async (buildId: string) => {
    try {
      await cancelDownload(buildId);
      resetDownloadState();
      setSelectedBuild(null);
    } catch (error) {
      console.error("Error canceling download:", error);
    }
  };

  const filteredBuilds = manifestBuilds.filter((build) => {
    if (otherBuildsSearchQuery) {
      return (
        build.title.toLowerCase().includes(otherBuildsSearchQuery.toLowerCase()) ||
        build.buildId.toLowerCase().includes(otherBuildsSearchQuery.toLowerCase())
      );
    }
    return true;
  });

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}>
          <BackgroundParticles />

          <AnimatePresence>
            {downloadState.status === "selecting_location" && selectedBuild && (
              <DirectorySelectionModal
                selectedBuild={selectedBuild}
                downloadState={downloadState}
                defaultInstallDir={defaultInstallDir}
                onSelectDirectory={handleSelectDirectory}
                onUseDefaultDirectory={handleUseDefaultDirectory}
                onCancel={resetDownloadState}
              />
            )}
          </AnimatePresence>

          <motion.div
            className="relative w-full max-w-4xl h-[80vh] bg-gradient-to-b from-[#1A1A2E] to-[#16162A] rounded-lg overflow-hidden border border-[#252545] shadow-2xl"
            initial={{ scale: 0.95, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 20, opacity: 0 }}
            transition={{
              type: "spring",
              damping: 25,
              stiffness: 300,
            }}>
            <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-[#3F3F60]/20 blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full bg-[#3F3F60]/20 blur-3xl pointer-events-none"></div>

            <div className="flex flex-col h-full relative z-10">
              <motion.div
                className="px-4 py-3 border-b border-[#252545] flex flex-col"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}>
                <div className="flex">
                  <Tab
                    label="BUILDS"
                    isActive={selectedCategory === "BUILDS"}
                    onClick={() => setSelectedCategory("BUILDS")}
                  />
                </div>

                <AnimatePresence>
                  {selectedCategory === "BUILDS" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="mt-3 overflow-hidden">
                      <SearchBar
                        value={otherBuildsSearchQuery}
                        onChange={setOtherBuildsSearchQuery}
                        onClear={() => setOtherBuildsSearchQuery("")}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={selectedCategory}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}>
                    {filteredBuilds.length > 0 ? (
                      <div className="space-y-3">
                        {filteredBuilds.map((build, index) => (
                          <BuildCard
                            key={build.id}
                            build={build}
                            index={index}
                            downloadState={downloadState}
                            isHovered={hoveredBuild === build.id}
                            onHover={setHoveredBuild}
                            onLeaveHover={() => setHoveredBuild(null)}
                            onDownloadClick={handleDownload}
                            onCancelDownload={handleCancelDownload}
                          />
                        ))}
                      </div>
                    ) : (
                      <EmptyBuildList />
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              <motion.div
                className="p-3 border-t border-[#252545] flex justify-end items-center bg-[#1A1A2E]"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}>
                <div className="flex items-center text-sm text-gray-400">
                  <span className="bg-[#252545] px-2 py-1 rounded-sm">
                    Total: {filteredBuilds.length} builds
                  </span>
                </div>
              </motion.div>
            </div>

            <motion.button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-white bg-[#252545] hover:bg-[#3F3F60] rounded-full transition-colors z-10"
              whileHover={{ scale: 1.1, backgroundColor: "#3F3F60" }}
              whileTap={{ scale: 0.9 }}>
              <X className="h-5 w-5" />
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
