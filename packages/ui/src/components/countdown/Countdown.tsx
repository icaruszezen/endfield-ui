import {
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import { cn } from "../../lib/cn";

export type CountdownSize = "sm" | "md";
export type CountdownState = "ample" | "urgent" | "expired";

export type CountdownProps = Omit<ComponentProps<"span">, "children"> & {
  /** 截止时间：`Date`、时间戳或能被 `new Date()` 解析的字符串 */
  to: Date | number | string;
  /** 剩余时间不多于这个毫秒数时进入紧迫态，默认 24 小时 */
  urgentWithin?: number;
  /** 到期后显示的文字 */
  expiredLabel?: ReactNode;
  /** 到期的那一刻调用一次；挂载时就已过期则不调用 */
  onExpire?: () => void;
  /** 超过一天时"天"的写法，如 `3天 04:12:09` */
  dayUnit?: string;
  /** 给读屏的静态截止时间。默认是"截止 + 本地格式的日期时间" */
  deadlineLabel?: ReactNode;
  size?: CountdownSize;
};

const DAY = 86_400_000;

const sizeClass: Record<CountdownSize, string> = {
  sm: "h-5 gap-1 px-2 text-xs",
  md: "h-7 gap-1.5 px-3 text-sm",
};

/*
 * 状态色用文字档的语义令牌作底、ink-inverse 作字：两个主题下都 ≥ 4.5:1。
 * 角色色里的 alert 红作底时，墨字白字都不够。
 */
const stateClass: Record<CountdownState, string> = {
  ample: "bg-success text-ink-inverse",
  urgent: "bg-danger text-ink-inverse",
  expired: "bg-surface-muted text-ink-secondary",
};

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function format(remaining: number, dayUnit: string) {
  const seconds = Math.ceil(remaining / 1000);
  const days = Math.floor(seconds / 86_400);
  const clock = [
    Math.floor((seconds % 86_400) / 3600),
    Math.floor((seconds % 3600) / 60),
    seconds % 60,
  ]
    .map(pad)
    .join(":");
  return days > 0 ? `${days}${dayUnit} ${clock}` : clock;
}

/**
 * 倒计时：充裕时是绿色胶囊，紧迫时变红并多一个 `!`。
 * 不会每秒播报——读屏拿到的是静态的截止时间，走到这里时才读当前剩余。
 */
export function Countdown({
  to,
  urgentWithin = DAY,
  expiredLabel = "已结束",
  onExpire,
  dayUnit = "天",
  deadlineLabel,
  size = "md",
  className,
  ...props
}: CountdownProps) {
  const target = new Date(to).getTime();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    setNow(Date.now());
    if (!(target > Date.now())) return;

    const timer = setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current >= target) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [target]);

  const remaining = Number.isNaN(target) ? 0 : Math.max(0, target - now);
  const state: CountdownState =
    remaining === 0
      ? "expired"
      : remaining <= urgentWithin
        ? "urgent"
        : "ample";

  const onExpireRef = useRef(onExpire);
  const previous = useRef(state);
  useEffect(() => {
    onExpireRef.current = onExpire;
  });
  useEffect(() => {
    if (state === "expired" && previous.current !== "expired") {
      onExpireRef.current?.();
    }
    previous.current = state;
  }, [state]);

  const valid = !Number.isNaN(target);

  return (
    <span
      {...props}
      data-state={state}
      className={cn(
        "inline-flex shrink-0 items-center rounded-full font-tech leading-none font-bold whitespace-nowrap tabular-nums",
        sizeClass[size],
        stateClass[state],
        className,
      )}
    >
      {state === "urgent" && <span aria-hidden="true">!</span>}
      {/* 本地时间在服务端和浏览器里可能不同，这两处不做水合校验 */}
      <span role="timer" aria-live="off" suppressHydrationWarning>
        {state === "expired" ? expiredLabel : format(remaining, dayUnit)}
      </span>
      {valid && (
        <span className="sr-only" suppressHydrationWarning>
          {deadlineLabel ?? (
            <>
              截止{" "}
              <time dateTime={new Date(target).toISOString()}>
                {new Date(target).toLocaleString()}
              </time>
            </>
          )}
        </span>
      )}
    </span>
  );
}
