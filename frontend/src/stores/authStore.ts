import { create } from "zustand";
import type { User } from "../types/auth";

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
}

interface AuthActions {
  setAuth: (token: string, user: User) => void;
  setUser: (user: User) => void;
  logout: () => void;
}

type AuthStore = AuthState & AuthActions;

const TOKEN_KEY = "teamboard_token";

export const useAuthStore = create<AuthStore>((set) => {
  const storedToken =
    typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;

  return {
    token: storedToken,
    user: null,
    isAuthenticated: storedToken !== null,

    setAuth: (token: string, user: User) => {
      localStorage.setItem(TOKEN_KEY, token);
      set({ token, user, isAuthenticated: true });
    },

    setUser: (user: User) => {
      set({ user });
    },

    logout: () => {
      localStorage.removeItem(TOKEN_KEY);
      set({ token: null, user: null, isAuthenticated: false });
    },
  };
});
