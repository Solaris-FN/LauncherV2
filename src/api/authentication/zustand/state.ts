import { create } from "zustand";
import { AuthResponse } from "@/api/authentication/interfaces/AuthResponse";
import { generateAccountResponse } from "@/api/authentication/requests/account";
import { checkState } from "@/api/authentication/requests/verify";

interface Storage {
  key: string;
  defaultValue: string;
}

interface AuthData {
  token: string;
  user: AuthResponse["user"] | null;
  hype: AuthResponse["hype"] | null;
  athena: AuthResponse["athena"] | null;
  common_core: AuthResponse["common_core"] | null;
  rolecolor?: string;
}

interface AuthActions {
  login: (code: string) => Promise<boolean>;
  logout: () => void;
  verify: () => Promise<boolean>;
  setUser: (user: AuthResponse["user"]) => void;
  setLogOut: () => void;
}

type AuthState = AuthData & AuthActions;

const STORAGE_CONFIG = {
  token: { key: "auth.token", defaultValue: "" },
  athena: { key: "auth.athena", defaultValue: "" },
  user: { key: "auth.user", defaultValue: "" },
  hype: { key: "auth.hype", defaultValue: "" },
  common_core: { key: "auth.common_core", defaultValue: "" },
} as const;

const storage = {
  get: ({ key, defaultValue }: Storage): string => {
    if (typeof window === "undefined") return defaultValue;
    return localStorage.getItem(key) || defaultValue;
  },
  parse: <T>(config: Storage): T | null => {
    try {
      return JSON.parse(storage.get(config)) as T;
    } catch {
      return null;
    }
  },
  set: (key: string, value: unknown): void => {
    localStorage.setItem(
      key,
      typeof value === "string" ? value : JSON.stringify(value)
    );
  },
  remove: (key: string): void => {
    localStorage.removeItem(key);
  },
};

const roleColors = {
  0: "#99aab5", // member
  1: "#2ecc71", // server booster
  2: "#1abc9c", // gold
  3: "#ad1457", // diamond
  4: "#e74c3c", // platinum
  5: "#ca9d47", // support
  6: "#3498db", // staff
  7: "#136292", // head mod
  8: "#136292", // manager
  9: "#29a088", // developer
  10: "#1a3bd1", // co owner
  11: "#999bf8", // owner
};

const getInitState = (): AuthData => {
  const user = storage.parse<AuthResponse["user"]>(STORAGE_CONFIG.user);
  return {
    token: storage.get(STORAGE_CONFIG.token),
    athena: storage.parse(STORAGE_CONFIG.athena),
    user,
    hype: storage.parse(STORAGE_CONFIG.hype),
    common_core: storage.parse(STORAGE_CONFIG.common_core),
    rolecolor: user
      ? roleColors[user.role as unknown as keyof typeof roleColors]
      : "",
  };
};

const useAuth = create<AuthState>((set, get) => ({
  ...getInitState(),
  login: async (code: string): Promise<boolean> => {
    const response = await generateAccountResponse(code);
    if (!response.success) return false;

    const { user, athena, common_core } = response.data;

    storage.set(STORAGE_CONFIG.token.key, code);
    storage.set(STORAGE_CONFIG.athena.key, athena);
    storage.set(STORAGE_CONFIG.user.key, user);
    storage.set(STORAGE_CONFIG.common_core.key, common_core);
    storage.set(STORAGE_CONFIG.hype.key, response.data.hype);

    set({
      token: code,
      athena,
      user,
      common_core,
    });

    return true;
  },

  logout: () => {
    try {
      Object.values(STORAGE_CONFIG).forEach(({ key }) => storage.remove(key));
      set({
        token: STORAGE_CONFIG.token.defaultValue,
        athena: null,
        user: null,
        common_core: null,
      });
    } catch (error) {
      console.error("Error during logout:", error);
    }
  },

  verify: async (): Promise<boolean> => {
    const response = await checkState(get().token);
    if (!response.success) {
      get().logout();
      return false;
    }
    return get().login(get().token);
  },

  setUser: (user: AuthResponse["user"]): void => {
    localStorage.setItem(STORAGE_CONFIG.user.key, JSON.stringify(user));
    set({ user });
  },

  setLogOut: (): void => {
    set({ token: "" });
  },
}));

export default useAuth;
