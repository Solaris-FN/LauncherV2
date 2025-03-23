import { invoke } from "@tauri-apps/api/core";
import { handleAddBuild as addbuild } from "@/modules/next/library/addbuild";

export const handleLaunchBuild = async (
  path: string,
  version: string,
  activeBuild: string,
  setActiveBuild: Function,
  setIsDialogOpen: Function
) => {
  if (activeBuild === path) {
    setIsDialogOpen(true);
  } else {
    setActiveBuild(path);
    //   await launchBuild(path, version);
  }
};

export const handleAddBuild = async (setIsLoading: Function) => {
  setIsLoading(true);
  const newBuild = await addbuild();
  if (newBuild) {
    setIsLoading(false);
  }
};

export const handleCloseBuild = async (
  setActiveBuild: Function,
  setIsDialogOpen: Function
) => {
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
        isOpen.replace(
          "\\FortniteGame\\Binaries\\Win64\\FortniteClient-Win64-Shipping.exe",
          ""
        )
      );
    }
  }
};
