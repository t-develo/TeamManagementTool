export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
}

export interface DashboardSummary {
  total_projects: number;
  active_projects: number;
  total_members: number;
  active_members: number;
  total_budget: number;
  total_actual_cost: number;
  budget_consumption_rate: number;
  project_summaries: ProjectProgressSummary[];
}

export interface ProjectProgressSummary {
  project_id: string;
  project_name: string;
  status: string;
  progress: number;
  budget: number;
  actual_cost: number;
  budget_consumption_rate: number;
}
