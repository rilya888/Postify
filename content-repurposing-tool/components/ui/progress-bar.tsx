import { Progress } from "@/components/ui/progress";

type ProgressBarProps = {
  value: number;
  label?: string;
  description?: string;
};

export function ProgressBar({ value, label, description }: ProgressBarProps) {
  return (
    <div className="space-y-2">
      {label && <p className="text-sm font-medium">{label}</p>}
      <Progress value={value} className="w-full" />
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </div>
  );
}