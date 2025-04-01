import { invoke } from "@tauri-apps/api/core";
import { sendNotification } from "@tauri-apps/plugin-notification";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import useAuth from "@/api/authentication/zustand/state";
import useBuilds from "@/modules/zustand/library/useBuilds";
import { createExchangeCode } from "@/api/authentication/requests/verify";
import { generateFilesResponse } from "@/api/main/requests/files";
import { listen } from "@tauri-apps/api/event";

const appWindow = getCurrentWebviewWindow();

export const launchBuild = async (selectedPath: string, version: string) => {
  const authState = useAuth.getState();
  const buildstate = useBuilds.getState();

  const path = selectedPath.replace("/", "\\");
  const access_token = authState.token;

  if (!access_token) {
    sendNotification({
      title: "Solaris",
      body: "You are not authenticated!",
      sound: "ms-winsoundevent:Notification.Default",
    });
    return false;
  }

  const exists = (await invoke("check_game_exists", { path }).catch(() => false)) as boolean;
  if (!exists) {
    sendNotification({
      title: "Solaris",
      body: "Game does not exist!",
      sound: "ms-winsoundevent:Notification.Default",
    });
    return false;
  }

  try {
    const exchangeCodeReq = await createExchangeCode(access_token);
    if (!exchangeCodeReq.success) {
      sendNotification({
        title: "Solaris",
        body: "Failed to authenticate with Solaris!",
        sound: "ms-winsoundevent:Notification.Default",
      });
      return false;
    }

    sendNotification({
      title: `Starting ${version}`,
      body: `This may take a while so please wait while the game loads!`,
      sound: "ms-winsoundevent:Notification.Default",
    });

    await invoke("experience", {
      folderPath: path,
      exchangeCode: exchangeCodeReq?.data?.code,
      isDev: false,
      eor: buildstate.EorEnabled,
      dpe: buildstate.DisablePreEdits,
      version,
    });

    appWindow.minimize();

    return true;
  } catch (error) {
    console.error("Error during launchBuild:", error);
    return false;
  }
};

export async function getFilesToProcess(version: string) {
  return (await generateFilesResponse(useAuth.getState().token)).data;
}

export async function processFilesWithProgress(
  path: string,
  version: string,
  files: { Name: string; Size: number; Url: string }[],
  setDownloadProgress: Function,
  setIsDownloadModalOpen: Function
) {
  const completedFiles: string[] = [];
  const fileNames = files.map((f) => f.Name);
  const downloadSpeeds: Record<string, number> = {};
  const statusMessages: Record<string, string> = {};
  const downloadProgress: Record<string, number> = {};

  setDownloadProgress({
    files: fileNames,
    completed: [],
    speeds: downloadSpeeds,
    progress: downloadProgress,
    messages: statusMessages,
  });

  setIsDownloadModalOpen(true);

  const unlistenProgress = await listen("download-progress", (event) => {
    const { filename, progress, speed, message } = event.payload as {
      filename: string;
      progress: number;
      speed: number;
      message?: string;
    };

    downloadSpeeds[filename] = speed;
    downloadProgress[filename] = progress;

    if (message) {
      statusMessages[filename] = message;
    }

    console.log(`Downloading ${filename}: ${progress}% (${speed.toFixed(2)} MB/s)`);

    setDownloadProgress((prev: any) => ({
      ...prev,
      speeds: { ...downloadSpeeds },
      messages: { ...statusMessages },
      progress: { ...downloadProgress },
    }));
  });

  const unlistenCompleted = await listen("download-completed", (event) => {
    const { filename } = event.payload as { filename: string };
    console.log(`Download completed for ${filename}`);

    if (!completedFiles.includes(filename)) {
      completedFiles.push(filename);
    }

    downloadSpeeds[filename] = 0;
    downloadProgress[filename] = 100;
    statusMessages[filename] = "Download complete";

    setDownloadProgress((prev: any) => ({
      ...prev,
      completed: [...completedFiles],
      speeds: { ...downloadSpeeds },
      messages: { ...statusMessages },
      progress: { ...downloadProgress },
    }));
  });

  const queue = [...files];
  const failed: Array<{ file: (typeof files)[0]; error: string }> = [];

  while (queue.length > 0) {
    const file = queue.shift();
    if (!file) continue;

    console.log(`Processing: ${file.Name}`);
    const downloadPath =
      file.Name.includes(".pak") || file.Name.includes(".sig")
        ? `${path}\\FortniteGame\\Content\\Paks\\`
        : `${path}\\`;

    try {
      const exists = await invoke("check_file_exists_and_size", {
        path: `${downloadPath}${file.Name}`,
        size: file.Size,
      });

      if (!exists || [".cer", ".bin"].some((ext) => file.Name.includes(ext))) {
        statusMessages[file.Name] = "Downloading...";
        setDownloadProgress((prev: any) => ({
          ...prev,
          messages: { ...statusMessages },
        }));

        await invoke("download_game_file", {
          url: file.Url,
          dest: `${downloadPath}${file.Name}`,
        });
      } else {
        if (!completedFiles.includes(file.Name)) {
          completedFiles.push(file.Name);
          statusMessages[file.Name] = "Already downloaded";
          setDownloadProgress((prev: any) => ({
            ...prev,
            completed: [...completedFiles],
            messages: { ...statusMessages },
          }));
        }
      }
    } catch (error) {
      console.error(`Error processing file ${file.Name}:`, error);
      statusMessages[file.Name] = `Error: ${error}`;

      failed.push({ file, error: String(error) });

      if (!completedFiles.includes(file.Name)) {
        completedFiles.push(file.Name);
        setDownloadProgress((prev: any) => ({
          ...prev,
          completed: [...completedFiles],
          messages: { ...statusMessages },
        }));
      }
    }
  }

  await unlistenProgress();
  await unlistenCompleted();

  return {
    completed: completedFiles,
    failed,
  };
}

export const processFiles = async (version: string) => {
  const files: { name: string; path: string; size: number; url: string }[] = [];

  if (Number(version) == 9.1) {
    const downloadTasks = files.map(async (file) => {
      console.log(file.name);
      const downloadPath = `${file.path}\\`;

      const exists = await invoke("check_file_exists", {
        path: `${downloadPath}${file.name}`,
        size: file.size,
      });
      if (!exists) {
        await invoke("download_game_file", {
          url: file.url,
          dest: `${downloadPath}${file.name}`,
        });
      }

      if (exists && [".cer", ".bin"].some((ext) => file.name.includes(ext))) {
        await invoke("download_game_file", {
          url: file.url,
          dest: `${downloadPath}${file.name}`,
        });
      }
    });

    await Promise.allSettled(downloadTasks);
  }
};
