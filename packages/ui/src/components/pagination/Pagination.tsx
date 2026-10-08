import {
  useState,
  type ChangeEvent,
  type ComponentProps,
  type KeyboardEvent,
} from "react";
import { useControllableState } from "../../hooks/useControllableState";
import { ChevronLeft } from "../../icons/ChevronLeft";
import { ChevronRight } from "../../icons/ChevronRight";
import { cn } from "../../lib/cn";
import { focusRing } from "../../lib/focus-ring";
import { IconButton, type IconButtonSize } from "../icon-button/IconButton";

export type PaginationSize = "md" | "lg";

export type PaginationProps = Omit<
  ComponentProps<"nav">,
  "children" | "onChange"
> & {
  /** 受控的当前页，从 1 起 */
  page?: number;
  /** 非受控时的初始页，默认 1 */
  defaultPage?: number;
  onPageChange?: (page: number) => void;
  /** 总页数 */
  pageCount: number;
  /** 页码处换成输入框：输入页码后回车或失焦跳页，Esc 还原 */
  jump?: boolean;
  /** 条高 48 或 56px */
  size?: PaginationSize;
  prevLabel?: string;
  nextLabel?: string;
  /** 跳页输入框的可访问名称 */
  jumpLabel?: string;
  /** 读屏听到的当前位置，默认"第 1 页，共 12 页" */
  pageLabel?: (page: number, pageCount: number) => string;
};

const barSize: Record<PaginationSize, string> = {
  md: "h-12",
  lg: "h-14",
};

/* 方钮比条高小 8px */
const buttonSize: Record<PaginationSize, IconButtonSize> = {
  md: "md",
  lg: "lg",
};

const defaultPageLabel = (page: number, pageCount: number) =>
  `第 ${page} 页，共 ${pageCount} 页`;

/**
 * 分页条：浅灰斜纹条，两端是方钮，中间是 `01 / 12`。
 * 不列一长串数字按钮；要跳页就打开 `jump`，在页码处直接输入。
 */
export function Pagination({
  page,
  defaultPage = 1,
  onPageChange,
  pageCount,
  jump = false,
  size = "md",
  prevLabel = "上一页",
  nextLabel = "下一页",
  jumpLabel = "跳到第几页",
  pageLabel = defaultPageLabel,
  className,
  ...props
}: PaginationProps) {
  const total = Math.max(1, Math.floor(pageCount));
  const clamp = (next: number) => Math.min(Math.max(next, 1), total);

  const [inner, setPage] = useControllableState({
    value: page,
    defaultValue: defaultPage,
    onChange: onPageChange,
  });
  const current = clamp(inner);

  // 输入到一半的页码：不为 null 时输入框显示它
  const [draft, setDraft] = useState<string | null>(null);

  // 至少两位，补零；总页数上百时跟着加宽
  const digits = Math.max(2, String(total).length);
  const pad = (value: number) => String(value).padStart(digits, "0");

  const go = (next: number) => setPage(clamp(next));

  const commitDraft = () => {
    if (draft === null) return;
    const typed = Number.parseInt(draft, 10);
    setDraft(null);
    if (Number.isFinite(typed)) go(typed);
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setDraft(event.target.value.replace(/\D/g, "").slice(0, digits + 1));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      commitDraft();
    } else if (event.key === "Escape") {
      setDraft(null);
    }
  };

  const squareClass = "bg-surface-raised shadow-sm";

  return (
    <nav
      aria-label="分页"
      {...props}
      data-size={size}
      className={cn(
        "@container hatch flex items-center justify-between gap-2 bg-surface-muted px-1 text-ink",
        barSize[size],
        className,
      )}
    >
      <IconButton
        variant="accent"
        size={buttonSize[size]}
        aria-label={prevLabel}
        disabled={current <= 1}
        onClick={() => go(current - 1)}
        className={squareClass}
      >
        <ChevronLeft />
      </IconButton>

      {/* 很窄的容器里页码小一档，三位数的页码才放得下 */}
      <div className="flex min-w-0 items-center gap-2 font-display text-base leading-none whitespace-nowrap tabular-nums @2xs:text-lg">
        {/* 看得见的 01 / 12 对读屏隐藏，换成一句完整的话，翻页时播报 */}
        <span className="sr-only" aria-live="polite">
          {pageLabel(current, total)}
        </span>
        {jump ? (
          <input
            type="text"
            inputMode="numeric"
            autoComplete="off"
            aria-label={jumpLabel}
            value={draft ?? pad(current)}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onBlur={commitDraft}
            onFocus={(event) => event.target.select()}
            style={{ width: `calc(${digits}ch + 0.75rem)` }}
            className={cn(
              "h-8 border-b-2 border-line-strong bg-surface-raised text-center font-bold text-ink",
              "transition-colors duration-(--duration-fast) ease-standard",
              "hover:not-focus:border-ink-secondary focus:border-ink",
              focusRing,
            )}
          />
        ) : (
          <span aria-hidden="true" className="font-bold">
            {pad(current)}
          </span>
        )}
        <span aria-hidden="true" className="font-medium text-ink-secondary">
          {`/ ${pad(total)}`}
        </span>
      </div>

      <IconButton
        variant="accent"
        size={buttonSize[size]}
        aria-label={nextLabel}
        disabled={current >= total}
        onClick={() => go(current + 1)}
        className={squareClass}
      >
        <ChevronRight />
      </IconButton>
    </nav>
  );
}
