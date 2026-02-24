import type { Task } from "./task";

export type ProjectStatus = "planning" | "active" | "completed" | "on_hold";

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

export type ProjectCreate = Omit<
  Project,
  "id" | "tasks" | "actual_cost" | "progress" | "created_at" | "updated_at"
>;
export type ProjectUpdate = Partial<ProjectCreate>;

export interface ProjectListParams {
  page?: number;
  per_page?: number;
  status?: ProjectStatus;
}

export interface ProjectCost {
  project_id: string;
  project_name: string;
  budget: number;
  actual_cost: number;
  remaining_budget: number;
  task_costs: {
    task_id: string;
    task_title: string;
    assignee_name: string;
    man_days: number;
    daily_rate: number;
    cost: number;
  }[];
}

export interface BudgetVsActualData {
  project_id: string;
  project_name: string;
  budget: number;
  actual_cost: number;
  budget_consumption_rate: number;
  remaining_budget: number;
  status: string;
}
