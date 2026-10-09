import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type KeyboardEvent,
} from "react";
import { useControllableState } from "../../hooks/useControllableState";
import { ChevronLeft } from "../../icons/ChevronLeft";
import { ChevronRight } from "../../icons/ChevronRight";
import { cn } from "../../lib/cn";
import {
  addDays,
  addMonths,
  addMonthsToMonth,
  clampDate,
  dateParts,
  monthGrid,
  monthOf,
  orderDates,
  startOfWeek,
  toDateObject,
  today as localToday,
} from "../../lib/date";
import { focusRingInset } from "../../lib/focus-ring";
import { IconButton } from "../icon-button/IconButton";

/** 一段日期：`[起, 止]`，两头都包含。只有一天时两个一样 */
export type DateRange = [start: string, end: string];

type CalendarBaseProps = Omit<
  ComponentProps<"div">,
  "defaultValue" | "onChange"
> & {
  /** 现在显示的月份，`YYYY-MM`。不传时跟着选中的那一天（没选就是今天） */
  month?: string;
  defaultMonth?: string;
  onMonthChange?: (month: string) => void;
  /** 能选的最早一天 */
  min?: string;
  /** 能选的最晚一天 */
  max?: string;
  /** 返回真的日子不可选（比如周末、已经约满的日子） */
  isDateDisabled?: (date: string) => boolean;
  /** 一周从哪天开始：1 是星期一（默认），0 是星期日 */
  weekStartsOn?: 0 | 1;
  /** 月份标题、星期、读屏听到的日期名称按它走。默认 `zh-CN` */
  locale?: string;
  /** 哪一天算"今天"。默认取本地时间；服务端渲染或要一个固定的今天时自己传 */
  today?: string;
  previousLabel?: string;
  nextLabel?: string;
};

export type CalendarSingleProps = CalendarBaseProps & {
  range?: false;
  /** 选中的那一天，`YYYY-MM-DD`；没选是 `null` */
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string) => void;
  startLabel?: never;
  endLabel?: never;
  pendingLabel?: never;
};

export type CalendarRangeProps = CalendarBaseProps & {
  /** 选一段：点两下，第一下定起始日，第二下定结束日 */
  range: true;
  /** 选中的那一段，`[起, 止]`；没选是 `null` */
  value?: DateRange | null;
  defaultValue?: DateRange | null;
  /** 只在一段选完时触发；后点的那天更早也会排成先后 */
  onValueChange?: (value: DateRange) => void;
  /** 读屏在两端那两天的名称后面听到的词，默认"起始日""结束日" */
  startLabel?: string;
  endLabel?: string;
  /** 起始日定了之后的那句播报，默认"再选结束日" */
  pendingLabel?: string;
};

export type CalendarProps = CalendarSingleProps | CalendarRangeProps;

type Selection = string | DateRange | null;

const UTC = { timeZone: "UTC" } as const;

/** 值有没有变：一段日期每次都是新数组，要按内容比 */
const keyOf = (value: Selection) =>
  value === null ? "" : typeof value === "string" ? value : value.join("/");

/** 键盘把焦点挪到哪一天。返回 `null` 是这个键不归月历管 */
function moveFocus(
  event: KeyboardEvent,
  from: string,
  weekStartsOn: 0 | 1,
): string | null {
  switch (event.key) {
    case "ArrowLeft":
      return addDays(from, -1);
    case "ArrowRight":
      return addDays(from, 1);
    case "ArrowUp":
      return addDays(from, -7);
    case "ArrowDown":
      return addDays(from, 7);
    case "Home":
      return startOfWeek(from, weekStartsOn);
    case "End":
      return addDays(startOfWeek(from, weekStartsOn), 6);
    case "PageUp":
      return addMonths(from, event.shiftKey ? -12 : -1);
    case "PageDown":
      return addMonths(from, event.shiftKey ? 12 : 1);
    default:
      return null;
  }
}

/**
 * 月历：选一天；加 `range` 是选一段。日期是 `YYYY-MM-DD` 的字符串。
 * 要一个带面板的字段用 `DatePicker` / `DateRangePicker`。
 */
export function Calendar({
  range = false,
  value: valueProp,
  defaultValue = null,
  onValueChange,
  month: monthProp,
  defaultMonth,
  onMonthChange,
  min,
  max,
  isDateDisabled,
  weekStartsOn = 1,
  locale = "zh-CN",
  today: todayProp,
  previousLabel = "上个月",
  nextLabel = "下个月",
  startLabel = "起始日",
  endLabel = "结束日",
  pendingLabel = "再选结束日",
  className,
  ...props
}: CalendarProps) {
  const titleId = useId();
  const gridRef = useRef<HTMLTableSectionElement>(null);
  const [today] = useState(() => todayProp ?? localToday());
  const currentDay = todayProp ?? today;

  const [value, setValue] = useControllableState<Selection>({
    value: valueProp,
    defaultValue,
    onChange: (next) => {
      if (next !== null) {
        (onValueChange as ((value: string | DateRange) => void) | undefined)?.(
          next,
        );
      }
    },
  });
  // 一段的两头；选一天时两头是同一天
  const committed: DateRange | null =
    value === null ? null : typeof value === "string" ? [value, value] : value;

  // 选一段时：起始日定了、结束日还没定
  const [anchor, setAnchor] = useState<string | null>(null);
  // 指针停在哪一天（预览用）；键盘的位置在 focused 里
  const [hovered, setHovered] = useState<string | null>(null);

  // 键盘停在哪一天：整个网格只有它能被 Tab 停到
  const [focused, setFocused] = useState(() =>
    clampDate(committed?.[0] ?? currentDay, min, max),
  );
  const [month, setMonth] = useControllableState({
    value: monthProp,
    defaultValue: defaultMonth ?? monthOf(focused),
    onChange: onMonthChange,
  });
  // 键盘移动之后要把焦点交给新的那一格；鼠标翻月不抢焦点
  const pendingFocus = useRef(false);

  // 从外面换了值（受控）：月历跟过去。自己选出来的不算——刚点的那天已经在眼前了
  const valueKey = keyOf(value);
  const lastKey = useRef(valueKey);
  const start = committed?.[0] ?? null;
  useEffect(() => {
    if (valueKey === lastKey.current) return;
    lastKey.current = valueKey;
    setAnchor(null);
    if (start === null) return;
    setFocused(start);
    setMonth(monthOf(start));
  }, [valueKey, start, setMonth]);

  useEffect(() => {
    if (!pendingFocus.current) return;
    pendingFocus.current = false;
    gridRef.current
      ?.querySelector<HTMLElement>(`[data-date="${focused}"]`)
      ?.focus();
  }, [focused, month]);

  const weeks = useMemo(
    () => monthGrid(month, weekStartsOn),
    [month, weekStartsOn],
  );

  const formats = useMemo(
    () => ({
      title: new Intl.DateTimeFormat(locale, {
        ...UTC,
        year: "numeric",
        month: "long",
      }),
      weekdayShort: new Intl.DateTimeFormat(locale, {
        ...UTC,
        weekday: "narrow",
      }),
      weekdayLong: new Intl.DateTimeFormat(locale, { ...UTC, weekday: "long" }),
      day: new Intl.DateTimeFormat(locale, { ...UTC, dateStyle: "full" }),
    }),
    [locale],
  );

  const unavailable = (date: string) =>
    (min !== undefined && date < min) ||
    (max !== undefined && date > max) ||
    (isDateDisabled?.(date) ?? false);

  const focusDate = (date: string) => {
    const next = clampDate(date, min, max);
    pendingFocus.current = true;
    setFocused(next);
    if (monthOf(next) !== month) setMonth(monthOf(next));
  };

  const commit = (next: string | DateRange) => {
    lastKey.current = keyOf(next);
    setValue(next);
  };

  const select = (date: string) => {
    if (unavailable(date)) return;
    setFocused(date);
    if (monthOf(date) !== month) setMonth(monthOf(date));
    if (!range) {
      commit(date);
    } else if (anchor === null) {
      setAnchor(date);
    } else {
      setAnchor(null);
      commit(orderDates(anchor, date));
    }
  };

  const turn = (months: number) => {
    const next = addMonthsToMonth(month, months);
    setMonth(next);
    // 停靠点跟到新的月份里同一天（没有那一天就落在月末），否则 Tab 进不来
    setFocused(clampDate(addMonths(focused, months), min, max));
  };

  const firstOfMonth = `${month}-01`;
  const previousDisabled = min !== undefined && addDays(firstOfMonth, -1) < min;
  const nextDisabled = max !== undefined && addMonths(firstOfMonth, 1) > max;

  // 停靠点不在眼前这个月（鼠标翻了月）时，借给这个月的第一天
  const tabStop = weeks.flat().includes(focused) ? focused : firstOfMonth;

  // 现在画的是哪一段：起始日定了就只画它（原来那一段先让开），预览到指针或键盘所在的那天
  const shown: DateRange | null =
    anchor !== null ? [anchor, anchor] : committed;
  const preview =
    anchor !== null ? orderDates(anchor, hovered ?? focused) : null;

  return (
    <div
      {...props}
      data-month={month}
      data-range={range ? "" : undefined}
      data-pending={anchor !== null ? "" : undefined}
      className={cn("inline-flex flex-col gap-1 text-ink", className)}
    >
      <div className="flex items-center justify-between gap-2">
        <IconButton
          size="sm"
          aria-label={previousLabel}
          disabled={previousDisabled}
          onClick={() => turn(-1)}
        >
          <ChevronLeft />
        </IconButton>
        <div
          id={titleId}
          aria-live="polite"
          className="text-sm font-bold tabular-nums"
        >
          {formats.title.format(toDateObject(firstOfMonth))}
        </div>
        <IconButton
          size="sm"
          aria-label={nextLabel}
          disabled={nextDisabled}
          onClick={() => turn(1)}
        >
          <ChevronRight />
        </IconButton>
      </div>

      <table
        role="grid"
        aria-labelledby={titleId}
        aria-multiselectable={range || undefined}
        className="border-separate border-spacing-0"
      >
        <thead>
          <tr>
            {weeks[0]!.map((date) => (
              <th
                key={date}
                scope="col"
                abbr={formats.weekdayLong.format(toDateObject(date))}
                className="h-8 w-10 text-xs font-normal text-ink-tertiary"
              >
                {formats.weekdayShort.format(toDateObject(date))}
              </th>
            ))}
          </tr>
        </thead>
        <tbody
          ref={gridRef}
          onPointerLeave={() => setHovered(null)}
          onKeyDown={(event) => {
            // 起始日定了之后按 Esc：取消这一次，回到原来的那一段
            if (event.key === "Escape" && anchor !== null) {
              setAnchor(null);
              return;
            }
            const next = moveFocus(event, focused, weekStartsOn);
            if (next === null) return;
            event.preventDefault();
            // 键盘动了，预览跟着键盘走
            setHovered(null);
            focusDate(next);
          }}
        >
          {weeks.map((week) => (
            <tr key={week[0]}>
              {week.map((date) => {
                const isStart = shown !== null && date === shown[0];
                const isEnd = shown !== null && date === shown[1];
                const endpoint = isStart || isEnd;
                const between =
                  shown !== null && date > shown[0] && date < shown[1];
                const previewing =
                  preview !== null &&
                  !endpoint &&
                  date >= preview[0] &&
                  date <= preview[1];
                const isToday = date === currentDay;
                const outside = monthOf(date) !== month;
                const disabled = unavailable(date);
                const name = [
                  formats.day.format(toDateObject(date)),
                  range && isStart && startLabel,
                  range && isEnd && endLabel,
                ]
                  .filter(Boolean)
                  .join("，");
                return (
                  <td
                    key={date}
                    role="gridcell"
                    aria-selected={endpoint || between}
                    className="p-0"
                  >
                    <button
                      type="button"
                      data-date={date}
                      data-today={isToday ? "" : undefined}
                      data-outside={outside ? "" : undefined}
                      data-range-start={range && isStart ? "" : undefined}
                      data-range-end={range && isEnd ? "" : undefined}
                      data-in-range={between ? "" : undefined}
                      data-preview={previewing ? "" : undefined}
                      tabIndex={date === tabStop ? 0 : -1}
                      aria-label={name}
                      aria-current={isToday ? "date" : undefined}
                      // 不可选的日子仍然走得到：读屏要能读到它，只是选不了
                      aria-disabled={disabled || undefined}
                      onClick={() => select(date)}
                      onFocus={() => setFocused(date)}
                      onPointerEnter={
                        range ? () => setHovered(date) : undefined
                      }
                      className={cn(
                        "relative flex size-10 items-center justify-center font-tech text-sm tabular-nums",
                        "transition-colors duration-(--duration-fast) ease-standard",
                        focusRingInset,
                        endpoint
                          ? "bg-surface-inverse font-bold text-ink-inverse"
                          : [
                              // 一段的中间是连着的浅带；还没定结束日时是更浅的预览
                              between ? "bg-ink/10" : previewing && "bg-ink/5",
                              disabled
                                ? "cursor-not-allowed text-ink-disabled line-through"
                                : [
                                    outside ? "text-ink-tertiary" : "text-ink",
                                    between
                                      ? "hover:bg-ink/15"
                                      : "hover:bg-ink/5",
                                  ],
                            ],
                        // 今天：数字下面一条短线，不只是换个字色
                        isToday &&
                          "after:absolute after:bottom-1.5 after:left-1/2 after:h-0.5 after:w-3 after:-translate-x-1/2 after:content-['']",
                        isToday &&
                          (endpoint
                            ? "after:bg-accent-ink-inverse"
                            : "after:bg-accent-ink"),
                      )}
                    >
                      {dateParts(date).day}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {range && (
        // 起始日定了之后告诉读屏下一步做什么；看得见的人有那块实心的起始日和跟着走的浅带
        <div aria-live="polite" className="sr-only">
          {anchor !== null &&
            `${formats.day.format(toDateObject(anchor))}，${startLabel}。${pendingLabel}`}
        </div>
      )}
    </div>
  );
}
