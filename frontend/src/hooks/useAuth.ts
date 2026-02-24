import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuthStore } from "../stores/authStore";
import * as authApi from "../api/auth";
import type { LoginRequest } from "../types/auth";

export function useAuth() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { token, user, isAuthenticated, setAuth, setUser, logout: storeLogout } = useAuthStore();

  const meQuery = useQuery({
    queryKey: ["auth", "me"],
    queryFn: authApi.getMe,
    enabled: token !== null,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (meQuery.data && token) {
      setUser(meQuery.data);
    }
  }, [meQuery.data, token, setUser]);

  const loginMutation = useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onSuccess: async (response) => {
      const tempUser = { id: "", email: "", name: "", role: "member" as const };
      setAuth(response.access_token, tempUser);
      await queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      navigate("/dashboard");
    },
  });

  const logout = () => {
    storeLogout();
    queryClient.clear();
    navigate("/login");
  };

  return {
    user,
    isAuthenticated,
    isLoading: meQuery.isLoading,
    loginMutation,
    logout,
  };
}
