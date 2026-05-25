import { cn, STATUS_STYLES } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const style = STATUS_STYLES[status] ?? {
    label: status,
    className: "bg-gray-100 text-gray-700 border-gray-200",
  };

  return (
    <span
      className={cn(
        "badge",          // uses the .badge class from globals.css
        style.className,
        className
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {style.label}
    </span>
  );
}
