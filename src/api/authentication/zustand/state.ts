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
    localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value));
  },
  remove: (key: string): void => {
    localStorage.removeItem(key);
  },
};

const getInitState = (): AuthData => {
  const user = storage.parse<AuthResponse["user"]>(STORAGE_CONFIG.user);
  return {
    token: storage.get(STORAGE_CONFIG.token),
    athena: storage.parse(STORAGE_CONFIG.athena),
    user,
    hype: storage.parse(STORAGE_CONFIG.hype),
    common_core: storage.parse(STORAGE_CONFIG.common_core),
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
