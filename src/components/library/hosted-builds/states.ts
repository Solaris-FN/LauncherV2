import { DownloadState } from "./types";

export const INITIAL_DOWNLOAD_STATE: DownloadState = {
  buildId: null,
  progress: 0,
  status: "idle",
  speed: "0 KB/s",
  downloaded: "0 KB",
  total: "0 KB",
};
