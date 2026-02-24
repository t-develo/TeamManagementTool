import { ProgressBar } from "../common/ProgressBar";

interface UtilizationBarProps {
  rate: number;
}

export function UtilizationBar({ rate }: UtilizationBarProps) {
  let color: string;
  if (rate < 70) color = "#10B981";
  else if (rate < 90) color = "#F59E0B";
  else color = "#EF4444";

  return <ProgressBar value={rate} max={100} color={color} showLabel />;
}
