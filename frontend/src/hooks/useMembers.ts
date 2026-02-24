import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as membersApi from "../api/members";
import type { MemberCreate, MemberUpdate, MemberListParams } from "../types/member";

export function useMemberList(params?: MemberListParams) {
  return useQuery({
    queryKey: ["members", params],
    queryFn: () => membersApi.getMembers(params),
  });
}

export function useMember(id: string) {
  return useQuery({
    queryKey: ["members", id],
    queryFn: () => membersApi.getMember(id),
    enabled: !!id,
  });
}

export function useMemberUtilization(id: string, year: number, month: number) {
  return useQuery({
    queryKey: ["members", id, "utilization", year, month],
    queryFn: () => membersApi.getMemberUtilization(id, year, month),
    enabled: !!id,
  });
}

export function useMemberMutations() {
  const queryClient = useQueryClient();
  const invalidateMembers = () => queryClient.invalidateQueries({ queryKey: ["members"] });

  const createMutation = useMutation({
    mutationFn: (data: MemberCreate) => membersApi.createMember(data),
    onSuccess: invalidateMembers,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: MemberUpdate }) =>
      membersApi.updateMember(id, data),
    onSuccess: invalidateMembers,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => membersApi.deleteMember(id),
    onSuccess: invalidateMembers,
  });

  return { createMutation, updateMutation, deleteMutation };
}
