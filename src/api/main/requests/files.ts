import axios from "axios";
import { endpoints } from "@/api/config/endpoints";
import { ResponseOrError } from "@/api/ResponseOrError";
import { Tauri } from "@/api/config/tauri";

export const generateFilesResponse = async (code: string): Promise<ResponseOrError<any>> => {
  const issuer = Tauri.Version === "0.1.0" ? "dev 0.1.0" : `Solaris-Launcher / ${Tauri.Version}`;

  const response = await axios
    .get(endpoints.GET_LAUNCHER_FILES, {
      headers: {
        Authorization: `Bearer ${code}`,
        Issuer: issuer,
      },
    })
    .catch();
  if (response instanceof Error) {
    return {
      success: false,
      data: response?.data!,
    };
  }

  return {
    success: true,
    data: response.data,
  };
};
