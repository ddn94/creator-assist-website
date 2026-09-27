import type { Category } from "@/lib/ui";

export type IdeaStatus = "idea" | "in_progress" | "used";

export type IdeaItem = {
  id: string;
  creatorId: string;
  title: string;
  body: string;
  tags: string[];
  status: IdeaStatus;
  createdAt: string;
  linkedContentItemId: string | null;
};

export const IDEA_STATUSES = ["idea", "in_progress", "used"] as const;

export const IDEA_STATUS_LABELS: Record<IdeaStatus, string> = {
  idea: "Idea",
  in_progress: "In progress",
  used: "Used",
};

export const IDEA_STATUS_OPTIONS = IDEA_STATUSES.map((status) => ({
  value: status,
  label: IDEA_STATUS_LABELS[status],
}));

export function ideaStatusCategory(status: IdeaStatus): Category {
  if (status === "used") return "paid";
  if (status === "in_progress") return "organic";
  return "idea";
}

export function parseTags(value: string): string[] {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function formatIdeaDate(isoDate: string): string {
  return new Date(`${isoDate}T12:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
