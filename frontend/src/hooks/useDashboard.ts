import { useQuery } from "@tanstack/react-query";
import * as projectsApi from "../api/projects";

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: () => projectsApi.getDashboardSummary(),
    staleTime: 30 * 1000,
  });
}
