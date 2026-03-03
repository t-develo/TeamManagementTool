import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as usersApi from "../api/users";
import type { UserCreate, UserUpdate } from "../types/auth";
import type { UserListParams } from "../api/users";

export function useUserList(params?: UserListParams) {
  return useQuery({
    queryKey: ["users", params],
    queryFn: () => usersApi.getUsers(params),
  });
}

export function useUserMutations() {
  const queryClient = useQueryClient();
  const invalidateUsers = () => queryClient.invalidateQueries({ queryKey: ["users"] });

  const createMutation = useMutation({
    mutationFn: (data: UserCreate) => usersApi.registerUser(data),
    onSuccess: invalidateUsers,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UserUpdate }) =>
      usersApi.updateUser(id, data),
    onSuccess: invalidateUsers,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => usersApi.deleteUser(id),
    onSuccess: invalidateUsers,
  });

  return { createMutation, updateMutation, deleteMutation };
}
