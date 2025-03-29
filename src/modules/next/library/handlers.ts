import { invoke } from "@tauri-apps/api/core";
import { handleAddBuild as addbuild } from "@/modules/next/library/addbuild";
import { getFilesToProcess, launchBuild, processFiles, processFilesWithProgress } from "./launch";

export const handleLaunchBuild = async (
  path: string,
  version: string,
  activeBuild: string,
  setActiveBuild: Function,
  setIsDialogOpen: Function,
  setDownloadProgress: Function,
  setIsDownloadModalOpen: Function
) => {
  if (activeBuild === path) {
    setIsDialogOpen(true);
  } else {
    try {
      const filesToProcess = await getFilesToProcess(version);

      if (filesToProcess.length > 0) {
        setDownloadProgress({
          files: filesToProcess.map((f: any) => f.Name),
          completed: [],
        });

        await processFilesWithProgress(
          path,
          version,
          filesToProcess,
          setDownloadProgress,
          setIsDownloadModalOpen
        );
      } else {
        await processFiles(version);
      }

      setIsDownloadModalOpen(false);

      setActiveBuild(path);
      await launchBuild(path, version);
    } catch (error) {
      console.error("Error during build launch:", error);
      setIsDownloadModalOpen(false);
    }
  }
};

export const handleAddBuild = async (setIsLoading: Function) => {
  setIsLoading(true);
  const newBuild = await addbuild();
  if (newBuild) {
    setIsLoading(false);
  }
};

export const handleCloseBuild = async (setActiveBuild: Function, setIsDialogOpen: Function) => {
  const exit = await invoke("exit_all");
  if (exit) {
    setActiveBuild(null);
    setIsDialogOpen(false);
  }
};

export const checkifopen = async (setActiveBuild: Function) => {
  const isOpen = await invoke("get_fortnite_processid");
  if (isOpen) {
    if (typeof isOpen === "string") {
      setActiveBuild(
        isOpen.replace("\\FortniteGame\\Binaries\\Win64\\FortniteClient-Win64-Shipping.exe", "")
      );
    }
  }
};
