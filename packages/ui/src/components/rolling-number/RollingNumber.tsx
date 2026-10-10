import {
  useEffect,
  useState,
  useSyncExternalStore,
  type ComponentProps,
} from "react";
import { useInView } from "../../hooks/useInView";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { cn } from "../../lib/cn";
import { mergeRefs } from "../../lib/merge-refs";

export type RollingNumberProps = Omit<ComponentProps<"span">, "children"> & {
  /** 终值 */
  value: number;
  /**
   * 把数值写成字。默认带千分位（`1,280`），小数位数跟着 `value`。
   * 滚的过程中每一帧都会调它
   */
  format?: (value: number) => string;
  /** 进入视口时从 0 滚到终值，一次。默认开启 */
  animate?: boolean;
};

/* 入场的时长：开播时读 `--duration-slower`，读不到就用它的默认值 */
const FALLBACK_DURATION = 600;

function readDuration(node: Element | null): number {
  if (!node) return FALLBACK_DURATION;
  const raw = getComputedStyle(node).getPropertyValue("--duration-slower");
  const amount = Number.parseFloat(raw);
  if (!Number.isFinite(amount) || amount <= 0) return FALLBACK_DURATION;
  return raw.trim().endsWith("ms") ? amount : amount * 1000;
}

/** 减速：先快后慢，停得住。和 `ease-exit` 是一类，不带过冲 */
const decelerate = (progress: number) => 1 - (1 - progress) ** 3;

function fractionDigits(value: number): number {
  const fraction = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 20,
    useGrouping: false,
  })
    .format(value)
    .split(".")[1];
  return fraction ? fraction.length : 0;
}

const never = () => () => {};

/**
 * 滚动数字：进入视口时从 0 滚到终值，只滚一次。放进 `Stat` 的 `value` 里，
 * 或者任何"一个需要被一眼看到的数字"的地方。等宽数字由所在处给（`tabular-nums`）。
 *
 * - 读屏只读终值：终值一直在，滚的时候只是看不见；滚动的那一份对读屏隐藏。
 * - 宽度由终值占着，滚的时候旁边的东西不动。
 * - 服务端渲染出来的、打印出来的、"减少动态效果"下的，都直接是终值。
 * - 值后来变了直接换，不再滚。
 */
export function RollingNumber({
  value,
  format,
  animate = true,
  className,
  ref,
  ...props
}: RollingNumberProps) {
  const digits = fractionDigits(value);
  const write =
    format ??
    ((amount: number) =>
      amount.toLocaleString("en-US", {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      }));

  // 服务端和注水的那一遍是 false：先把终值画出来，脚本到了才从头滚
  const mounted = useSyncExternalStore(
    never,
    () => true,
    () => false,
  );
  const reduced = useReducedMotion();
  const [done, setDone] = useState(false);
  const [shown, setShown] = useState(0);
  const rolling = mounted && animate && !reduced && !done;
  const [inViewRef, inView] = useInView<HTMLSpanElement>({
    disabled: !rolling,
  });

  useEffect(() => {
    if (!rolling || !inView) return;
    const duration = readDuration(inViewRef.current);
    let started: number | undefined;
    let frame = requestAnimationFrame(function tick(now) {
      started ??= now;
      const progress = Math.min((now - started) / duration, 1);
      if (progress >= 1) {
        setDone(true);
        return;
      }
      setShown(Number((value * decelerate(progress)).toFixed(digits)));
      frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [rolling, inView, inViewRef, value, digits]);

  return (
    <span
      {...props}
      ref={mergeRefs(inViewRef, ref)}
      data-rolling={rolling ? "" : undefined}
      className={cn(rolling && "relative inline-block", className)}
    >
      {/* 终值一直在：占着宽度，读屏读的也是它。打印的时候不管滚没滚完都是它 */}
      <span className={rolling ? "opacity-0 print:opacity-100" : undefined}>
        {write(value)}
      </span>
      {rolling && (
        <span aria-hidden="true" className="absolute inset-0 print:hidden">
          {write(shown)}
        </span>
      )}
    </span>
  );
}
