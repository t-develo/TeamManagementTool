import { get, post, put, del } from "./client";
import type { Member, MemberCreate, MemberUpdate, MemberUtilization, MemberListParams } from "../types/member";
import type { PaginatedResponse } from "../types/common";

export const getMembers = (params?: MemberListParams) =>
  get<PaginatedResponse<Member>>("/members", { params });

export const getMember = (id: string) => get<Member>(`/members/${id}`);

export const createMember = (data: MemberCreate) => post<Member>("/members", data);

export const updateMember = (id: string, data: MemberUpdate) =>
  put<Member>(`/members/${id}`, data);

export const deleteMember = (id: string) => del<void>(`/members/${id}`);

export const getMemberUtilization = (id: string, year: number, month: number) =>
  get<MemberUtilization>(`/members/${id}/utilization`, { params: { year, month } });
