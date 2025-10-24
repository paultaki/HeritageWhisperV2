export type Severity = "low" | "medium" | "high";
export function toSeverity(v: string | undefined): Severity | undefined {
  if (!v) return undefined;
  const s = v.toLowerCase();
  return s === "low" || s === "medium" || s === "high" ? s : undefined;
}
