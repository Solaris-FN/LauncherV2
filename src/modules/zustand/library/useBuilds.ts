import { create } from "zustand";

export interface IBuild {
  splash: string;
  real: string;
  version: string;
  verified: boolean;
  path: string;
  loading: boolean;
  open: boolean;
}

interface BuildsState {
  downloadPath: string;
  builds: Map<string, IBuild>;
  fetchedOnce: boolean;
  isLoading: boolean;
  error: string | null;
  EorEnabled: boolean;
  DisablePreEdits: boolean;
  FileCheck: boolean;
  BubbleBuilds: boolean;
  setDownloadPath: (path: string) => void;
  add: (path: string, build: IBuild) => void;
  remove: (path: string) => void;
  clear: () => void;
  setEorEnabled: (enabled: boolean) => void;
  setDisablePreEdits: (enabled: boolean) => void;
  setFileCheck: (enabled: boolean) => void;
  setBubbleBuilds: (enabled: boolean) => void;
}

const useBuilds = create<BuildsState>((set, get) => ({
  downloadPath:
    typeof window !== "undefined"
      ? localStorage.getItem("download_path") || ""
      : "",
  builds:
    typeof window !== "undefined"
      ? new Map(
        Object.entries(JSON.parse(localStorage.getItem("builds") || "{}"))
      )
      : new Map(),
  availableBuilds: [],
  fetchedOnce: false,
  isLoading: false,
  error: null,
  BubbleBuilds:
    typeof window !== "undefined"
      ? localStorage.getItem("BubbleBuilds") === "true"
      : false,
  FileCheck: typeof window !== "undefined"
    ? localStorage.getItem("file_check") === "true"
    : false,
  EorEnabled:
    typeof window !== "undefined"
      ? localStorage.getItem("Eor_enabled") === "true"
      : false,
  DisablePreEdits:
    typeof window !== "undefined"
      ? localStorage.getItem("DisablePreEdits") === "true"
      : false,

  setDownloadPath: (path) => {
    if (typeof window === "undefined") return;
    localStorage.setItem("download_path", path);
    set({ downloadPath: path });
  },

  add: (path, build) => {
    if (typeof window === "undefined") return;
    const builds = get().builds;
    builds.set(path, build);
    localStorage.setItem("builds", JSON.stringify(Object.fromEntries(builds)));
    set({ builds: new Map(builds) });
  },

  remove: (path) => {
    if (typeof window === "undefined") return;
    const builds = get().builds;
    builds.delete(path);
    localStorage.setItem("builds", JSON.stringify(Object.fromEntries(builds)));
    set({ builds: new Map(builds) });
  },

  clear: () => {
    if (typeof window === "undefined") return;
    localStorage.removeItem("builds");
    set({ builds: new Map() });
  },

  setEorEnabled: (enabled) => {
    if (typeof window === "undefined") return;
    localStorage.setItem("Eor_enabled", enabled.toString());
    set({ EorEnabled: enabled });
  },

  setDisablePreEdits: (enabled) => {
    if (typeof window === "undefined") return;
    localStorage.setItem("DisablePreEdits", enabled.toString());
    set({ DisablePreEdits: enabled });
  },

  setFileCheck: (enabled) => {
    if (typeof window === "undefined") return;
    localStorage.setItem("file_check", enabled.toString());
    set({ FileCheck: enabled });
  },

  setBubbleBuilds: (enabled) => {
    if (typeof window === "undefined") return;
    localStorage.setItem("BubbleBuilds", enabled.toString());
    set({ BubbleBuilds: enabled });
  },
}));

export default useBuilds;
