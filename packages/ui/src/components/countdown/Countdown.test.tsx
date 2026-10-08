import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Countdown } from "./Countdown";

const NOW = new Date("2026-10-08T00:00:00Z").getTime();
const SECOND = 1000;
const HOUR = 3600 * SECOND;
const DAY = 24 * HOUR;

function tick(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

describe("Countdown", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("超过一天时带天数，充裕态", () => {
    render(
      <Countdown
        to={NOW + 3 * DAY + 4 * HOUR + 12 * 60 * SECOND + 9 * SECOND}
      />,
    );
    const timer = screen.getByRole("timer");
    expect(timer).toHaveTextContent("3天 04:12:09");
    expect(timer.parentElement).toHaveAttribute("data-state", "ample");
  });

  it("每秒更新", () => {
    render(<Countdown to={NOW + 2 * DAY} />);
    expect(screen.getByRole("timer")).toHaveTextContent("2天 00:00:00");

    tick(SECOND);
    expect(screen.getByRole("timer")).toHaveTextContent("1天 23:59:59");
  });

  it("不到一天时不带天数，并进入紧迫态、多一个 ! 记号", () => {
    render(<Countdown to={NOW + 2 * HOUR + 30 * SECOND} />);
    const timer = screen.getByRole("timer");
    expect(timer).toHaveTextContent("02:00:30");
    expect(timer.parentElement).toHaveAttribute("data-state", "urgent");
    expect(screen.getByText("!")).toHaveAttribute("aria-hidden", "true");
  });

  it("urgentWithin 调整紧迫的门槛", () => {
    render(<Countdown to={NOW + 2 * HOUR} urgentWithin={HOUR} />);
    expect(screen.getByRole("timer").parentElement).toHaveAttribute(
      "data-state",
      "ample",
    );

    tick(HOUR);
    expect(screen.getByRole("timer").parentElement).toHaveAttribute(
      "data-state",
      "urgent",
    );
  });

  it("到期时显示到期文字、调用一次 onExpire 并停表", () => {
    const onExpire = vi.fn();
    render(
      <Countdown
        to={NOW + 3 * SECOND}
        onExpire={onExpire}
        expiredLabel="已截止"
      />,
    );
    tick(2 * SECOND);
    expect(screen.getByRole("timer")).toHaveTextContent("00:00:01");
    expect(onExpire).not.toHaveBeenCalled();

    tick(SECOND);
    expect(screen.getByRole("timer")).toHaveTextContent("已截止");
    expect(screen.getByRole("timer").parentElement).toHaveAttribute(
      "data-state",
      "expired",
    );
    expect(onExpire).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);

    tick(10 * SECOND);
    expect(onExpire).toHaveBeenCalledOnce();
  });

  it("挂载时就已过期：直接显示到期文字，不调用 onExpire", () => {
    const onExpire = vi.fn();
    render(<Countdown to={NOW - SECOND} onExpire={onExpire} />);
    expect(screen.getByRole("timer")).toHaveTextContent("已结束");
    expect(onExpire).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("不每秒播报，并给读屏一个静态的截止时间", () => {
    render(<Countdown to={NOW + DAY} />);
    expect(screen.getByRole("timer")).toHaveAttribute("aria-live", "off");
    expect(document.querySelector("time")).toHaveAttribute(
      "datetime",
      new Date(NOW + DAY).toISOString(),
    );
  });

  it("卸载时清掉定时器", () => {
    const { unmount } = render(<Countdown to={NOW + DAY} />);
    expect(vi.getTimerCount()).toBe(1);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("截止时间无法解析时按已过期处理", () => {
    render(<Countdown to="不是日期" />);
    expect(screen.getByRole("timer")).toHaveTextContent("已结束");
    expect(document.querySelector("time")).toBeNull();
  });
});
