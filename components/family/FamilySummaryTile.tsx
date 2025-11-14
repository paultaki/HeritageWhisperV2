import { type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

type FamilySummaryTileProps = {
  icon: LucideIcon;
  label: string;
  value: string | number;
  variant?: "default" | "primary";
  onClick?: () => void;
};

export function FamilySummaryTile({
  icon: Icon,
  label,
  value,
  variant = "default",
  onClick,
}: FamilySummaryTileProps) {
  const isPrimary = variant === "primary";
  const isClickable = !!onClick;

  return (
    <Card
      onClick={onClick}
      className={`
        rounded-2xl shadow-sm
        ${isClickable ? "cursor-pointer hover:shadow-md transition-all duration-200 active:scale-[0.98]" : ""}
        ${isPrimary ? "bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200" : "bg-white border border-gray-200"}
      `}
    >
      <div className="flex flex-col items-center justify-center gap-2 py-4 md:py-5">
        {/* Row 1: Icon + Label */}
        <div className="flex items-center gap-2">
          <span
            className={`
              inline-flex h-8 w-8 items-center justify-center rounded-full shrink-0
              ${isPrimary ? "bg-blue-600" : "bg-slate-100"}
            `}
          >
            <Icon className={`h-4 w-4 ${isPrimary ? "text-white" : "text-slate-700"}`} />
          </span>
          <span className="text-sm md:text-base font-medium text-slate-700">
            {label}
          </span>
        </div>

        {/* Row 2: Value */}
        <span
          className={`
            text-xl md:text-2xl font-semibold
            ${isPrimary ? "text-blue-600" : "text-slate-900"}
          `}
        >
          {value}
        </span>
      </div>
    </Card>
  );
}
