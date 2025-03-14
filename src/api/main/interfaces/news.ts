export interface Banner {
  title: string;
  subtitle?: string;
  description: string;
  timestamp: string;

  background: {
    type: "image" | "video";
    url: string;
    overlay?: {
      color: string;
      opacity: number;
    };
  };
  theme: {
    primary: string;
    secondary: string;
    text: string;
    accent?: string;
  };

  cta: {
    text: string;
    url?: string;
    type: "download" | "external" | "internal" | "lootlabs";
  };

  id: string;
  priority: number;
  expireAt?: string;
  tags?: string[];
}

export interface NewsResponse {
  banners: Banner[];
  total: number;
  lastUpdated: string;
}
