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

/**
 * 按高度收放，不量高度：外面这一层是只有一行的网格，行高在 `0fr` 和 `1fr` 之间过渡；
 * 里面再套一层 `collapseInner`，裁掉还放不下的那一截。表格的明细行、字段下面的错误文字
 * 都这么收放——内容后来变高了也跟着走。
 *
 * 展开 300ms、收起 200ms。收起由 `data-leaving` 触发，配 `usePresence`：收完再卸载。
 */
export const collapse = [
  "grid grid-rows-[1fr]",
  "transition-[grid-template-rows] duration-(--duration-base) ease-standard",
  "data-leaving:grid-rows-[0fr] data-leaving:duration-(--duration-fast)",
].join(" ");

/**
 * 展开的起点，写在 `@starting-style` 里：元素一挂上就从 0 长出来，展开到一半又收起时
 * 过渡从半路折回去。只给后来才出现的加（`usePresence` 的 `entered`）——一开始就展开着的，
 * 不该在载入时播一遍。不支持它的旧浏览器只是没有展开的过程。
 */
export const collapseEnter = "starting:grid-rows-[0fr]";

/** 只裁纵向：横向照旧，里面的东西该多宽还是多宽 */
export const collapseInner = "min-h-0 min-w-0 overflow-y-clip";

/** 小件的淡入，200ms：切过来的页签面板、新加的标签、新选的文件 */
export const fadeInFast =
  "animate-fade-in [animation-duration:var(--duration-fast)]";
