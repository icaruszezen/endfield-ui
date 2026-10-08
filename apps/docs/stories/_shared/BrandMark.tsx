/**
 * 演示用的原创标志：一块被斜切了一刀的方块，旁边是虚构的队名。
 * 不对应任何官方标志。`compact` 时只剩方块（收起的侧轨里）；
 * `"auto"` 是视口很窄时才收（顶栏里，给主行动和菜单钮让位置）。
 */
export function BrandMark({ compact = false }: { compact?: boolean | "auto" }) {
  return (
    <span className="flex items-center gap-2.5 text-ink">
      <svg
        width="28"
        height="28"
        viewBox="0 0 28 28"
        aria-hidden="true"
        className="shrink-0"
      >
        <path d="M2 2h24v24H2z" fill="currentColor" />
        <path d="M2 26 26 2v7L9 26z" className="fill-surface" />
      </svg>
      {compact !== true && (
        <span
          aria-hidden="true"
          className={
            compact === "auto"
              ? "font-display text-sm font-extrabold tracking-label whitespace-nowrap uppercase max-[379px]:hidden"
              : "font-display text-sm font-extrabold tracking-label whitespace-nowrap uppercase"
          }
        >
          Seventh
        </span>
      )}
      <span className="sr-only">第七勘探队</span>
    </span>
  );
}
