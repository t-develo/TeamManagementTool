import { get, post } from "./client";
import type { LoginRequest, LoginResponse, User } from "../types/auth";

export const login = (data: LoginRequest) =>
  post<LoginResponse>("/auth/login", data);

export const getMe = () => get<User>("/auth/me");

export const registerUser = (data: {
  email: string;
  password: string;
  name: string;
  role: "admin" | "manager" | "member";
}) => post<User>("/auth/register", data);
