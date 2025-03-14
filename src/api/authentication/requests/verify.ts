import axios, { AxiosError, AxiosResponse } from "axios";
import { endpoints } from "@/api/config/endpoints";
import { Tauri } from "@/api/config/tauri";
import { ResponseOrError } from "@/api/ResponseOrError";

interface ExchangeCodeResponse {
  code: string;
  success: boolean;
}

export const checkState = async (
  access_token: string
): Promise<ResponseOrError<ExchangeCodeResponse>> => {
  const issuer =
    Tauri.Version === "0.1.0"
      ? "dev 0.1.0"
      : `Solaris-Launcher / ${Tauri.Version}`;

  const response:
    | AxiosResponse<ExchangeCodeResponse>
    | AxiosError<ExchangeCodeResponse> = await axios
    .get(endpoints.GET_ACTIVE_CHECK, {
      headers: {
        Authorization: `Bearer ${access_token}`,
        Issuer: issuer, // used to verify version and validate it
      },
    })
    .catch(() => new AxiosError<ExchangeCodeResponse>());

  if (response instanceof Error) {
    return {
      success: false,
      data: response.response?.data!,
    };
  }

  if (response.status !== 200) {
    return {
      success: false,
      data: response.data,
    };
  }

  return {
    success: true,
    data: response.data,
  };
};

export const createExchangeCode = async (
  access_token: string
): Promise<ResponseOrError<ExchangeCodeResponse>> => {
  const response:
    | AxiosResponse<ExchangeCodeResponse>
    | AxiosError<ExchangeCodeResponse> = await axios
    .get(endpoints.GET_EXCHANGE_CODE, {
      headers: {
        Authorization: `Bearer ${access_token}`,
        Issuer: `Solaris-Launcher / ${Tauri.Version}`,
      },
    })
    .catch(() => new AxiosError<ExchangeCodeResponse>());

  if (response instanceof Error) {
    return {
      success: false,
      data: response.response?.data!,
    };
  }

  if (response.status !== 200) {
    return {
      success: false,
      data: response.data,
    };
  }

  return {
    success: true,
    data: response.data,
  };
};
