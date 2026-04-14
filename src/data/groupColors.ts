export const GROUP_COLORS = [
  "#3b82f6", // blue
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#06b6d4", // cyan
  "#f97316", // orange
  "#ec4899", // pink
];

/** Pick the next color from the palette that isn't already used by existing groups. */
export function nextGroupColor(usedColors: string[]): string {
  const unused = GROUP_COLORS.find((c) => !usedColors.includes(c));
  return unused ?? GROUP_COLORS[usedColors.length % GROUP_COLORS.length];
}

/** Render a group color as a light badge background (hex + 18% alpha). Falls back to gray-100 for no-color groups. */
export function groupBadgeBg(color: string): string {
  return color ? `${color}2e` : "#f3f4f6";
}

/** Render a group color as badge text color. Falls back to gray-500 for no-color groups. */
export function groupBadgeColor(color: string): string {
  return color || "#6b7280";
}
