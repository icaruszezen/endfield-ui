/**
 * 浮层从触发它的那一侧来：进场的起点往触发处偏 `--motion-shift`，走完归位。
 * 用在基元的浮层面板上——它们带着 `data-side`（面板在触发元素的哪一侧）。
 *
 * 位移只写在 `data-starting-style` 上：退场不走位移，只淡出。
 * 用的地方自己给 `translate` 加过渡。`inline-start` / `inline-end` 按从左往右的排版算。
 */
export const enterFromSide = [
  "data-starting-style:data-[side=bottom]:-translate-y-(--motion-shift)",
  "data-starting-style:data-[side=top]:translate-y-(--motion-shift)",
  "data-starting-style:data-[side=right]:-translate-x-(--motion-shift)",
  "data-starting-style:data-[side=left]:translate-x-(--motion-shift)",
  "data-starting-style:data-[side=inline-end]:-translate-x-(--motion-shift)",
  "data-starting-style:data-[side=inline-start]:translate-x-(--motion-shift)",
].join(" ");
