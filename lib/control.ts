export const controlSizes = {
  sm: "h-10 px-3",
  md: "h-12 px-3.5",
  lg: "h-14 px-5",
} as const;

export const controlText = {
  sm: "text-sm",
  md: "text-sm",
  lg: "text-base",
} as const;

export const fieldText = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
} as const;

export type ControlSize = keyof typeof controlSizes;
