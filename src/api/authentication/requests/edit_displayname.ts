import axios, { AxiosError, AxiosResponse } from "axios";
import { endpoints } from "@/api/config/endpoints";
import { ResponseOrError } from "@/api/ResponseOrError";
import { Tauri } from "@/api/config/tauri";

export const generateEditDisplayResponse = async (
  code: string,
  name: string
): Promise<ResponseOrError<boolean>> => {
  const issuer = Tauri.Version === "0.1.0" ? "dev 0.1.0" : `Solaris-Launcher / ${Tauri.Version}`;

  const response: AxiosResponse<boolean> | AxiosError<boolean> = await axios
    .post(
      endpoints.POST_EDIT_DISPLAYNAME,
      {
        NewDisplayName: name,
      },
      {
        headers: {
          Authorization: `Bearer ${code}`,
          Issuer: issuer, // used to verify version and validate it
        },
      }
    )
    .catch(() => new AxiosError<boolean>());

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
