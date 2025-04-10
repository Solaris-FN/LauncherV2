import { NextResponse } from "next/server";
import axios, { AxiosError, type AxiosResponse } from "axios";
import { endpoints } from "@/api/config/endpoints";
import { ResponseOrError } from "@/api/ResponseOrError";
interface AuthResponse {
  Refresh: string;
  Storefront: {
    Entries: {
      category: string;
      image: string;
      name: string;
      offerId: string;
      price: number;
      rarity: string;
      templateId: string;
    }[];
    name: string;
  }[];
}

export const getStorefront = async (): Promise<ResponseOrError<AuthResponse>> => {
  const response: AxiosResponse<any> | AxiosError<any> = await axios
    .get(endpoints.GET_LAUNCHER_SHOP, {})
    .catch(() => new AxiosError<any>());
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
