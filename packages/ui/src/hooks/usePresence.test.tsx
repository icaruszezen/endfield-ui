import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { stubAnimations } from "../test/animations";
import { usePresence } from "./usePresence";

type ProbeProps = {
  open: boolean;
  onExited?: () => void;
  onLeave?: (node: HTMLDivElement) => void | (() => void);
};

function Probe({ open, onExited, onLeave }: ProbeProps) {
  const { ref, mounted, leaving, entered } = usePresence<HTMLDivElement>(open, {
    onExited,
    onLeave,
  });
  if (!mounted) return null;
  return (
    <div
      ref={ref}
      data-testid="node"
      data-leaving={leaving ? "" : undefined}
      data-entered={entered ? "" : undefined}
    />
  );
}

const node = () => screen.queryByTestId("node");

describe("usePresence", () => {
  it("一开始开着就挂着，不算后来出现的；一开始关着什么都不渲染", () => {
    const { unmount } = render(<Probe open />);
    expect(node()).toBeInTheDocument();
    expect(node()).not.toHaveAttribute("data-entered");
    expect(node()).not.toHaveAttribute("data-leaving");
    unmount();

    render(<Probe open={false} />);
    expect(node()).toBeNull();
  });

  it("关了再开：立刻挂回来，算后来出现的", () => {
    const { rerender } = render(<Probe open={false} />);
    rerender(<Probe open />);
    expect(node()).toHaveAttribute("data-entered");

    rerender(<Probe open={false} />);
    rerender(<Probe open />);
    expect(node()).toHaveAttribute("data-entered");
  });

  it("没有动效可等：当场卸载，onExited 一次", () => {
    const onExited = vi.fn();
    const { rerender } = render(<Probe open onExited={onExited} />);
    rerender(<Probe open={false} onExited={onExited} />);
    expect(node()).toBeNull();
    expect(onExited).toHaveBeenCalledTimes(1);
  });

  it("有动效在跑：先留着，走完才卸载", async () => {
    const finish = stubAnimations();
    const onExited = vi.fn();
    const { rerender } = render(<Probe open onExited={onExited} />);

    rerender(<Probe open={false} onExited={onExited} />);
    expect(node()).toHaveAttribute("data-leaving");
    expect(onExited).not.toHaveBeenCalled();

    await finish();
    expect(node()).toBeNull();
    expect(onExited).toHaveBeenCalledTimes(1);
  });

  it("退场途中又打开：不卸载，原来那次走完了也不卸载", async () => {
    const finish = stubAnimations();
    const onExited = vi.fn();
    const { rerender } = render(<Probe open onExited={onExited} />);

    rerender(<Probe open={false} onExited={onExited} />);
    rerender(<Probe open onExited={onExited} />);
    expect(node()).not.toHaveAttribute("data-leaving");

    await finish();
    expect(node()).toBeInTheDocument();
    expect(onExited).not.toHaveBeenCalled();
  });

  it("onLeave 拿到节点；退场被打断时把摆上去的撤掉", async () => {
    stubAnimations();
    const undo = vi.fn();
    const onLeave = vi.fn((element: HTMLDivElement) => {
      element.style.height = "0px";
      return undo;
    });
    const { rerender } = render(<Probe open onLeave={onLeave} />);
    expect(onLeave).not.toHaveBeenCalled();

    rerender(<Probe open={false} onLeave={onLeave} />);
    expect(onLeave).toHaveBeenCalledTimes(1);
    expect(onLeave).toHaveBeenCalledWith(node());
    expect(node()!.style.height).toBe("0px");
    expect(undo).not.toHaveBeenCalled();

    rerender(<Probe open onLeave={onLeave} />);
    expect(undo).toHaveBeenCalledTimes(1);
  });

  it("循环的动画不等", () => {
    stubAnimations(Infinity);
    const { rerender } = render(<Probe open />);
    rerender(<Probe open={false} />);
    expect(node()).toBeNull();
  });

  it("退场途中整个被卸载：不再调 onExited", async () => {
    const finish = stubAnimations();
    const onExited = vi.fn();
    const { rerender, unmount } = render(<Probe open onExited={onExited} />);
    rerender(<Probe open={false} onExited={onExited} />);
    unmount();

    await finish();
    expect(onExited).not.toHaveBeenCalled();
  });
});
