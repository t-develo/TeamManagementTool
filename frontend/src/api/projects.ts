import { get, post, put, del } from "./client";
import type { Project, ProjectCreate, ProjectUpdate, ProjectListParams, ProjectCost, BudgetVsActualData } from "../types/project";
import type { PaginatedResponse, DashboardSummary } from "../types/common";

export const getProjects = (params?: ProjectListParams) =>
  get<PaginatedResponse<Project>>("/projects", { params });

export const getProject = (id: string) => get<Project>(`/projects/${id}`);

export const createProject = (data: ProjectCreate) => post<Project>("/projects", data);

export const updateProject = (id: string, data: ProjectUpdate) =>
  put<Project>(`/projects/${id}`, data);

export const deleteProject = (id: string) => del<void>(`/projects/${id}`);

export const getProjectCost = (id: string) => get<ProjectCost>(`/projects/${id}/cost`);

export const getBudgetVsActual = (id: string) =>
  get<BudgetVsActualData>(`/projects/${id}/budget-vs-actual`);

export const getDashboardSummary = () => get<DashboardSummary>("/dashboard/summary");
