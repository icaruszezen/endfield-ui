import { useLayoutEffect, useRef } from "react";

const DURATION = 650;
const SAMPLES = 65;

/** stiffness 300、damping 30、mass 1 的位移响应。 */
export function roundedSpringProgress(milliseconds: number) {
  const time = Math.max(0, milliseconds) / 1000;
  const frequency = Math.sqrt(75);
  return (
    1 -
    Math.exp(-15 * time) *
      (Math.cos(frequency * time) +
        (15 / frequency) * Math.sin(frequency * time))
  );
}

const offsets = /* @__PURE__ */ Array.from(
  { length: SAMPLES + 1 },
  (_, index) => ({
    offset: index / SAMPLES,
    time: (index / SAMPLES) * DURATION,
  }),
);

function springPosition(
  time: number,
  start: number,
  end: number,
  velocity: number,
) {
  const seconds = time / 1000;
  const frequency = Math.sqrt(75);
  return (
    start +
    (end - start) * roundedSpringProgress(time) +
    (velocity * Math.exp(-15 * seconds) * Math.sin(frequency * seconds)) /
      frequency
  );
}

function springVelocity(
  time: number,
  start: number,
  end: number,
  velocity: number,
) {
  const seconds = time / 1000;
  const frequency = Math.sqrt(75);
  return (
    Math.exp(-15 * seconds) *
    (velocity * Math.cos(frequency * seconds) +
      ((300 * (end - start) - 15 * velocity) / frequency) *
        Math.sin(frequency * seconds))
  );
}

function translation(transform: string) {
  if (transform === "none") return 0;
  const values = transform.match(/^matrix\((.+)\)$/)?.[1]?.split(",");
  return values ? Number.parseFloat(values[4] ?? "0") : 0;
}

export function useSpringHighlight(target: string | null) {
  const ref = useRef<HTMLDivElement>(null);
  const previous = useRef<string | null>(null);
  const animation = useRef<Animation | null>(null);
  const movement = useRef({ start: 0, end: 0, velocity: 0 });

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    const before = previous.current;
    previous.current = target;
    if (!target) {
      animation.current?.cancel();
      animation.current = null;
      return;
    }
    const from = animation.current
      ? getComputedStyle(node).transform
      : (() => {
          node.style.transform = before ?? target;
          return getComputedStyle(node).transform;
        })();
    const active = animation.current;
    const velocity =
      active?.playState === "running" && typeof active.currentTime === "number"
        ? springVelocity(
            active.currentTime,
            movement.current.start,
            movement.current.end,
            movement.current.velocity,
          )
        : 0;
    animation.current?.cancel();
    animation.current = null;
    node.style.transform = target;
    const media = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!before || media?.matches || typeof node.animate !== "function") return;
    const start = translation(from);
    const end = translation(getComputedStyle(node).transform);
    if (Math.abs(end - start) < 0.01 && Math.abs(velocity) < 0.01) return;
    movement.current = { start, end, velocity };
    const running = node.animate(
      offsets.map(({ offset, time }) => ({
        offset,
        transform: `translateX(${offset === 1 ? end : springPosition(time, start, end, velocity)}px)`,
      })),
      { duration: DURATION, easing: "linear" },
    );
    animation.current = running;
    running.onfinish = () => {
      if (animation.current === running) animation.current = null;
    };
  }, [target]);

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    const media = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const settle = () => {
      animation.current?.cancel();
      animation.current = null;
    };
    const reduced = () => {
      if (media?.matches) settle();
    };
    media?.addEventListener("change", reduced);
    const observer =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(settle) : null;
    observer?.observe(node);
    return () => {
      observer?.disconnect();
      media?.removeEventListener("change", reduced);
      settle();
    };
  }, []);

  return ref;
}
