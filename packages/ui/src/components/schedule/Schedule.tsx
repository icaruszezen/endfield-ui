import {
  createContext,
  useContext,
  useMemo,
  type ComponentProps,
  type CSSProperties,
  type MouseEvent,
  type ReactNode,
} from "react";
import { useOverflowing } from "../../hooks/useOverflowing";
import { cn } from "../../lib/cn";
import { dateParts, daysBetween, eachDay, toDateObject } from "../../lib/date";
import { decor } from "../../lib/decor";
import { focusRingInset } from "../../lib/focus-ring";
import { LinkElement, type LinkRender } from "../link-element/LinkElement";
import { Tag } from "../tag/Tag";

type ScheduleContextValue = {
  start: string;
  /** 一共几天 */
  days: number;
  /** 读屏听到的起止日期 */
  describe: (start: string, end: string) => string;
};

const ScheduleContext = createContext<ScheduleContextValue | null>(null);

function useSchedule(part: string) {
  const context = useContext(ScheduleContext);
  if (!context) throw new Error(`${part} 要放在 Schedule 里面`);
  return context;
}

export type ScheduleProps = Omit<ComponentProps<"div">, "aria-label"> & {
  /** 这张排期的名称。横向能滚动时，滚动的那一块用它 */
  label: string;
  /** 第一天，`YYYY-MM-DD` */
  start: string;
  /** 最后一天（包含） */
  end: string;
  /**
   * 哪几天是日期锚：压在轴条上的日期块，往下带一条引线。
   * 默认是第一天和范围内每个月的 1 号
   */
  anchors?: readonly string[];
  /** 今天：画一条竖线。不传就不画 */
  today?: string;
  /** 一天至少多宽，像素。默认 32。容器够宽时各列平分多出来的宽度 */
  dayWidth?: number;
  /** 读屏听到的日期按它写。默认 `zh-CN` */
  locale?: string;
  /**
   * 读屏听到的起止日期怎么说。默认"10月3日至10月12日"，只有一天时是"10月5日"。
   * 换了 `locale` 一般也要换它
   */
  describeRange?: (start: string, end: string) => string;
  /** `ScheduleTrack` */
  children?: ReactNode;
};

const pad = (value: number) => String(value).padStart(2, "0");

/* 轴、引线、各条轨共用同一份列：一天一列 */
const dayColumns =
  "grid grid-cols-[repeat(var(--schedule-days),minmax(var(--schedule-day),1fr))]";

/* 类目竖轨的宽度。轴和引线要从它右边起 */
const RAIL = "w-12";
const AFTER_RAIL = "left-12";

/**
 * 排期：横向的时间轨图。条目从起始日的位置开始，长度就是持续时间。
 * 最小单位是天。放不下时在自己的容器里横向滚动。
 */
export function Schedule({
  label,
  start,
  end,
  anchors: anchorsProp,
  today,
  dayWidth = 32,
  locale = "zh-CN",
  describeRange,
  className,
  style,
  children,
  ...props
}: ScheduleProps) {
  const [scrollerRef, overflowing] = useOverflowing();
  const dates = useMemo(() => eachDay(start, end), [start, end]);
  const days = dates.length;

  const anchors = useMemo(
    () =>
      new Set(
        anchorsProp ??
          dates.filter(
            (date, position) => position === 0 || dateParts(date).day === 1,
          ),
      ),
    [anchorsProp, dates],
  );

  const context = useMemo(() => {
    const day = new Intl.DateTimeFormat(locale, {
      timeZone: "UTC",
      month: "long",
      day: "numeric",
    });
    const say = (date: string) => day.format(toDateObject(date));
    return {
      start,
      days,
      describe:
        describeRange ??
        ((from: string, to: string) =>
          from === to ? say(from) : `${say(from)}至${say(to)}`),
    };
  }, [start, days, locale, describeRange]);

  const column = (date: string) => daysBetween(start, date) + 1;
  const todayColumn =
    today !== undefined && today >= start && today <= end
      ? column(today)
      : null;

  return (
    <ScheduleContext value={context}>
      <div
        ref={scrollerRef}
        {...props}
        data-overflowing={overflowing.x ? "" : undefined}
        // 只有真的能横向滚动时才是一个能聚焦的区域（同表格）
        {...(overflowing.x && {
          role: "region",
          "aria-label": label,
          tabIndex: 0,
        })}
        style={
          {
            "--schedule-days": days,
            "--schedule-day": `${dayWidth}px`,
            ...style,
          } as CSSProperties
        }
        className={cn(
          "isolate overflow-x-auto text-ink [--schedule-surface:var(--ef-surface)]",
          focusRingInset,
          className,
        )}
      >
        {/*
         * 宽度写死成"竖轨 + 天数 × 每天的宽度"，比容器窄时撑满容器。
         * 不能让它跟着内容走：名称长的条目会把自己那几列撑宽，位置就不准了
         */}
        <div
          role={overflowing.x ? undefined : "group"}
          aria-label={overflowing.x ? undefined : label}
          className="relative w-[calc(3rem+var(--schedule-days)*var(--schedule-day))] min-w-full"
        >
          {/* 空档：没有条目的时段露出这层淡斜纹 */}
          <div
            aria-hidden="true"
            className={cn(
              decor,
              "absolute inset-y-0 right-0 bg-surface-sunken hatch",
              AFTER_RAIL,
            )}
          />

          {/* 引线：从每个日期锚往下，画在条目后面 */}
          <div
            aria-hidden="true"
            className={cn(
              decor,
              "absolute inset-y-0 right-0",
              AFTER_RAIL,
              dayColumns,
            )}
          >
            {[...anchors].map((date) => (
              <span
                key={date}
                style={{ gridColumn: column(date) }}
                className="row-start-1 border-l border-dashed border-line-strong"
              />
            ))}
          </div>

          {/* 时间轴 */}
          <div aria-hidden="true" className="relative flex">
            {/* 左上角：盖住滚过去的日号 */}
            <div
              className={cn(
                "sticky left-0 z-3 shrink-0 bg-(--schedule-surface)",
                RAIL,
              )}
            />
            <div
              className={cn(
                "h-8 flex-1 items-center bg-surface-muted",
                dayColumns,
              )}
            >
              {dates.map((date, position) => {
                if (anchors.has(date)) {
                  const { month, day } = dateParts(date);
                  return (
                    <Tag
                      key={date}
                      variant="inverse"
                      size="sm"
                      numeric
                      marked
                      data-anchor={date}
                      // 日期块比一天的格子宽：从这一格的左缘起，压到后面的格子上
                      className="z-1 justify-self-start"
                    >
                      {`${pad(month)}.${pad(day)}`}
                    </Tag>
                  );
                }
                // 被前一个日期块压住的那一格不写日号
                const covered =
                  position > 0 && anchors.has(dates[position - 1]!);
                return (
                  <span
                    key={date}
                    className="text-center font-tech text-micro text-ink-tertiary tabular-nums"
                  >
                    {covered ? null : dateParts(date).day}
                  </span>
                );
              })}
            </div>
          </div>

          <div className="relative flex flex-col gap-1 pt-1">{children}</div>

          {/* 今天：一条竖线，画在条目上面 */}
          {todayColumn !== null && (
            <div
              aria-hidden="true"
              className={cn(
                decor,
                "absolute inset-y-0 right-0 z-2",
                AFTER_RAIL,
                dayColumns,
              )}
            >
              <span
                data-today=""
                style={{ gridColumn: todayColumn }}
                className="row-start-1 border-l-2 border-accent-ink"
              />
            </div>
          )}
        </div>
      </div>
    </ScheduleContext>
  );
}

export type ScheduleTrackProps = Omit<
  ComponentProps<"section">,
  "aria-label"
> & {
  /** 类目的名称：竖轨上的字，也是这条轨的可访问名称 */
  label: string;
  /** 竖轨上的图标 */
  icon?: ReactNode;
  /** 直接放 `ScheduleItem` */
  children?: ReactNode;
};

/**
 * 一条轨：一个类目的条目排在一行里，时间重叠的自动错到下一行。
 * 竖轨的颜色用 `className="[--track-color:…] [--track-ink:…]"` 换。
 */
export function ScheduleTrack({
  label,
  icon,
  className,
  children,
  ...props
}: ScheduleTrackProps) {
  useSchedule("ScheduleTrack");

  return (
    <section
      {...props}
      aria-label={label}
      className={cn(
        "flex [--track-color:var(--ef-surface-inverse)] [--track-ink:var(--ef-ink-inverse)]",
        className,
      )}
    >
      {/* 竖轨冻结在左边：底不透明，滚过去的条目才不会透出来 */}
      <div
        aria-hidden="true"
        className={cn(
          "sticky left-0 z-3 flex shrink-0 flex-col items-center gap-2 bg-(--track-color) py-2 text-(--track-ink)",
          // 和右边的条目之间留一条表面色的缝
          "border-r-4 border-(--schedule-surface)",
          RAIL,
        )}
      >
        {icon && (
          <span className="flex size-4 shrink-0 items-center justify-center [&_svg]:size-4">
            {icon}
          </span>
        )}
        <span className="text-xs leading-none font-medium tracking-label [writing-mode:vertical-rl]">
          {label}
        </span>
      </div>
      <ul
        className={cn(
          "min-h-12 flex-1 grid-flow-row-dense auto-rows-[3rem] gap-y-1",
          dayColumns,
        )}
      >
        {children}
      </ul>
    </section>
  );
}

export type ScheduleItemVariant = "banner" | "system";

type ItemOwnProps = {
  /** 第一天，`YYYY-MM-DD` */
  start: string;
  /** 最后一天（包含） */
  end: string;
  /** 名称 */
  title: ReactNode;
  /** 类型小标签：右上角的白底描边小块。只有 `banner` 有 */
  type?: ReactNode;
  /**
   * - `banner` 活动：浅底，可以垫一张图，左上是墨色的名称块，默认；
   * - `system` 系统类：炭灰底 + 行动色侧签 + 一条虚线，不带图。
   */
  variant?: ScheduleItemVariant;
  /** 垫在条目下面的图，铺满并裁切。只有 `banner` 有 */
  media?: ReactNode;
  /** 传了名称就是一个链接，点击范围铺满整个条目 */
  href?: string;
  target?: string;
  rel?: string;
  /** 用这个元素代替 `<a>`（路由库的链接组件）。传了就按链接处理 */
  render?: LinkRender;
  onClick?: (event: MouseEvent<HTMLElement>) => void;
};

export type ScheduleItemProps = ItemOwnProps &
  Omit<ComponentProps<"li">, keyof ItemOwnProps | "children">;

/** 排期里的一个条目。直接放在 `ScheduleTrack` 里。 */
export function ScheduleItem({
  start,
  end,
  title,
  type,
  variant = "banner",
  media,
  href,
  target,
  rel,
  render,
  onClick,
  className,
  style,
  ...props
}: ScheduleItemProps) {
  const schedule = useSchedule("ScheduleItem");
  const first = daysBetween(schedule.start, start);
  const last = daysBetween(schedule.start, end);
  // 整个都在范围外：不画
  if (last < 0 || first >= schedule.days || last < first) return null;

  // 超出范围的两头裁到范围内
  const from = Math.max(first, 0) + 1;
  const to = Math.min(last, schedule.days - 1) + 2;
  const isLink = href !== undefined || render !== undefined;
  const banner = variant === "banner";

  const name = isLink ? (
    <LinkElement
      render={render}
      href={href}
      target={target}
      rel={rel}
      onClick={onClick}
      // 点击范围铺满整个条目；焦点环画在条目上
      className="outline-none after:absolute after:inset-0 after:content-['']"
    >
      {title}
    </LinkElement>
  ) : (
    title
  );

  return (
    <li
      {...props}
      data-variant={variant}
      data-clipped-start={first < 0 ? "" : undefined}
      data-clipped-end={last >= schedule.days ? "" : undefined}
      style={{ gridColumn: `${from} / ${to}`, ...style }}
      className={cn(
        // 条目自己是一个容器：窄到放不下类型标签时把它收掉
        "@container relative isolate flex min-w-0 overflow-clip text-sm",
        "has-focus-visible:outline-2 has-focus-visible:-outline-offset-2 has-focus-visible:outline-focus",
        banner
          ? "items-start justify-between gap-2 bg-surface-muted p-2"
          : // 系统类条目在两个主题下都是炭灰底：control 系列本来就不随主题变
            "items-center gap-2 bg-control pr-2 text-on-control",
        className,
      )}
    >
      {banner ? (
        <>
          {media && (
            <div
              aria-hidden="true"
              className="absolute inset-0 -z-10 *:size-full *:object-cover"
            >
              {media}
            </div>
          )}
          <span className="flex h-6 max-w-full min-w-0 items-center bg-surface-inverse px-2 font-medium text-ink-inverse">
            <span className="truncate">{name}</span>
          </span>
          {type && (
            <Tag variant="outline" size="sm" className="@max-[10rem]:hidden">
              {type}
            </Tag>
          )}
        </>
      ) : (
        <>
          <span
            aria-hidden="true"
            className="w-1.5 shrink-0 self-stretch bg-action"
          />
          <span className="min-w-0 truncate font-medium">{name}</span>
          <span
            aria-hidden="true"
            className="min-w-4 flex-1 border-t border-dashed border-action"
          />
        </>
      )}
      <span className="sr-only">{`，${schedule.describe(start, end)}`}</span>
    </li>
  );
}
