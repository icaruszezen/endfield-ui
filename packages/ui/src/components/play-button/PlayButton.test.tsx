import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PlayButton, PlayMark } from "./PlayButton";

describe("PlayMark", () => {
  it("只是记号：对读屏隐藏，里面是一个三角", () => {
    render(<PlayMark data-testid="mark" />);
    const mark = screen.getByTestId("mark");
    expect(mark.tagName).toBe("SPAN");
    expect(mark).toHaveAttribute("aria-hidden", "true");
    expect(mark.querySelector("svg")).not.toBeNull();
  });

  it("黄色小方块：行动色的底、2px 的圆角，三档尺寸", () => {
    const { rerender } = render(<PlayMark data-testid="mark" />);
    expect(screen.getByTestId("mark")).toHaveClass(
      "bg-action",
      "text-on-action",
      "rounded-xs",
      "size-8",
    );
    rerender(<PlayMark data-testid="mark" size="sm" />);
    expect(screen.getByTestId("mark")).toHaveClass("size-6");
    rerender(<PlayMark data-testid="mark" size="lg" />);
    expect(screen.getByTestId("mark")).toHaveClass("size-10");
  });
});

describe("PlayButton", () => {
  it("是一个按钮，默认的名称是「播放」", () => {
    render(<PlayButton />);
    const button = screen.getByRole("button", { name: "播放" });
    expect(button).toHaveAttribute("type", "button");
    expect(button.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("aria-label 写明播的是什么", () => {
    render(<PlayButton aria-label="播放：秋季勘探计划 · 预告" />);
    expect(
      screen.getByRole("button", { name: "播放：秋季勘探计划 · 预告" }),
    ).toBeInTheDocument();
  });

  it("点击触发 onClick；禁用时不触发", async () => {
    const onClick = vi.fn();
    const { rerender } = render(<PlayButton onClick={onClick} />);
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);

    rerender(<PlayButton onClick={onClick} disabled />);
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button")).toHaveClass("bg-disabled");
  });

  it("最小的一档把点击区补到 40px", () => {
    render(<PlayButton size="sm" />);
    expect(screen.getByRole("button")).toHaveClass("size-6", "after:-inset-2");
  });

  it("有焦点环", () => {
    render(<PlayButton />);
    expect(screen.getByRole("button")).toHaveClass("focus-visible:outline-2");
  });
});
