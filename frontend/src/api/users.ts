import { get, put, del, post } from "./client";
import type { User, UserCreate, UserUpdate, UserListResponse } from "../types/auth";

export interface UserListParams {
  search?: string;
  role?: string;
  page?: number;
  per_page?: number;
}

export const getUsers = (params?: UserListParams) =>
  get<UserListResponse>("/auth/users", { params });

export const registerUser = (data: UserCreate) =>
  post<User>("/auth/register", data);

export const updateUser = (id: string, data: UserUpdate) =>
  put<User>(`/auth/users/${id}`, data);

export const deleteUser = (id: string) =>
  del<User>(`/auth/users/${id}`);
