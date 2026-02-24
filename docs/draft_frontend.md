# 3. フロントエンド詳細設計

---

## 3.1 TypeScript 型定義

### types/auth.ts

認証関連の型定義。ログインリクエスト/レスポンス、ユーザー情報を定義する。

```typescript
/** ログインリクエスト */
export interface LoginRequest {
  email: string;
  password: string;
}

/** ログインレスポンス */
export interface LoginResponse {
  access_token: string;
  token_type: string;
}

/** ユーザーロール */
export type UserRole = "admin" | "manager" | "member";

/** ユーザー情報 */
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}
```

---

### types/member.ts

メンバーエンティティおよび稼働率関連の型定義。

```typescript
/** メンバーエンティティ */
export interface Member {
  id: string;
  name: string;
  email: string;
  department: string;
  role: string;
  cost_per_month: number;
  avatar_color: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** メンバー作成リクエスト（id, created_at, updated_at を除外） */
export type MemberCreate = Omit<Member, "id" | "created_at" | "updated_at">;

/** メンバー更新リクエスト（全フィールド任意） */
export type MemberUpdate = Partial<MemberCreate>;

/** メンバー稼働率のタスク明細 */
export interface MemberUtilizationTask {
  task_id: string;
  project_name: string;
  man_days: number;
  contribution_days: number;
}

/** メンバー稼働率情報 */
export interface MemberUtilization {
  member_id: string;
  year: number;
  month: number;
  utilization_rate: number;
  assigned_days: number;
  tasks: MemberUtilizationTask[];
}

/** メンバー一覧取得パラメータ */
export interface MemberListParams {
  page?: number;
  per_page?: number;
  search?: string;
  department?: string;
  is_active?: boolean;
}
```

---

### types/project.ts

プロジェクトエンティティの型定義。タスクを埋め込み構造として保持する。

```typescript
import type { Task } from "./task";

/** プロジェクトステータス */
export type ProjectStatus = "planning" | "active" | "completed" | "on_hold";

/** プロジェクトエンティティ */
export interface Project {
  id: string;
  name: string;
  description: string;
  budget: number;
  status: ProjectStatus;
  start_date: string;
  end_date: string;
  tasks: Task[];
  actual_cost: number;
  progress: number;
  created_at: string;
  updated_at: string;
}

/** プロジェクト作成リクエスト */
export type ProjectCreate = Omit<
  Project,
  "id" | "tasks" | "actual_cost" | "progress" | "created_at" | "updated_at"
>;

/** プロジェクト更新リクエスト */
export type ProjectUpdate = Partial<ProjectCreate>;

/** プロジェクト一覧取得パラメータ */
export interface ProjectListParams {
  page?: number;
  per_page?: number;
  status?: ProjectStatus;
}

/** プロジェクトコスト情報 */
export interface ProjectCost {
  project_id: string;
  total_cost: number;
  budget: number;
  consumption_rate: number;
  task_costs: {
    task_id: string;
    title: string;
    assignee_name: string;
    man_days: number;
    cost: number;
  }[];
}

/** 予算 vs 実績データ */
export interface BudgetVsActualData {
  project_id: string;
  project_name: string;
  budget: number;
  actual_cost: number;
}
```

---

### types/task.ts

タスクエンティティおよび並び替え関連の型定義。

```typescript
/** タスクステータス */
export type TaskStatus = "not_started" | "in_progress" | "completed";

/** タスクエンティティ（Project 内に埋め込み） */
export interface Task {
  task_id: string;
  title: string;
  assignee_id: string;
  man_days: number;
  progress: number;
  start_date: string;
  end_date: string;
  sort_order: number;
  status: TaskStatus;
}

/** タスク作成リクエスト */
export type TaskCreate = Omit<Task, "task_id" | "sort_order">;

/** タスク更新リクエスト */
export type TaskUpdate = Partial<Omit<Task, "task_id" | "sort_order">>;

/** タスク並び替えアイテム */
export interface TaskReorderItem {
  task_id: string;
  sort_order: number;
}

/** タスクアサインリクエスト */
export interface TaskAssignRequest {
  assignee_id: string;
}
```

---

### types/common.ts

ページネーション、ダッシュボード集計、エラーレスポンスなど共通型を定義する。

```typescript
/** ページネーション付きレスポンス（ジェネリック） */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
}

/** ダッシュボード集計サマリー */
export interface DashboardSummary {
  total_projects: number;
  active_projects: number;
  completed_projects: number;
  total_members: number;
  active_members: number;
  monthly_budget_consumption_rate: number;
  project_summaries: ProjectProgressSummary[];
  recent_activities: RecentActivity[];
}

/** プロジェクト進捗サマリー */
export interface ProjectProgressSummary {
  id: string;
  name: string;
  progress: number;
  status: string;
}

/** アクティビティ種別 */
export type ActivityType =
  | "task_completed"
  | "project_created"
  | "progress_updated"
  | "member_added";

/** 最近のアクティビティ */
export interface RecentActivity {
  type: ActivityType;
  description: string;
  member_name: string;
  timestamp: string;
}

/** API エラーレスポンス */
export interface ApiError {
  detail:
    | string
    | {
        loc: string[];
        msg: string;
        type: string;
      }[];
}

/** ページネーション状態（DataTable 用） */
export interface PaginationState {
  page: number;
  per_page: number;
  total: number;
}

/** テーブルカラム定義（DataTable 用） */
export interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}
```

---

## 3.2 Zustand ストア設計

### stores/authStore.ts

認証状態を管理するストア。JWT トークンを `localStorage` に永続化し、アプリ起動時に自動復元する。

```typescript
import { create } from "zustand";
import type { User } from "../types/auth";

/** 認証ストアの状態 */
interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
}

/** 認証ストアのアクション */
interface AuthActions {
  /** ログイン成功時にトークンとユーザー情報をセットする */
  setAuth: (token: string, user: User) => void;
  /** ログアウト時にトークンとユーザー情報をクリアする */
  logout: () => void;
}

type AuthStore = AuthState & AuthActions;

/** localStorage のキー */
const TOKEN_KEY = "teamboard_token";

/**
 * 認証ストア
 *
 * - 初期化時に localStorage からトークンを読み込む
 * - トークンが存在する場合 isAuthenticated=true に設定
 * - user は /auth/me の呼び出し後に setAuth で設定される
 */
export const useAuthStore = create<AuthStore>((set) => {
  const storedToken = localStorage.getItem(TOKEN_KEY);

  return {
    // --- State ---
    token: storedToken,
    user: null,
    isAuthenticated: storedToken !== null,

    // --- Actions ---
    setAuth: (token: string, user: User) => {
      localStorage.setItem(TOKEN_KEY, token);
      set({ token, user, isAuthenticated: true });
    },

    logout: () => {
      localStorage.removeItem(TOKEN_KEY);
      set({ token: null, user: null, isAuthenticated: false });
    },
  };
});
```

---

### stores/uiStore.ts

サイドバー開閉状態やモーダル表示状態など、UI のグローバル状態を管理するストア。

```typescript
import { create } from "zustand";

/** UI ストアの状態 */
interface UiState {
  sidebarCollapsed: boolean;
  activeModal: string | null;
  modalData: unknown;
}

/** UI ストアのアクション */
interface UiActions {
  /** サイドバーの開閉を切り替える */
  toggleSidebar: () => void;
  /** 指定した名前のモーダルを開く（任意のデータを渡せる） */
  openModal: (name: string, data?: unknown) => void;
  /** 現在開いているモーダルを閉じる */
  closeModal: () => void;
}

type UiStore = UiState & UiActions;

/**
 * UI ストア
 *
 * - sidebarCollapsed: サイドバーの折りたたみ状態
 * - activeModal: 現在表示中のモーダル名（null = 非表示）
 * - modalData: モーダルに渡す任意のデータ（編集対象のエンティティ等）
 */
export const useUiStore = create<UiStore>((set) => ({
  // --- State ---
  sidebarCollapsed: false,
  activeModal: null,
  modalData: null,

  // --- Actions ---
  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  openModal: (name: string, data?: unknown) =>
    set({ activeModal: name, modalData: data ?? null }),

  closeModal: () => set({ activeModal: null, modalData: null }),
}));
```

---

## 3.3 API クライアント設計

### api/client.ts

Axios インスタンスの生成、リクエスト/レスポンスインターセプター、ジェネリック CRUD ヘルパー関数を提供する。

```typescript
import axios, { type AxiosRequestConfig, type AxiosResponse } from "axios";
import { useAuthStore } from "../stores/authStore";

/**
 * Axios インスタンス
 * - baseURL: FastAPI サーバーの API プレフィックス
 * - Content-Type: デフォルトで JSON
 */
const client = axios.create({
  baseURL: "http://localhost:8000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * リクエストインターセプター
 * - authStore からトークンを取得し Authorization ヘッダーに付与
 */
client.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * レスポンスインターセプター
 * - 401 Unauthorized を検知したらログアウト処理を実行し /login へリダイレクト
 */
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// --- ジェネリック CRUD ヘルパー ---

/** GET リクエスト */
export async function get<T>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> {
  const response: AxiosResponse<T> = await client.get(url, config);
  return response.data;
}

/** POST リクエスト */
export async function post<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<T> {
  const response: AxiosResponse<T> = await client.post(url, data, config);
  return response.data;
}

/** PUT リクエスト */
export async function put<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<T> {
  const response: AxiosResponse<T> = await client.put(url, data, config);
  return response.data;
}

/** DELETE リクエスト */
export async function del<T>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> {
  const response: AxiosResponse<T> = await client.delete(url, config);
  return response.data;
}

export default client;
```

---

### api/auth.ts

認証 API のラッパー関数。ログイン、ユーザー情報取得、ユーザー登録をカバーする。

```typescript
import { get, post } from "./client";
import type { LoginRequest, LoginResponse, User } from "../types/auth";

/** ログイン */
export const login = (data: LoginRequest) =>
  post<LoginResponse>("/auth/login", data);

/** 現在のユーザー情報を取得 */
export const getMe = () => get<User>("/auth/me");

/** 新規ユーザー登録（admin のみ） */
export const registerUser = (data: {
  email: string;
  password: string;
  name: string;
  role: "admin" | "manager" | "member";
}) => post<User>("/auth/register", data);
```

---

### api/members.ts

メンバー CRUD および稼働率取得の API ラッパー関数。

```typescript
import { get, post, put, del } from "./client";
import type {
  Member,
  MemberCreate,
  MemberUpdate,
  MemberUtilization,
  MemberListParams,
} from "../types/member";
import type { PaginatedResponse } from "../types/common";

/** メンバー一覧取得（ページネーション・検索・フィルター対応） */
export const getMembers = (params?: MemberListParams) =>
  get<PaginatedResponse<Member>>("/members", { params });

/** メンバー詳細取得 */
export const getMember = (id: string) => get<Member>(`/members/${id}`);

/** メンバー登録 */
export const createMember = (data: MemberCreate) =>
  post<Member>("/members", data);

/** メンバー更新 */
export const updateMember = (id: string, data: MemberUpdate) =>
  put<Member>(`/members/${id}`, data);

/** メンバー削除 */
export const deleteMember = (id: string) => del<void>(`/members/${id}`);

/** メンバー稼働率取得 */
export const getMemberUtilization = (
  id: string,
  year: number,
  month: number
) =>
  get<MemberUtilization>(`/members/${id}/utilization`, {
    params: { year, month },
  });
```

---

### api/projects.ts

プロジェクト CRUD、コスト計算、予算 vs 実績の API ラッパー関数。

```typescript
import { get, post, put, del } from "./client";
import type {
  Project,
  ProjectCreate,
  ProjectUpdate,
  ProjectListParams,
  ProjectCost,
  BudgetVsActualData,
} from "../types/project";
import type { PaginatedResponse, DashboardSummary } from "../types/common";

/** プロジェクト一覧取得 */
export const getProjects = (params?: ProjectListParams) =>
  get<PaginatedResponse<Project>>("/projects", { params });

/** プロジェクト詳細取得 */
export const getProject = (id: string) => get<Project>(`/projects/${id}`);

/** プロジェクト作成 */
export const createProject = (data: ProjectCreate) =>
  post<Project>("/projects", data);

/** プロジェクト更新 */
export const updateProject = (id: string, data: ProjectUpdate) =>
  put<Project>(`/projects/${id}`, data);

/** プロジェクト削除 */
export const deleteProject = (id: string) => del<void>(`/projects/${id}`);

/** プロジェクトコスト計算結果取得 */
export const getProjectCost = (id: string) =>
  get<ProjectCost>(`/projects/${id}/cost`);

/** 予算 vs 実績データ取得 */
export const getBudgetVsActual = (id: string) =>
  get<BudgetVsActualData>(`/projects/${id}/budget-vs-actual`);

/** ダッシュボードサマリー取得 */
export const getDashboardSummary = () =>
  get<DashboardSummary>("/dashboard");
```

---

### api/tasks.ts

タスク操作（追加・更新・削除・並び替え・アサイン）の API ラッパー関数。全てプロジェクト ID をスコープとする。

```typescript
import { post, put, del } from "./client";
import type { Task, TaskCreate, TaskUpdate, TaskReorderItem, TaskAssignRequest } from "../types/task";

/** タスク追加 */
export const createTask = (projectId: string, data: TaskCreate) =>
  post<Task>(`/projects/${projectId}/tasks`, data);

/** タスク更新 */
export const updateTask = (
  projectId: string,
  taskId: string,
  data: TaskUpdate
) => put<Task>(`/projects/${projectId}/tasks/${taskId}`, data);

/** タスク削除 */
export const deleteTask = (projectId: string, taskId: string) =>
  del<void>(`/projects/${projectId}/tasks/${taskId}`);

/** タスク並び替え */
export const reorderTasks = (projectId: string, items: TaskReorderItem[]) =>
  put<void>(`/projects/${projectId}/tasks/reorder`, items);

/** タスクアサイン */
export const assignTask = (
  projectId: string,
  taskId: string,
  data: TaskAssignRequest
) => put<Task>(`/projects/${projectId}/tasks/${taskId}/assign`, data);
```

---

## 3.4 カスタムフック設計

### hooks/useAuth.ts

認証ライフサイクル全体を管理するフック。ログイン、ログアウト、自動トークン検証を提供する。

| 項目 | 詳細 |
|------|------|
| クエリキー | `["auth", "me"]` |
| 有効条件 | `token !== null` の場合のみ `/auth/me` を自動取得 |
| キャッシュ無効化 | ログイン成功時に `["auth", "me"]` を invalidate |
| リダイレクト | 認証状態の変化に応じて `/login` または `/dashboard` へ遷移 |

```typescript
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuthStore } from "../stores/authStore";
import * as authApi from "../api/auth";
import type { LoginRequest } from "../types/auth";

export function useAuth() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { token, user, isAuthenticated, setAuth, logout: storeLogout } =
    useAuthStore();

  // --- /auth/me によるユーザー情報の自動取得 ---
  const meQuery = useQuery({
    queryKey: ["auth", "me"],
    queryFn: authApi.getMe,
    enabled: token !== null,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5分間キャッシュ
  });

  // meQuery 成功時に authStore.user を同期
  useEffect(() => {
    if (meQuery.data && token) {
      setAuth(token, meQuery.data);
    }
  }, [meQuery.data, token, setAuth]);

  // --- ログインミューテーション ---
  const loginMutation = useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onSuccess: async (response) => {
      // トークンを一時保存し、直後にユーザー情報を取得
      useAuthStore.getState().setAuth(response.access_token, user!);
      await queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      navigate("/dashboard");
    },
  });

  // --- ログアウト ---
  const logout = () => {
    storeLogout();
    queryClient.clear();
    navigate("/login");
  };

  // --- 認証状態変化時のリダイレクト ---
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  return {
    user,
    isAuthenticated,
    isLoading: meQuery.isLoading,
    loginMutation,
    logout,
  };
}
```

---

### hooks/useMembers.ts

メンバーの CRUD 操作と稼働率取得を管理するフック。

| 項目 | 詳細 |
|------|------|
| クエリキー | `["members", params]`, `["members", id]`, `["members", id, "utilization", year, month]` |
| キャッシュ無効化 | create/update/delete 成功時に `["members"]` プレフィックス全体を invalidate |
| 楽観的更新 | なし（一覧/詳細は invalidation で自動更新） |

```typescript
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import * as membersApi from "../api/members";
import type {
  MemberCreate,
  MemberUpdate,
  MemberListParams,
} from "../types/member";

/** メンバー一覧取得 */
export function useMemberList(params?: MemberListParams) {
  return useQuery({
    queryKey: ["members", params],
    queryFn: () => membersApi.getMembers(params),
  });
}

/** メンバー詳細取得 */
export function useMember(id: string) {
  return useQuery({
    queryKey: ["members", id],
    queryFn: () => membersApi.getMember(id),
    enabled: !!id,
  });
}

/** メンバー稼働率取得 */
export function useMemberUtilization(
  id: string,
  year: number,
  month: number
) {
  return useQuery({
    queryKey: ["members", id, "utilization", year, month],
    queryFn: () => membersApi.getMemberUtilization(id, year, month),
    enabled: !!id,
  });
}

/** メンバー CRUD ミューテーション群 */
export function useMemberMutations() {
  const queryClient = useQueryClient();

  const invalidateMembers = () =>
    queryClient.invalidateQueries({ queryKey: ["members"] });

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
```

---

### hooks/useProjects.ts

プロジェクトの CRUD 操作とコスト関連データ取得を管理するフック。

| 項目 | 詳細 |
|------|------|
| クエリキー | `["projects", params]`, `["projects", id]`, `["projects", id, "cost"]`, `["projects", id, "budget-vs-actual"]` |
| キャッシュ無効化 | create/update/delete 成功時に `["projects"]` プレフィックス全体 + `["dashboard"]` を invalidate |
| 楽観的更新 | なし |

```typescript
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import * as projectsApi from "../api/projects";
import type {
  ProjectCreate,
  ProjectUpdate,
  ProjectListParams,
} from "../types/project";

/** プロジェクト一覧取得 */
export function useProjectList(params?: ProjectListParams) {
  return useQuery({
    queryKey: ["projects", params],
    queryFn: () => projectsApi.getProjects(params),
  });
}

/** プロジェクト詳細取得 */
export function useProject(id: string) {
  return useQuery({
    queryKey: ["projects", id],
    queryFn: () => projectsApi.getProject(id),
    enabled: !!id,
  });
}

/** プロジェクトコスト取得 */
export function useProjectCost(id: string) {
  return useQuery({
    queryKey: ["projects", id, "cost"],
    queryFn: () => projectsApi.getProjectCost(id),
    enabled: !!id,
  });
}

/** 予算 vs 実績データ取得 */
export function useBudgetVsActual(id: string) {
  return useQuery({
    queryKey: ["projects", id, "budget-vs-actual"],
    queryFn: () => projectsApi.getBudgetVsActual(id),
    enabled: !!id,
  });
}

/** プロジェクト CRUD ミューテーション群 */
export function useProjectMutations() {
  const queryClient = useQueryClient();

  const invalidateProjects = () => {
    queryClient.invalidateQueries({ queryKey: ["projects"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };

  const createMutation = useMutation({
    mutationFn: (data: ProjectCreate) => projectsApi.createProject(data),
    onSuccess: invalidateProjects,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProjectUpdate }) =>
      projectsApi.updateProject(id, data),
    onSuccess: invalidateProjects,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => projectsApi.deleteProject(id),
    onSuccess: invalidateProjects,
  });

  return { createMutation, updateMutation, deleteMutation };
}
```

---

### hooks/useTasks.ts

タスク操作を管理するフック。並び替え操作には楽観的更新を適用し、D&D 操作の即時反映を実現する。

| 項目 | 詳細 |
|------|------|
| クエリキー依存 | 全ミューテーション成功時に `["projects", projectId]` を invalidate |
| 楽観的更新 | `reorderMutation` — ドラッグ終了時にキャッシュ上のタスク順序を即時反映。API 失敗時にロールバック |
| ダッシュボード連動 | タスク完了時に `["dashboard"]` も invalidate |

```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as tasksApi from "../api/tasks";
import type {
  TaskCreate,
  TaskUpdate,
  TaskReorderItem,
  TaskAssignRequest,
} from "../types/task";
import type { Project } from "../types/project";

export function useTaskMutations(projectId: string) {
  const queryClient = useQueryClient();

  const invalidateProject = () => {
    queryClient.invalidateQueries({ queryKey: ["projects", projectId] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };

  // --- タスク追加 ---
  const createMutation = useMutation({
    mutationFn: (data: TaskCreate) => tasksApi.createTask(projectId, data),
    onSuccess: invalidateProject,
  });

  // --- タスク更新 ---
  const updateMutation = useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: TaskUpdate }) =>
      tasksApi.updateTask(projectId, taskId, data),
    onSuccess: invalidateProject,
  });

  // --- タスク削除 ---
  const deleteMutation = useMutation({
    mutationFn: (taskId: string) => tasksApi.deleteTask(projectId, taskId),
    onSuccess: invalidateProject,
  });

  // --- タスク並び替え（楽観的更新） ---
  const reorderMutation = useMutation({
    mutationFn: (items: TaskReorderItem[]) =>
      tasksApi.reorderTasks(projectId, items),

    onMutate: async (items: TaskReorderItem[]) => {
      // 進行中のクエリをキャンセルして競合を防止
      await queryClient.cancelQueries({
        queryKey: ["projects", projectId],
      });

      // 現在のキャッシュを保存（ロールバック用）
      const previousProject = queryClient.getQueryData<Project>([
        "projects",
        projectId,
      ]);

      // キャッシュ上のタスク順序を楽観的に更新
      if (previousProject) {
        const orderMap = new Map(
          items.map((item) => [item.task_id, item.sort_order])
        );
        const updatedTasks = [...previousProject.tasks]
          .map((task) => ({
            ...task,
            sort_order: orderMap.get(task.task_id) ?? task.sort_order,
          }))
          .sort((a, b) => a.sort_order - b.sort_order);

        queryClient.setQueryData<Project>(["projects", projectId], {
          ...previousProject,
          tasks: updatedTasks,
        });
      }

      return { previousProject };
    },

    onError: (_err, _items, context) => {
      // API エラー時はキャッシュをロールバック
      if (context?.previousProject) {
        queryClient.setQueryData(
          ["projects", projectId],
          context.previousProject
        );
      }
    },

    onSettled: () => {
      // 最終的にサーバーデータで再同期
      queryClient.invalidateQueries({
        queryKey: ["projects", projectId],
      });
    },
  });

  // --- タスクアサイン ---
  const assignMutation = useMutation({
    mutationFn: ({
      taskId,
      data,
    }: {
      taskId: string;
      data: TaskAssignRequest;
    }) => tasksApi.assignTask(projectId, taskId, data),
    onSuccess: invalidateProject,
  });

  return {
    createMutation,
    updateMutation,
    deleteMutation,
    reorderMutation,
    assignMutation,
  };
}
```

---

### hooks/useDashboard.ts

ダッシュボードサマリーデータを取得するフック。

| 項目 | 詳細 |
|------|------|
| クエリキー | `["dashboard"]` |
| staleTime | 30 秒（ダッシュボードは頻繁にアクセスされるため短めに設定） |
| キャッシュ無効化 | プロジェクト/タスクの CUD 操作時に各フックから自動 invalidate |

```typescript
import { useQuery } from "@tanstack/react-query";
import * as projectsApi from "../api/projects";

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: () => projectsApi.getDashboardSummary(),
    staleTime: 30 * 1000, // 30秒
  });
}
```

---

## 3.5 コンポーネント設計

### Layout コンポーネント

#### MainLayout

| 項目 | 内容 |
|------|------|
| ファイルパス | `src/components/layout/MainLayout.tsx` |
| 説明 | アプリ全体のレイアウト枠。サイドバー + ヘッダー + コンテンツ領域（`<Outlet />`）で構成 |
| 子コンポーネント | `Sidebar`, `Header`, `<Outlet />` (React Router) |

```typescript
// Props: なし（レイアウト構造のみ）
// 内部状態: なし（sidebarCollapsed は uiStore から取得）

// レンダリングロジック:
// - uiStore.sidebarCollapsed に応じてコンテンツ領域の幅を動的に変更
// - サイドバー幅: 折りたたみ時 64px / 展開時 240px
// - コンテンツ領域: calc(100vw - サイドバー幅)、padding: 24px
```

---

#### Sidebar

| 項目 | 内容 |
|------|------|
| ファイルパス | `src/components/layout/Sidebar.tsx` |
| 説明 | 左サイドバーナビゲーション。ダーク背景にアイコン+テキストのナビアイテムを表示 |
| 子コンポーネント | なし |

```typescript
// Props: なし
// 内部状態: なし（uiStore.sidebarCollapsed を参照）

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
}

// ナビゲーション項目:
// - /dashboard (ダッシュボード)
// - /members (メンバー)
// - /projects (プロジェクト)
// - /budget (予算)

// レンダリングロジック:
// - useLocation() で現在のパスを取得し、アクティブなナビ項目をハイライト
// - sidebarCollapsed=true の場合はアイコンのみ表示（ラベル非表示）
// - 下部にトグルボタン（uiStore.toggleSidebar を呼び出す）
// - 背景色: #1E293B、テキスト色: white/gray-400
```

---

#### Header

| 項目 | 内容 |
|------|------|
| ファイルパス | `src/components/layout/Header.tsx` |
| 説明 | ページ上部のヘッダーバー。ページタイトルとユーザーアバター+ドロップダウンを表示 |
| 子コンポーネント | なし |

```typescript
// Props: なし
// 内部状態:
//   const [dropdownOpen, setDropdownOpen] = useState(false);

// レンダリングロジック:
// - useLocation() からページタイトルをマッピング表示
// - 右端にユーザーアバター（authStore.user.name のイニシャル）を表示
// - アバタークリックでドロップダウンメニュー（ログアウトボタン）を表示
// - 高さ: 64px、背景: white、下部ボーダー
```

---

### Common コンポーネント

#### KpiCard

| 項目 | 内容 |
|------|------|
| ファイルパス | `src/components/common/KpiCard.tsx` |
| 説明 | ダッシュボード・予算画面で使用する KPI 表示カード |
| 子コンポーネント | なし |

```typescript
interface KpiCardProps {
  /** カードタイトル（例: "総プロジェクト数"） */
  title: string;
  /** メイン値（例: 12 または "¥1,200万"） */
  value: string | number;
  /** 補足テキスト（例: "前月比"） */
  subtitle?: string;
  /** トレンドインジケーター */
  trend?: {
    value: number;
    direction: "up" | "down";
  };
  /** アクセントカラー（左ボーダーまたはアイコン色） */
  color: string;
}

// 内部状態: なし
// レンダリングロジック:
// - カード左端に color の縦ボーダー（4px）
// - title をサブテキスト色で表示、value を大きなフォントで表示
// - trend がある場合、矢印アイコン + パーセント値を direction に応じた色で表示
```

---

#### ProgressBar

| 項目 | 内容 |
|------|------|
| ファイルパス | `src/components/common/ProgressBar.tsx` |
| 説明 | 汎用プログレスバー。値に応じた幅で塗りつぶし表示 |
| 子コンポーネント | なし |

```typescript
interface ProgressBarProps {
  /** 現在値（0-100 または任意の数値） */
  value: number;
  /** 最大値（デフォルト: 100） */
  max?: number;
  /** バー色（デフォルト: #3B82F6） */
  color?: string;
  /** パーセントラベルの表示（デフォルト: false） */
  showLabel?: boolean;
}

// 内部状態: なし
// レンダリングロジック:
// - 外枠: h-2 bg-gray-200 rounded-full
// - 内側バー: width = (value / max) * 100 %、background-color = color
// - showLabel=true の場合、バー右側に "%値" テキストを表示
```

---

#### StatusBadge

| 項目 | 内容 |
|------|------|
| ファイルパス | `src/components/common/StatusBadge.tsx` |
| 説明 | エンティティのステータスをバッジ形式で表示する汎用コンポーネント |
| 子コンポーネント | なし |

```typescript
interface StatusBadgeProps {
  /** ステータスキー（例: "active", "completed"） */
  status: string;
  /** ステータスキーとラベル・色のマッピング */
  statusMap: Record<string, { label: string; color: string }>;
}

// 内部状態: なし
// レンダリングロジック:
// - statusMap[status] からラベルと色を取得
// - バッジ: px-2 py-1 rounded-full text-xs font-medium
// - 色は bg-{color}-100 text-{color}-700 のパターンで適用
```

**プロジェクトステータス用マッピング例:**

```typescript
export const PROJECT_STATUS_MAP: Record<
  string,
  { label: string; color: string }
> = {
  planning: { label: "計画中", color: "blue" },
  active: { label: "進行中", color: "green" },
  completed: { label: "完了", color: "gray" },
  on_hold: { label: "保留", color: "yellow" },
};
```

---

#### DataTable\<T\>

| 項目 | 内容 |
|------|------|
| ファイルパス | `src/components/common/DataTable.tsx` |
| 説明 | ジェネリックなテーブルコンポーネント。カラム定義に基づいてデータを表形式で描画 |
| 子コンポーネント | なし |

```typescript
interface DataTableProps<T> {
  /** カラム定義配列 */
  columns: Column<T>[];
  /** 表示データ */
  data: T[];
  /** 行クリック時コールバック */
  onRowClick?: (item: T) => void;
  /** ページネーション状態（省略時はページネーション非表示） */
  pagination?: PaginationState;
  /** ページ変更コールバック */
  onPageChange?: (page: number) => void;
  /** ローディング状態 */
  isLoading?: boolean;
}

// 内部状態: なし
// レンダリングロジック:
// - <table> をレンダリング。columns.map で <th> / <td> を生成
// - column.render が定義されていれば render(item) を使用、なければ item[column.key] を表示
// - onRowClick があれば <tr> に cursor-pointer + hover:bg-gray-50 を付与
// - pagination があればテーブル下部にページネーションコントロールを表示
// - isLoading=true 時はスケルトンローダーを表示
```

---

#### ConfirmDialog

| 項目 | 内容 |
|------|------|
| ファイルパス | `src/components/common/ConfirmDialog.tsx` |
| 説明 | 削除確認等に使用するモーダルダイアログ |
| 子コンポーネント | なし |

```typescript
interface ConfirmDialogProps {
  /** 表示制御 */
  open: boolean;
  /** ダイアログタイトル */
  title: string;
  /** 確認メッセージ */
  message: string;
  /** 確認ボタン押下時コールバック */
  onConfirm: () => void;
  /** キャンセルボタン押下時コールバック */
  onCancel: () => void;
  /** ダイアログバリアント（デフォルト: "danger"） */
  variant?: "danger" | "warning";
}

// 内部状態: なし
// レンダリングロジック:
// - open=false の場合は null を返却
// - 半透明オーバーレイ + 中央配置のモーダルカード
// - variant="danger" → 確認ボタンが赤色、variant="warning" → 黄色
// - ESC キーで onCancel を呼び出し
// - オーバーレイクリックで onCancel を呼び出し
```

---

### Members コンポーネント

#### MemberTable

| 項目 | 内容 |
|------|------|
| ファイルパス | `src/components/members/MemberTable.tsx` |
| 説明 | メンバー一覧テーブル。検索・部署フィルター付き。DataTable を内部で使用 |
| 子コンポーネント | `DataTable`, `StatusBadge`, `UtilizationBar` |

```typescript
interface MemberTableProps {
  /** メンバーデータ配列 */
  members: Member[];
  /** ページネーション状態 */
  pagination: PaginationState;
  /** ローディング状態 */
  isLoading: boolean;
  /** ページ変更コールバック */
  onPageChange: (page: number) => void;
  /** 編集ボタン押下時コールバック */
  onEdit: (member: Member) => void;
  /** 削除ボタン押下時コールバック */
  onDelete: (member: Member) => void;
}

// 内部状態:
//   const [search, setSearch] = useState("");
//   const [departmentFilter, setDepartmentFilter] = useState<string>("");

// カラム定義:
// | key         | header    | render                                          |
// |-------------|-----------|-------------------------------------------------|
// | name        | 名前      | アバター（avatar_color 背景 + イニシャル）+ 名前  |
// | department  | 部署      | テキスト                                        |
// | role        | 役割      | テキスト                                        |
// | cost        | コスト    | `¥{cost_per_month}万/月` フォーマット            |
// | utilization | 稼働率    | <UtilizationBar /> コンポーネント                 |
// | is_active   | ステータス | <StatusBadge /> コンポーネント                    |
// | actions     | 操作      | 編集・削除アイコンボタン                          |

// イベント:
// - search 変更 → 親コンポーネントへ検索パラメータ伝播（デバウンス 300ms）
// - departmentFilter 変更 → 親コンポーネントへフィルターパラメータ伝播
```

---

#### MemberForm

| 項目 | 内容 |
|------|------|
| ファイルパス | `src/components/members/MemberForm.tsx` |
| 説明 | メンバー登録・編集用モーダルフォーム |
| 子コンポーネント | なし |

```typescript
interface MemberFormProps {
  /** 編集時の初期値（null の場合は新規作成モード） */
  initialData: Member | null;
  /** 送信コールバック */
  onSubmit: (data: MemberCreate | MemberUpdate) => void;
  /** キャンセルコールバック */
  onCancel: () => void;
  /** 送信中フラグ */
  isSubmitting: boolean;
}

// 内部状態（controlled inputs）:
//   const [name, setName] = useState(initialData?.name ?? "");
//   const [email, setEmail] = useState(initialData?.email ?? "");
//   const [department, setDepartment] = useState(initialData?.department ?? "");
//   const [role, setRole] = useState(initialData?.role ?? "");
//   const [costPerMonth, setCostPerMonth] = useState(initialData?.cost_per_month ?? 0);
//   const [avatarColor, setAvatarColor] = useState(initialData?.avatar_color ?? "#3B82F6");
//   const [isActive, setIsActive] = useState(initialData?.is_active ?? true);
//   const [errors, setErrors] = useState<Record<string, string>>({});

// バリデーション:
// - name: 必須、1-100文字
// - email: 必須、メール形式
// - department: 必須
// - role: 必須
// - cost_per_month: 必須、0以上の数値

// レンダリングロジック:
// - モーダルオーバーレイ + フォームカード
// - initialData が null なら「新規メンバー登録」、あれば「メンバー編集」タイトル
// - 各フィールドに <input> / <select> を配置、エラー時に赤色ボーダー + メッセージ
// - avatar_color はカラーピッカーまたはプリセットカラーパレットから選択
```

---

#### UtilizationBar

| 項目 | 内容 |
|------|------|
| ファイルパス | `src/components/members/UtilizationBar.tsx` |
| 説明 | 稼働率をカラーコード付きプログレスバーで表示 |
| 子コンポーネント | `ProgressBar` |

```typescript
interface UtilizationBarProps {
  /** 稼働率（0-100+） */
  rate: number;
}

// 内部状態: なし
// 色の判定ロジック:
//   rate < 70  → green (#10B981)  — 余裕あり
//   rate < 90  → yellow (#F59E0B) — 注意
//   rate >= 90 → red (#EF4444)    — 過負荷

// レンダリングロジック:
// - <ProgressBar value={rate} max={100} color={computedColor} showLabel={true} />
```

---

### Projects コンポーネント

#### ProjectCard

| 項目 | 内容 |
|------|------|
| ファイルパス | `src/components/projects/ProjectCard.tsx` |
| 説明 | プロジェクト一覧で使用するカードコンポーネント |
| 子コンポーネント | `ProgressBar`, `StatusBadge`, `BudgetGauge` |

```typescript
interface ProjectCardProps {
  /** プロジェクトデータ */
  project: Project;
  /** カードクリック時コールバック（詳細画面への遷移等） */
  onClick: (project: Project) => void;
}

// 内部状態: なし
// レンダリングロジック:
// - カード形式: rounded-lg shadow p-6 bg-white hover:shadow-md transition
// - 上部: プロジェクト名 + StatusBadge
// - 中部: 期間表示（start_date ~ end_date）、ProgressBar（progress 値）
// - 下部: BudgetGauge（actual_cost / budget）、メンバーアバター群（tasks から unique assignee_id を抽出）
// - アバター群: 最大5名表示 + 残数バッジ（"+3" 等）
```

---

#### ProjectForm

| 項目 | 内容 |
|------|------|
| ファイルパス | `src/components/projects/ProjectForm.tsx` |
| 説明 | プロジェクト作成・編集用モーダルフォーム |
| 子コンポーネント | なし |

```typescript
interface ProjectFormProps {
  /** 編集時の初期値（null の場合は新規作成モード） */
  initialData: Project | null;
  /** 送信コールバック */
  onSubmit: (data: ProjectCreate | ProjectUpdate) => void;
  /** キャンセルコールバック */
  onCancel: () => void;
  /** 送信中フラグ */
  isSubmitting: boolean;
}

// 内部状態（controlled inputs）:
//   const [name, setName] = useState(initialData?.name ?? "");
//   const [description, setDescription] = useState(initialData?.description ?? "");
//   const [budget, setBudget] = useState(initialData?.budget ?? 0);
//   const [status, setStatus] = useState<ProjectStatus>(initialData?.status ?? "planning");
//   const [startDate, setStartDate] = useState(initialData?.start_date ?? "");
//   const [endDate, setEndDate] = useState(initialData?.end_date ?? "");
//   const [errors, setErrors] = useState<Record<string, string>>({});

// バリデーション:
// - name: 必須、1-200文字
// - budget: 必須、0以上の数値
// - start_date: 必須、有効な日付
// - end_date: 必須、start_date 以降
```

---

#### BudgetGauge

| 項目 | 内容 |
|------|------|
| ファイルパス | `src/components/projects/BudgetGauge.tsx` |
| 説明 | 予算消化率をリニアゲージで視覚的に表示 |
| 子コンポーネント | なし |

```typescript
interface BudgetGaugeProps {
  /** 実績コスト（万円） */
  actual: number;
  /** 予算（万円） */
  budget: number;
}

// 内部状態: なし
// 計算:
//   const rate = budget > 0 ? (actual / budget) * 100 : 0;

// 色の判定ロジック:
//   rate < 70  → blue (#3B82F6)
//   rate < 90  → yellow (#F59E0B)
//   rate >= 90 → red (#EF4444)

// レンダリングロジック:
// - 上部: "予算消化率 XX%" テキスト
// - ゲージバー: h-3 bg-gray-200 rounded-full、内側に rate% 幅のバー
// - 下部: "¥{actual}万 / ¥{budget}万" テキスト
```

---

### Gantt コンポーネント

#### 共通定数

```typescript
/** ガントチャートの描画設定 */
export const GANTT_CONFIG = {
  /** 1日あたりのピクセル幅 */
  dayWidth: 32,
  /** タスク行の高さ（px） */
  rowHeight: 40,
  /** タイムラインヘッダーの高さ（px） */
  headerHeight: 48,
} as const;
```

**ピクセル位置計算式:**

| 値 | 計算式 |
|----|--------|
| `barLeft` | `diffInDays(task.start_date, timeline.startDate) * GANTT_CONFIG.dayWidth` |
| `barWidth` | `(diffInDays(task.end_date, task.start_date) + 1) * GANTT_CONFIG.dayWidth` |
| `todayLeft` | `diffInDays(today, timeline.startDate) * GANTT_CONFIG.dayWidth` |

**D&D 日付再計算:**

```typescript
// onDragEnd ハンドラー内
const dayOffset = Math.round(deltaX / GANTT_CONFIG.dayWidth);
const newStartDate = addDays(task.start_date, dayOffset);
const newEndDate = addDays(task.end_date, dayOffset);
```

---

#### GanttChart

| 項目 | 内容 |
|------|------|
| ファイルパス | `src/components/gantt/GanttChart.tsx` |
| 説明 | ガントチャート全体のコンテナ。dnd-kit の DndContext を提供し、ドラッグ終了イベントを処理する |
| 子コンポーネント | `GanttHeader`, `MemberGroup` |

```typescript
import { DndContext, type DragEndEvent } from "@dnd-kit/core";

interface GanttChartProps {
  /** プロジェクトデータ（タスク一覧を含む） */
  project: Project;
  /** メンバー一覧（assignee_id → メンバー名/色の解決用） */
  members: Member[];
}

// 内部状態:
//   const [timelineRange, setTimelineRange] = useState<{
//     startDate: string;
//     endDate: string;
//   }>(() => computeTimelineRange(project));

// レンダリングロジック:
// - DndContext でラップし、onDragEnd で日付再計算 → useTasks.updateMutation を呼び出し
// - タスクを assignee_id でグルーピングし、MemberGroup[] を描画
// - 横スクロール対応（overflow-x: auto）
// - タイムライン幅: totalDays * GANTT_CONFIG.dayWidth

// onDragEnd ハンドラー:
const handleDragEnd = (event: DragEndEvent) => {
  const { active, delta } = event;
  const taskId = active.id as string;
  const dayOffset = Math.round(delta.x / GANTT_CONFIG.dayWidth);
  if (dayOffset === 0) return;

  const task = project.tasks.find((t) => t.task_id === taskId);
  if (!task) return;

  updateMutation.mutate({
    taskId,
    data: {
      start_date: addDays(task.start_date, dayOffset),
      end_date: addDays(task.end_date, dayOffset),
    },
  });
};
```

---

#### GanttHeader

| 項目 | 内容 |
|------|------|
| ファイルパス | `src/components/gantt/GanttHeader.tsx` |
| 説明 | タイムラインの月/週ラベルと今日の日付縦線を描画 |
| 子コンポーネント | なし |

```typescript
interface GanttHeaderProps {
  /** タイムライン開始日 */
  startDate: string;
  /** タイムライン終了日 */
  endDate: string;
}

// 内部状態: なし
// レンダリングロジック:
// - 上段: 月ラベル（"2026年1月", "2026年2月", ...）。各月の幅 = 日数 * dayWidth
// - 下段: 週番号または日付目盛り
// - 今日の位置に赤い縦線（position: absolute, left: todayLeft, border-left: 2px solid #EF4444）
// - 高さ: GANTT_CONFIG.headerHeight
// - 背景: bg-gray-50、下部ボーダー
```

---

#### MemberGroup

| 項目 | 内容 |
|------|------|
| ファイルパス | `src/components/gantt/MemberGroup.tsx` |
| 説明 | メンバー単位でタスクをグルーピング表示。折りたたみ機能付き |
| 子コンポーネント | `GanttRow` |

```typescript
interface MemberGroupProps {
  /** メンバー情報 */
  member: Member;
  /** 当該メンバーに割り当てられたタスク配列 */
  tasks: Task[];
  /** タイムライン開始日 */
  timelineStartDate: string;
}

// 内部状態:
//   const [collapsed, setCollapsed] = useState(false);

// レンダリングロジック:
// - グループヘッダー: メンバーアバター（avatar_color 背景）+ 名前 + タスク数 + 折りたたみトグル
// - collapsed=false の場合、tasks.map で GanttRow を描画
// - collapsed=true の場合、タスク行を非表示
// - グループヘッダー高さ: GANTT_CONFIG.rowHeight
```

---

#### GanttRow

| 項目 | 内容 |
|------|------|
| ファイルパス | `src/components/gantt/GanttRow.tsx` |
| 説明 | タスク1件分のガント行。左側にタスク情報、右側に TaskBar を配置 |
| 子コンポーネント | `TaskBar` |

```typescript
interface GanttRowProps {
  /** タスクデータ */
  task: Task;
  /** タイムライン開始日 */
  timelineStartDate: string;
  /** メンバーのアバター色 */
  memberColor: string;
}

// 内部状態: なし
// レンダリングロジック:
// - 行高さ: GANTT_CONFIG.rowHeight
// - 左側（固定幅 200px）: タスク名、人日数
// - 右側（スクロール領域）: TaskBar を absolute 配置
// - 下部に薄いボーダーで行区切り
```

---

#### TaskBar

| 項目 | 内容 |
|------|------|
| ファイルパス | `src/components/gantt/TaskBar.tsx` |
| 説明 | ドラッグ可能なタスクバー。進捗率をオーバーレイで表現 |
| 子コンポーネント | なし |

```typescript
import { useDraggable } from "@dnd-kit/core";

interface TaskBarProps {
  /** タスクデータ */
  task: Task;
  /** バー左端位置（px） */
  left: number;
  /** バー幅（px） */
  width: number;
  /** バー色（メンバーの avatar_color） */
  color: string;
}

// 内部状態: なし（dnd-kit の useDraggable フックを使用）

// dnd-kit 統合:
//   const { attributes, listeners, setNodeRef, transform } = useDraggable({
//     id: task.task_id,
//   });
//   const style = {
//     position: "absolute" as const,
//     left: `${left}px`,
//     width: `${width}px`,
//     height: `${GANTT_CONFIG.rowHeight - 8}px`,
//     transform: transform
//       ? `translate3d(${transform.x}px, 0, 0)`
//       : undefined,
//   };

// レンダリングロジック:
// - バー全体: rounded-md、背景色 = color（opacity 0.3）
// - 進捗オーバーレイ: 同色（opacity 1.0）、幅 = width * (progress / 100)
// - バー中央にタスク名テキスト（text-xs text-white truncate）
// - ドラッグ中は z-index を上げ、shadow-lg を付与
```

---

### Budget コンポーネント

#### BudgetSummary

| 項目 | 内容 |
|------|------|
| ファイルパス | `src/components/budget/BudgetSummary.tsx` |
| 説明 | 予算ダッシュボード上部の KPI カード群（4枚） |
| 子コンポーネント | `KpiCard` |

```typescript
interface BudgetSummaryProps {
  /** 総予算（万円） */
  totalBudget: number;
  /** 実績コスト合計（万円） */
  totalActualCost: number;
  /** 残予算（万円） */
  remaining: number;
  /** 予算消化率（%） */
  consumptionRate: number;
}

// 内部状態: なし
// レンダリングロジック:
// - 4列グリッドで KpiCard を配置（grid grid-cols-4 gap-6）
//   1. 総予算    — color: blue
//   2. 実績コスト — color: amber
//   3. 残予算    — color: green
//   4. 消化率    — color: red（90%超の場合）/ yellow（70-90%）/ green（70%未満）
```

---

#### BudgetVsActual

| 項目 | 内容 |
|------|------|
| ファイルパス | `src/components/budget/BudgetVsActual.tsx` |
| 説明 | Recharts を使用した予算 vs 実績の棒グラフ |
| 子コンポーネント | Recharts: `BarChart`, `Bar`, `XAxis`, `YAxis`, `Tooltip`, `Legend`, `CartesianGrid`, `ResponsiveContainer` |

```typescript
interface BudgetVsActualProps {
  /** プロジェクト別の予算 vs 実績データ */
  data: BudgetVsActualData[];
}

// 内部状態: なし
// レンダリングロジック:
// - ResponsiveContainer width="100%" height={400}
// - BarChart: X軸 = project_name、Y軸 = 金額（万円）
// - Bar dataKey="budget"      — fill="#3B82F6"（青）、name="予算"
// - Bar dataKey="actual_cost" — fill="#F59E0B"（アンバー）、name="実績"
// - Tooltip: 金額フォーマット（¥XX万）
// - CartesianGrid: strokeDasharray="3 3"
```

---

#### CostBreakdown

| 項目 | 内容 |
|------|------|
| ファイルパス | `src/components/budget/CostBreakdown.tsx` |
| 説明 | Recharts を使用したコスト内訳のドーナツチャート |
| 子コンポーネント | Recharts: `PieChart`, `Pie`, `Cell`, `Tooltip`, `Legend`, `ResponsiveContainer` |

```typescript
interface CostBreakdownItem {
  name: string;
  cost: number;
  color: string;
}

interface CostBreakdownProps {
  /** コスト内訳データ（メンバー別） */
  data: CostBreakdownItem[];
  /** チャートタイトル */
  title: string;
}

// 内部状態: なし
// レンダリングロジック:
// - ResponsiveContainer width="100%" height={350}
// - PieChart > Pie:
//   - dataKey="cost"
//   - nameKey="name"
//   - innerRadius={60}（ドーナツ形状）
//   - outerRadius={120}
//   - 各セグメントに <Cell fill={item.color} /> を適用
// - 中心テキスト: 合計金額を表示
// - Tooltip: "メンバー名: ¥XX万 (YY%)" フォーマット
// - Legend: 右側に縦並びで表示
```

---

## 3.6 ルーティング設計

### ルート定義一覧

| パス | ページコンポーネント | 認証 | 説明 |
|------|---------------------|------|------|
| `/` | — | — | 認証状態に応じて `/dashboard` または `/login` にリダイレクト |
| `/login` | `LoginPage` | 不要（公開） | ログイン画面 |
| `/dashboard` | `DashboardPage` | 必要 | ダッシュボード |
| `/members` | `MembersPage` | 必要 | メンバー一覧 |
| `/projects` | `ProjectsPage` | 必要 | プロジェクト一覧 |
| `/projects/:id` | `ProjectDetailPage` | 必要 | プロジェクト詳細（ガントチャート） |
| `/budget` | `BudgetPage` | 必要 | 予算ダッシュボード |

---

### ProtectedRoute コンポーネント

認証済みユーザーのみがアクセスできるルートを保護するラッパーコンポーネント。

```typescript
import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";

/**
 * ProtectedRoute
 *
 * - isAuthenticated=false の場合、/login へリダイレクト
 * - isAuthenticated=true の場合、子ルート（<Outlet />）をレンダリング
 */
export function ProtectedRoute() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
```

---

### React Router 設定（App.tsx）

```typescript
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";
import { MainLayout } from "./components/layout/MainLayout";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { MembersPage } from "./pages/MembersPage";
import { ProjectsPage } from "./pages/ProjectsPage";
import { ProjectDetailPage } from "./pages/ProjectDetailPage";
import { BudgetPage } from "./pages/BudgetPage";
import { useAuthStore } from "./stores/authStore";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,        // 1分間キャッシュ
      retry: 1,                     // リトライ1回
      refetchOnWindowFocus: false,  // ウィンドウフォーカス時の再取得を無効
    },
  },
});

/** ルートリダイレクト: 認証状態に応じて振り分け */
function RootRedirect() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* ルートリダイレクト */}
          <Route path="/" element={<RootRedirect />} />

          {/* 公開ルート */}
          <Route path="/login" element={<LoginPage />} />

          {/* 認証必須ルート */}
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/members" element={<MembersPage />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/projects/:id" element={<ProjectDetailPage />} />
              <Route path="/budget" element={<BudgetPage />} />
            </Route>
          </Route>

          {/* 404 フォールバック */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
```

---

### ルーティングフロー図

```
ユーザーアクセス
    │
    ├─ / ──────────────────┐
    │                      ▼
    │              isAuthenticated?
    │              ├─ true  → /dashboard
    │              └─ false → /login
    │
    ├─ /login ────────────── LoginPage（公開）
    │                        └─ ログイン成功 → /dashboard へ遷移
    │
    └─ /dashboard, /members, /projects, /projects/:id, /budget
                   │
                   ▼
           ProtectedRoute
           ├─ isAuthenticated=false → /login へリダイレクト
           └─ isAuthenticated=true  → MainLayout > 各ページ
```
