/*
 * 复选、单选、开关共用的一行：真正的 <input> 画成控件本身，文字标签在右，
 * 点击标签等同点击控件，整行不低于 40px。
 */

export const choiceLabel =
  "group inline-flex min-h-10 items-start gap-2 py-2 text-base text-ink has-disabled:cursor-not-allowed has-disabled:text-ink-disabled";

/** 控件的定位盒：高度等于一行文字，标签换行时控件仍然对齐第一行 */
export const choiceControl = "flex h-[1lh] shrink-0 items-center";

/*
 * 复选框与单选框的方格 / 圆：
 * 未选是凹陷底 + 2px 描边；已选是反转块，上面压 accent-ink-inverse 的记号——
 * 亮色下是墨底黄记号，暗色下反转块是近白，记号换成深色档。
 */
export const choiceBox =
  "peer size-5 shrink-0 appearance-none border-2 border-line-strong bg-surface-sunken transition-colors duration-(--duration-fast) ease-standard group-hover:border-ink-secondary checked:border-surface-inverse checked:bg-surface-inverse aria-invalid:border-danger disabled:cursor-not-allowed disabled:border-ink-disabled disabled:bg-surface-sunken";

/** 压在方格 / 圆正中的记号，默认透明，由 peer 的状态点亮 */
export const choiceMark =
  "pointer-events-none absolute inset-0 m-auto text-accent-ink-inverse opacity-0 peer-disabled:text-ink-disabled";
