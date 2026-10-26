import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Close } from "../../icons/Close";
import { IconButton } from "./IconButton";

describe("IconButton", () => {
  it("可访问名称来自 aria-label，图标对辅助技术隐藏", () => {
    render(
      <IconButton aria-label="关闭">
        <Close />
      </IconButton>,
    );
    const button = screen.getByRole("button", { name: "关闭" });
    expect(button.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("方形的三种是 4px 圆角，floating 是圆，按下、禁用时也一样", () => {
    for (const variant of ["plain", "accent", "inverse"] as const) {
      for (const state of [{}, { pressed: true }, { disabled: true }]) {
        const { unmount } = render(
          <IconButton aria-label="关闭" variant={variant} {...state}>
            <Close />
          </IconButton>,
        );
        const button = screen.getByRole("button");
        expect(button).toHaveClass("rounded-sm");
        expect(button).not.toHaveClass("rounded-full");
        unmount();
      }
    }
    for (const state of [{}, { pressed: true }, { disabled: true }]) {
      const { unmount } = render(
        <IconButton aria-label="下一页" variant="floating" {...state}>
          <Close />
        </IconButton>,
      );
      const button = screen.getByRole("button");
      expect(button).toHaveClass("rounded-full");
      expect(button).not.toHaveClass("rounded-sm");
      unmount();
    }
  });

  it("pressed 输出 aria-pressed", () => {
    const { rerender } = render(
      <IconButton aria-label="静音" pressed={false}>
        <Close />
      </IconButton>,
    );
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "false");

    rerender(
      <IconButton aria-label="静音" pressed>
        <Close />
      </IconButton>,
    );
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "true");
  });

  it("高对比模式：激活的改用系统的「选中」色，四种变体都是", () => {
    for (const variant of ["plain", "floating", "accent", "inverse"] as const) {
      const { rerender, unmount } = render(
        <IconButton aria-label="静音" variant={variant} pressed>
          <Close />
        </IconButton>,
      );
      expect(screen.getByRole("button")).toHaveClass(
        "forced-colors:bg-[Highlight]",
        "forced-colors:text-[HighlightText]",
      );
      rerender(
        <IconButton aria-label="静音" variant={variant} pressed={false}>
          <Close />
        </IconButton>,
      );
      const released = screen.getByRole("button");
      expect(released).not.toHaveClass("forced-colors:bg-[Highlight]");
      expect(released).not.toHaveClass("forced-colors:text-[HighlightText]");
      unmount();
    }
  });

  it("高对比模式：没激活的补一圈线，禁用的是灰字色的线，激活的线跟着块走", () => {
    for (const variant of ["plain", "floating", "accent", "inverse"] as const) {
      const { rerender, unmount } = render(
        <IconButton aria-label="静音" variant={variant}>
          <Close />
        </IconButton>,
      );
      expect(screen.getByRole("button")).toHaveClass(
        "forced-colors:border",
        "forced-colors:border-[ButtonText]",
      );

      rerender(
        <IconButton aria-label="静音" variant={variant} disabled>
          <Close />
        </IconButton>,
      );
      expect(screen.getByRole("button")).toHaveClass(
        "forced-colors:border",
        "forced-colors:border-[GrayText]",
      );
      expect(screen.getByRole("button")).not.toHaveClass(
        "forced-colors:border-[ButtonText]",
      );

      // 线三种状态都在：换状态时里面的图标不挪
      rerender(
        <IconButton aria-label="静音" variant={variant} pressed>
          <Close />
        </IconButton>,
      );
      expect(screen.getByRole("button")).toHaveClass(
        "forced-colors:border",
        "forced-colors:border-[Highlight]",
      );
      unmount();
    }
  });

  it("高对比模式：32px 那一档的点击区多补 1px，抵掉那一圈线", () => {
    render(
      <IconButton aria-label="关闭" size="sm">
        <Close />
      </IconButton>,
    );
    expect(screen.getByRole("button")).toHaveClass(
      "after:-inset-1",
      "forced-colors:after:-inset-[5px]",
    );
  });

  it("不是开关时不输出 aria-pressed", () => {
    render(
      <IconButton aria-label="关闭">
        <Close />
      </IconButton>,
    );
    expect(screen.getByRole("button")).not.toHaveAttribute("aria-pressed");
  });

  it("禁用时不触发 onClick", async () => {
    const onClick = vi.fn();
    render(
      <IconButton aria-label="下一页" disabled onClick={onClick}>
        <Close />
      </IconButton>,
    );
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
  });
  it("inverse：它打开的浮层开着的时候保持墨底", () => {
    render(
      <IconButton aria-label="分享" variant="inverse">
        <svg />
      </IconButton>,
    );
    expect(screen.getByRole("button")).toHaveClass(
      "data-popup-open:bg-surface-inverse",
      "data-popup-open:text-accent-ink-inverse",
    );
  });
});
