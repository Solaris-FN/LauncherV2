import axios, { AxiosError } from "axios";
import { endpoints } from "@/api/config/endpoints";
import { NewsResponse } from "../interfaces/news";
import { ResponseOrError } from "@/api/ResponseOrError";
import { Tauri } from "@/api/config/tauri";

interface APIBanner {
  bannerId: string;
  title: string;
  subtitle: string | null;
  description: string;
  backgroundType: "image" | "video";
  backgroundUrl: string;
  overlayColor: string;
  overlayOpacity: number;
  themePrimary: string;
  themeSecondary: string;
  themeText: string;
  themeAccent: string | null;
  ctaText: string;
  ctaUrl: string;
  ctaType: "download" | "external" | "internal";
  isPremium: boolean;
  priority: number;
  expireAt: string | null;
  tags: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string | null;
  id: number;
}

const transformBannerData = (apiResponse: APIBanner[]): NewsResponse => {
  const transformedBanners = apiResponse.map((banner) => ({
    id: banner.bannerId,
    title: banner.title,
    subtitle: banner.subtitle || undefined,
    description: banner.description,
    timestamp: new Date(banner.createdAt).toLocaleDateString(),
    background: {
      type: banner.backgroundType,
      url: banner.backgroundUrl,
      overlay: {
        color: banner.overlayColor,
        opacity: banner.overlayOpacity,
      },
    },
    theme: {
      primary: banner.themePrimary,
      secondary: banner.themeSecondary,
      text: banner.themeText,
      accent: banner.themeAccent || undefined,
    },
    cta: {
      text: banner.ctaText,
      url: banner.ctaUrl,
      type: banner.ctaType,
    },
    priority: banner.priority,
    expireAt: banner.expireAt || undefined,
    tags: banner.tags ? banner.tags.split(",") : [],
  }));

  return {
    banners: transformedBanners,
    total: transformedBanners.length,
    lastUpdated: new Date().toISOString(),
  };
};

export const generateNewsResponse = async (): Promise<
  ResponseOrError<NewsResponse>
> => {
  try {
    const response = await axios.get<APIBanner[]>(endpoints.GET_LAUNCHER_NEWS, {
      headers: {
        Issuer: `Solaris-Launcher / ${Tauri.Version}`,
      },
    });

    return {
      success: true,
      data: transformBannerData(response.data),
    };
  } catch (error) {
    return {
      success: false,
      data: {
        banners: [],
        total: 0,
        lastUpdated: new Date().toISOString(),
      },
    };
  }
};
