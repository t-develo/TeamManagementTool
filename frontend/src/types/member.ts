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

export type MemberCreate = Omit<Member, "id" | "created_at" | "updated_at">;
export type MemberUpdate = Partial<MemberCreate>;

export interface MemberUtilizationTask {
  task_id: string;
  task_title: string;
  project_name: string;
  man_days: number;
  working_days_in_month: number;
  contribution: number;
}

export interface MemberUtilization {
  member_id: string;
  member_name: string;
  year: number;
  month: number;
  total_working_days: number;
  utilization_percent: number;
  task_details: MemberUtilizationTask[];
}

export interface MemberListParams {
  page?: number;
  per_page?: number;
  search?: string;
  department?: string;
  is_active?: boolean;
}
