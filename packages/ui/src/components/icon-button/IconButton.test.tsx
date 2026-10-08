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
