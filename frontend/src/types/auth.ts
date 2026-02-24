export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export type UserRole = "admin" | "manager" | "member";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}
