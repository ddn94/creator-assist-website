export const statusPill = {
  notInvoiced: "bg-card text-muted",
  awaiting: "bg-idea-pill text-[#1a1d21]",
  overdue: "bg-danger text-on-primary",
  paid: "bg-primary text-on-primary",
} as const;

export type Category = "organic" | "idea" | "paid" | "payment";

export const categoryCard = {
  organic: "bg-organic text-ink",
  idea: "bg-idea text-ink",
  paid: "bg-collab text-ink",
  payment: "bg-payment text-ink",
} as const satisfies Record<Category, string>;

export const categoryPill = {
  organic: "bg-organic-pill text-ink",
  idea: "bg-idea-pill text-ink",
  paid: "bg-primary text-on-primary",
  payment: "bg-payment-pill text-ink",
} as const satisfies Record<Category, string>;
