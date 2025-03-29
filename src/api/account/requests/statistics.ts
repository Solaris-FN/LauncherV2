import axios, { AxiosError, AxiosResponse } from "axios";
import { endpoints } from "@/api/config/endpoints";
import { Tauri } from "@/api/config/tauri";
import { ResponseOrError } from "@/api/ResponseOrError";
import { StatisticsResponse } from "../interfaces/StatisticsResponse";

export const generateStatisticsResponse = async (
  access_token: string
): Promise<ResponseOrError<StatisticsResponse>> => {
  const issuer = Tauri.Version === "0.1.0" ? "dev 0.1.0" : `Solaris-Launcher / ${Tauri.Version}`;

  const response: AxiosResponse<StatisticsResponse> | AxiosError<StatisticsResponse> = await axios
    .get(endpoints.GET_ACCOUNT_STATISTICS_RESP, {
      headers: {
        Authorization: `Bearer ${access_token}`,
        Issuer: issuer, // used to verify version and validate it
      },
    })
    .catch(() => new AxiosError<StatisticsResponse>());

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

  const parsedData = {
    ...response.data,
    Solos:
      typeof response.data.Solos === "string"
        ? JSON.parse(response.data.Solos)
        : response.data.Solos,
    Duos:
      typeof response.data.Duos === "string" ? JSON.parse(response.data.Duos) : response.data.Duos,
    Squads:
      typeof response.data.Squads === "string"
        ? JSON.parse(response.data.Squads)
        : response.data.Squads,
  };

  return {
    success: true,
    data: parsedData,
  };
};
