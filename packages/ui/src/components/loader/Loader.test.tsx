import { act, fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { stubAnimations } from "../../test/animations";
import { Loader } from "./Loader";

const bar = () => screen.getByRole("progressbar");

describe("Loader", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    document.documentElement.style.overflow = "";
  });

  it("进度条带名称与当前值，大号数字只是给眼睛看的", () => {
    render(<Loader value={64} tagline="正在同步档案" />);
    expect(screen.getByRole("progressbar", { name: "加载中" })).toHaveAttribute(
      "aria-valuenow",
      "64",
    );
    expect(screen.getByText("64").parentElement).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    expect(screen.getByText("%")).toBeInTheDocument();
    expect(screen.getByText("正在同步档案")).toBeInTheDocument();
  });

  it("值被夹在 0 – 100，数字取整", () => {
    const { rerender } = render(<Loader value={140} />);
    expect(bar()).toHaveAttribute("aria-valuenow", "100");

    rerender(<Loader value={33.6} />);
    expect(screen.getByText("34")).toBeInTheDocument();
  });

  it("不传 value 是不确定进度：没有数字，也没有 aria-valuenow", () => {
    render(<Loader tagline="正在连接" />);
    expect(bar()).not.toHaveAttribute("aria-valuenow");
    expect(screen.queryByText("%")).toBeNull();
    expect(bar().firstElementChild).toHaveClass("animate-indeterminate");
  });

  it("整页模式：锁住页面滚动、收走焦点、拦住 Tab", () => {
    const { container } = render(
      <>
        <button type="button">被盖住的按钮</button>
        <Loader value={10} data-testid="loader" />
      </>,
    );
    const loader = screen.getByTestId("loader");
    expect(loader).toHaveClass("fixed");
    expect(document.documentElement.style.overflow).toBe("hidden");
    expect(loader).toHaveFocus();

    // preventDefault 之后 fireEvent 返回 false
    expect(fireEvent.keyDown(loader, { key: "Tab" })).toBe(false);
    expect(fireEvent.keyDown(loader, { key: "a" })).toBe(true);
    expect(container).toBeInTheDocument();
  });

  it("非整页模式：铺满所在的容器，不碰页面", () => {
    render(<Loader value={10} fullscreen={false} data-testid="loader" />);
    const loader = screen.getByTestId("loader");
    expect(loader).toHaveClass("absolute");
    expect(loader).not.toHaveClass("fixed");
    expect(document.documentElement.style.overflow).toBe("");
    expect(fireEvent.keyDown(loader, { key: "Tab" })).toBe(true);
  });

  it("open 变成 false：先滑出，过渡走完后卸载并触发 onExited", async () => {
    const finish = stubAnimations();
    const onExited = vi.fn();
    const { rerender } = render(
      <Loader value={100} data-testid="loader" onExited={onExited} />,
    );

    rerender(
      <Loader
        value={100}
        open={false}
        data-testid="loader"
        onExited={onExited}
      />,
    );
    const loader = screen.getByTestId("loader");
    expect(loader).toHaveAttribute("data-state", "closing");
    expect(loader).toHaveClass("-translate-y-full", "pointer-events-none");
    // 一开始退出就把页面放开
    expect(document.documentElement.style.overflow).toBe("");
    expect(onExited).not.toHaveBeenCalled();

    await finish();
    expect(screen.queryByTestId("loader")).toBeNull();
    expect(onExited).toHaveBeenCalledTimes(1);
  });

  it("没有过渡可等的环境里直接卸载", () => {
    const onExited = vi.fn();
    const { rerender } = render(
      <Loader data-testid="loader" onExited={onExited} />,
    );
    rerender(<Loader open={false} data-testid="loader" onExited={onExited} />);
    expect(screen.queryByTestId("loader")).toBeNull();
    expect(onExited).toHaveBeenCalledTimes(1);

    // 之后也不会再来一次
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(onExited).toHaveBeenCalledTimes(1);
  });

  it("使用方传了 ref：照样收焦点，照样等滑出", async () => {
    const finish = stubAnimations();
    const ref = createRef<HTMLDivElement>();
    const { rerender } = render(<Loader ref={ref} data-testid="loader" />);
    const loader = screen.getByTestId("loader");
    expect(ref.current).toBe(loader);
    expect(loader).toHaveFocus();

    rerender(<Loader ref={ref} open={false} data-testid="loader" />);
    expect(screen.getByTestId("loader")).toHaveAttribute(
      "data-state",
      "closing",
    );
    await finish();
    expect(screen.queryByTestId("loader")).toBeNull();
  });

  it("退出后把焦点还给原来的元素", () => {
    function Page({ open }: { open: boolean }) {
      return (
        <>
          <button type="button">入口</button>
          <Loader open={open} />
        </>
      );
    }
    const { rerender } = render(<Page open={false} />);
    const entry = screen.getByRole("button", { name: "入口" });
    entry.focus();

    rerender(<Page open />);
    expect(entry).not.toHaveFocus();

    rerender(<Page open={false} />);
    expect(entry).toHaveFocus();
  });

  it("一开始就是关的：什么都不渲染；再打开会挂回来", () => {
    const { rerender } = render(<Loader open={false} data-testid="loader" />);
    expect(screen.queryByTestId("loader")).toBeNull();

    rerender(<Loader open data-testid="loader" />);
    expect(screen.getByTestId("loader")).toHaveAttribute("data-state", "open");
  });
});
