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
  startOfWeek,
  toDateObject,
  today as localToday,
} from "../../lib/date";
import { focusRingInset } from "../../lib/focus-ring";
import { IconButton } from "../icon-button/IconButton";

export type CalendarProps = Omit<
  ComponentProps<"div">,
  "defaultValue" | "onChange"
> & {
  /** 选中的那一天，`YYYY-MM-DD`；没选是 `null` */
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string) => void;
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

const UTC = { timeZone: "UTC" } as const;

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
 * 月历：选一天。值是 `YYYY-MM-DD` 的字符串。
 * 要一个带面板的字段用 `DatePicker`。
 */
export function Calendar({
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
  className,
  ...props
}: CalendarProps) {
  const titleId = useId();
  const gridRef = useRef<HTMLTableSectionElement>(null);
  const [today] = useState(() => todayProp ?? localToday());
  const currentDay = todayProp ?? today;

  const [value, setValue] = useControllableState<string | null>({
    value: valueProp,
    defaultValue,
    onChange: (next) => {
      if (next !== null) onValueChange?.(next);
    },
  });

  // 键盘停在哪一天：整个网格只有它能被 Tab 停到
  const [focused, setFocused] = useState(() =>
    clampDate(value ?? currentDay, min, max),
  );
  const [month, setMonth] = useControllableState({
    value: monthProp,
    defaultValue: defaultMonth ?? monthOf(focused),
    onChange: onMonthChange,
  });
  // 键盘移动之后要把焦点交给新的那一格；鼠标翻月不抢焦点
  const pendingFocus = useRef(false);

  // 从外面换了值（受控）：月历跟过去
  const lastValue = useRef(value);
  useEffect(() => {
    if (value === lastValue.current) return;
    lastValue.current = value;
    if (value === null) return;
    setFocused(value);
    setMonth(monthOf(value));
  }, [value, setMonth]);

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

  const select = (date: string) => {
    if (unavailable(date)) return;
    setFocused(date);
    if (monthOf(date) !== month) setMonth(monthOf(date));
    setValue(date);
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

  return (
    <div
      {...props}
      data-month={month}
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
          onKeyDown={(event) => {
            const next = moveFocus(event, focused, weekStartsOn);
            if (next === null) return;
            event.preventDefault();
            focusDate(next);
          }}
        >
          {weeks.map((week) => (
            <tr key={week[0]}>
              {week.map((date) => {
                const selected = date === value;
                const isToday = date === currentDay;
                const outside = monthOf(date) !== month;
                const disabled = unavailable(date);
                return (
                  <td
                    key={date}
                    role="gridcell"
                    aria-selected={selected}
                    className="p-0"
                  >
                    <button
                      type="button"
                      data-date={date}
                      data-today={isToday ? "" : undefined}
                      data-outside={outside ? "" : undefined}
                      tabIndex={date === tabStop ? 0 : -1}
                      aria-label={formats.day.format(toDateObject(date))}
                      aria-current={isToday ? "date" : undefined}
                      // 不可选的日子仍然走得到：读屏要能读到它，只是选不了
                      aria-disabled={disabled || undefined}
                      onClick={() => select(date)}
                      onFocus={() => setFocused(date)}
                      className={cn(
                        "relative flex size-10 items-center justify-center font-tech text-sm tabular-nums",
                        "transition-colors duration-(--duration-fast) ease-standard",
                        focusRingInset,
                        selected
                          ? "bg-surface-inverse font-bold text-ink-inverse"
                          : disabled
                            ? "cursor-not-allowed text-ink-disabled line-through"
                            : [
                                outside ? "text-ink-tertiary" : "text-ink",
                                "hover:bg-ink/5",
                              ],
                        // 今天：数字下面一条短线，不只是换个字色
                        isToday &&
                          "after:absolute after:bottom-1.5 after:left-1/2 after:h-0.5 after:w-3 after:-translate-x-1/2 after:content-['']",
                        isToday &&
                          (selected
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
    </div>
  );
}
