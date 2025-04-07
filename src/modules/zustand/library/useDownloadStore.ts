import { create } from "zustand";
import { persist } from "zustand/middleware";
import { INITIAL_DOWNLOAD_STATE } from "@/components/library/hosted-builds/states";
import { DownloadState } from "@/components/library/hosted-builds/types";

interface DownloadStore {
  downloadState: DownloadState;
  setDownloadState: (state: DownloadState) => void;
  resetDownloadState: () => void;
}

export const useDownloadStore = create<DownloadStore>()(
  persist(
    (set) => ({
      downloadState: INITIAL_DOWNLOAD_STATE,
      setDownloadState: (downloadState) => set({ downloadState }),
      resetDownloadState: () => set({ downloadState: INITIAL_DOWNLOAD_STATE }),
    }),
    {
      name: "download-storage",
    }
  )
);
