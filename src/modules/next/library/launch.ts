import { invoke } from "@tauri-apps/api/core";
import { sendNotification } from "@tauri-apps/plugin-notification";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import useAuth from "@/api/authentication/zustand/state";
import useBuilds from "@/modules/zustand/library/useBuilds";
import { createExchangeCode } from "@/api/authentication/requests/verify";

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
  if (Number(version) === 9.1) {
    return [
      {
        name: "FortniteGame/Content/Paks/pakchunk0-WindowsClient.pak",
        path: version,
        size: 1000000,
        url: "https://example.com/pakchunk0-WindowsClient.pak",
      },
      {
        name: "FortniteGame/Binaries/Win64/FortniteClient-Win64-Shipping.exe",
        path: version,
        size: 500000,
        url: "https://example.com/FortniteClient-Win64-Shipping.exe",
      },
      {
        name: "FortniteGame/Content/Paks/pakchunk1-WindowsClient.pak",
        path: version,
        size: 1500000,
        url: "https://example.com/pakchunk1-WindowsClient.pak",
      },
    ];
  }

  return [];
}

export async function processFilesWithProgress(
  path: string,
  version: string,
  files: { name: string; size: number; url: string }[],
  setDownloadProgress: Function
) {
  const completedFiles: string[] = [];

  const downloadTasks = files.map(async (file) => {
    console.log(`Processing: ${file.name}`);
    const downloadPath = `${path}\\`;

    try {
      const exists = await invoke("check_file_exists", {
        path: `${downloadPath}${file.name}`,
        size: file.size,
      });

      if (!exists || [".cer", ".bin"].some((ext) => file.name.includes(ext))) {
        await invoke("download_game_file", {
          url: file.url,
          dest: `${downloadPath}${file.name}`,
        });
      }

      completedFiles.push(file.name);

      setDownloadProgress({
        files: files.map((f) => f.name),
        completed: [...completedFiles],
      });
    } catch (error) {
      console.error(`Error processing file ${file.name}:`, error);
      completedFiles.push(file.name);
      setDownloadProgress({
        files: files.map((f) => f.name),
        completed: [...completedFiles],
      });
    }
  });

  await Promise.allSettled(downloadTasks);
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
