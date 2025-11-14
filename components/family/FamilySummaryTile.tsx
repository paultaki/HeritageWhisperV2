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
        bg-white border border-gray-200 rounded-xl overflow-hidden
        ${isClickable ? "cursor-pointer hover:shadow-md transition-all duration-200 active:scale-[0.98]" : ""}
        ${isPrimary ? "bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200" : ""}
      `}
    >
      <div className="px-3.5 py-3 md:px-4 md:py-3.5">
        <div className="flex items-center gap-3">
          <div
            className={`
              inline-flex w-8 h-8 rounded-full items-center justify-center shrink-0
              ${isPrimary ? "bg-blue-600" : "bg-blue-100"}
            `}
          >
            <Icon className={`w-4 h-4 ${isPrimary ? "text-white" : "text-blue-600"}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-600 leading-tight">{label}</p>
            <p
              className={`
                text-xl md:text-2xl font-bold leading-none mt-0.5
                ${isPrimary ? "text-blue-700" : "text-gray-900"}
              `}
            >
              {value}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
