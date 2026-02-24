export type TaskStatus = "not_started" | "in_progress" | "completed";

export interface Task {
  task_id: string;
  title: string;
  assignee_id: string;
  assignee_name?: string;
  man_days: number;
  progress: number;
  start_date: string;
  end_date: string;
  sort_order: number;
  status: TaskStatus;
  cost?: number;
}

export type TaskCreate = Omit<Task, "task_id" | "sort_order" | "assignee_name" | "cost">;
export type TaskUpdate = Partial<Omit<Task, "task_id" | "sort_order" | "assignee_name" | "cost">>;

export interface TaskReorderItem {
  task_id: string;
  sort_order: number;
}

export interface TaskAssignRequest {
  assignee_id: string;
}
