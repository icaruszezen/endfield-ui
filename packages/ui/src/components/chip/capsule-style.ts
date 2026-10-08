/*
 * 可选中的胶囊：细边，选中时反转为墨底。
 * 筛选胶囊与页签的 `capsule` 变体是同一个外观，类名放在一处免得两边走样。
 */

export type CapsuleSize = "sm" | "md";

export const capsuleBase =
  "inline-flex shrink-0 items-center rounded-full border leading-none font-medium whitespace-nowrap transition-colors duration-(--duration-fast) ease-standard";

export const capsuleSize: Record<CapsuleSize, string> = {
  sm: "h-7 px-3 text-xs",
  md: "h-8 px-4 text-sm",
};

export const capsuleState = {
  selected: "border-transparent bg-surface-inverse text-ink-inverse",
  rest: "border-line-strong text-ink hover:bg-ink/5",
  disabled: "cursor-not-allowed border-line text-ink-disabled",
  selectedDisabled:
    "cursor-not-allowed border-transparent bg-disabled text-on-disabled",
} as const;
