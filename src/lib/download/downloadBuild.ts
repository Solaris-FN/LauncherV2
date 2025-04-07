import { appDataDir } from "@tauri-apps/api/path";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";

export interface DownloadProgress {
  percentage: number;
  speed: string;
  downloaded: string;
  total: string;
  eta: string;
}

export interface ExtractionProgress {
  percentage: number;
  currentFile: string;
  totalFiles: number;
  processedFiles: number;
  eta: string;
}

export interface ManifestFile {
  name: string;
  chunks: unknown[];
  size: number;
}

export type DownloadProgressCallback = (progress: DownloadProgress) => void;
export type ExtractionProgressCallback = (progress: ExtractionProgress) => void;
export type DownloadCompleteCallback = () => void;
export type ExtractionCompleteCallback = () => void;
export type DownloadErrorCallback = (error: string) => void;
export type ExtractionErrorCallback = (error: string) => void;

interface TauriDownloadProgress {
  build_id: string;
  percentage: number;
  downloaded_bytes: number;
  total_bytes: number;
  speed: number;
  eta: string;
}

function formatBytes(bytes: number): string {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

function formatSpeed(bytesPerSecond: number): string {
  const units = ["B/s", "KB/s", "MB/s", "GB/s", "TB/s"];
  let speed = bytesPerSecond;
  let unitIndex = 0;

  while (speed >= 1024 && unitIndex < units.length - 1) {
    speed /= 1024;
    unitIndex++;
  }

  return `${speed.toFixed(2)} ${units[unitIndex]}`;
}

export async function getDefaultInstallDir(): Promise<string> {
  try {
    return await invoke<string>("get_default_install_dir");
  } catch (error) {
    console.error("Error getting default install directory:", error);
    const appData = await appDataDir();
    return `${appData}downloads`;
  }
}

export async function selectInstallDirectory(defaultPath?: string): Promise<string | null> {
  try {
    const selected = await open({
      directory: true,
      multiple: false,
      defaultPath,
    });

    if (Array.isArray(selected) || selected === null) {
      return null;
    }

    return selected;
  } catch (error) {
    console.error("Error opening directory selection dialog:", error);
    return null;
  }
}

export async function getAvailableVersions(): Promise<string[]> {
  try {
    return await invoke<string[]>("get_available_versions");
  } catch (error) {
    console.error("Error fetching available versions:", error);
    return [];
  }
}

export async function getManifestForVersion(version: string): Promise<ManifestFile> {
  try {
    return await invoke<ManifestFile>("get_manifest_for_version", { version });
  } catch (error) {
    console.error("Error fetching manifest:", error);
    throw error;
  }
}

export async function downloadBuild(
  buildId: string,
  url: string,
  installDir: string,
  onProgress?: DownloadProgressCallback,
  onExtractionProgress?: ExtractionProgressCallback,
  onComplete?: DownloadCompleteCallback,
  onExtractionComplete?: ExtractionCompleteCallback,
  onError?: DownloadErrorCallback,
  onExtractionError?: ExtractionErrorCallback,
  useManifest?: boolean,
  version?: string
): Promise<boolean> {
  try {
    const isActive = await invoke<boolean>("is_download_active", { buildId });
    if (isActive) {
      if (onError) onError("Download already in progress");
      return false;
    }
    const destination = useManifest
      ? `${installDir}/${buildId}`
      : `${installDir}/${buildId}.${url.split(".").pop()}`;

    const unlistenDownloadProgress = await listen<TauriDownloadProgress>(
      "download:progress",
      (event) => {
        if (event.payload.build_id === buildId && onProgress) {
          onProgress({
            percentage: Math.round(event.payload.percentage),
            speed: formatSpeed(event.payload.speed),
            downloaded: formatBytes(event.payload.downloaded_bytes),
            total: formatBytes(event.payload.total_bytes),
            eta: event.payload.eta,
          });
        }
      }
    );

    const unlistenDownloadComplete = await listen<string>("download:completed", (event) => {
      if (event.payload === buildId) {
        if (onComplete) onComplete();

        if (useManifest && onExtractionComplete) {
          onExtractionComplete();
        }
      }
    });

    const unlistenDownloadError = await listen<string>("download:failed", (event) => {
      if (event.payload === buildId) {
        unlistenDownloadProgress();
        unlistenDownloadComplete();
        unlistenDownloadError();
        if (onError) onError("Download failed");
      }
    });

    try {
      await invoke("download_build", {
        request: {
          build_id: buildId,
          url,
          destination,
          extract: false,
          delete_after_extract: false,
          use_manifest: useManifest,
          version: version,
        },
      });
    } catch (error) {
      unlistenDownloadProgress();
      unlistenDownloadComplete();
      unlistenDownloadError();

      if (onError) onError(error instanceof Error ? error.message : String(error));
      return false;
    }

    return true;
  } catch (error) {
    if (onError) onError(error instanceof Error ? error.message : String(error));
    return false;
  }
}

export async function cancelDownload(buildId: string): Promise<boolean> {
  try {
    return await invoke<boolean>("cancel_download", { buildId });
  } catch (error) {
    console.error("Error canceling download:", error);
    return false;
  }
}

export async function cancelExtraction(buildId: string): Promise<boolean> {
  try {
    return await invoke<boolean>("cancel_extraction", { buildId });
  } catch (error) {
    console.error("Error canceling extraction:", error);
    return false;
  }
}
