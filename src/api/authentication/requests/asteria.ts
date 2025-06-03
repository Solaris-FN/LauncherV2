import axios, { AxiosError, AxiosResponse } from "axios";
import { endpoints } from "@/api/config/endpoints";
import { ResponseOrError } from "@/api/ResponseOrError";
import { Tauri } from "@/api/config/tauri";

export const generateAsteriaToken = async (): Promise<ResponseOrError<string>> => {
  const issuer = Tauri.Version === "0.1.0" ? "dev 0.1.0" : `Solaris-Launcher / ${Tauri.Version}`;

  const response: AxiosResponse<string> | AxiosError<string> = await axios
    .get(endpoints.GET_ASTERIA_TOKEN, {
      headers: {
        Issuer: issuer, // used to verify version and validate it
      },
    })
    .catch(() => new AxiosError<string>());

  if (response instanceof Error) {
    return {
      success: false,
      data: response.response?.data!,
    };
  }

  return {
    success: true,
    data: response.data,
  };
};
