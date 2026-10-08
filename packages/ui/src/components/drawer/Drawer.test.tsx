import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DialogClose } from "../dialog/Dialog";
import { Drawer } from "./Drawer";

function Basic(props: Partial<React.ComponentProps<typeof Drawer>>) {
  return (
    <Drawer
      trigger={<button type="button">筛选</button>}
      title="筛选条件"
      description="只影响当前列表。"
      {...props}
    >
      <p>正文</p>
    </Drawer>
  );
}

describe("Drawer", () => {
  it("点触发按钮打开，标题是可访问名称", async () => {
    const user = userEvent.setup();
    render(<Basic />);
    await user.click(screen.getByRole("button", { name: "筛选" }));
    const drawer = await screen.findByRole("dialog", { name: "筛选条件" });
    expect(drawer).toHaveAccessibleDescription("只影响当前列表。");
    expect(drawer).toHaveTextContent("正文");
  });

  it("Esc 关闭后焦点回到触发按钮", async () => {
    const user = userEvent.setup();
    render(<Basic />);
    const trigger = screen.getByRole("button", { name: "筛选" });
    await user.click(trigger);
    await screen.findByRole("dialog");
    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("关闭图标与 DialogClose 都能关", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <Basic
        defaultOpen
        onOpenChange={onOpenChange}
        footer={
          <DialogClose>
            <button type="button">完成</button>
          </DialogClose>
        }
      />,
    );
    await user.click(await screen.findByRole("button", { name: "完成" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });

  it("三个方向：右、左、底", async () => {
    const { rerender } = render(<Basic defaultOpen />);
    const drawer = await screen.findByRole("dialog");
    expect(drawer).toHaveAttribute("data-side", "right");
    expect(drawer).toHaveClass("h-full", "max-w-100");

    rerender(<Basic defaultOpen side="left" size="sm" />);
    expect(screen.getByRole("dialog")).toHaveAttribute("data-side", "left");
    expect(screen.getByRole("dialog")).toHaveClass("max-w-80");

    rerender(<Basic defaultOpen side="bottom" />);
    expect(screen.getByRole("dialog")).toHaveAttribute("data-side", "bottom");
    // 底部抽屉通宽，高度有上限
    expect(screen.getByRole("dialog")).not.toHaveClass("max-w-100");
    expect(screen.getByRole("dialog")).toHaveClass("max-h-[85dvh]");
  });

  it("accent：靠页面内容的一侧有一条行动色的细条", async () => {
    render(<Basic defaultOpen accent />);
    expect(await screen.findByRole("dialog")).toHaveClass(
      "border-l-4",
      "border-l-action",
    );
  });

  it("触发按钮在局部主题里时，浮层带上同一个主题", async () => {
    const user = userEvent.setup();
    render(
      <div data-theme="dark">
        <Basic />
      </div>,
    );
    await user.click(screen.getByRole("button", { name: "筛选" }));
    const drawer = await screen.findByRole("dialog");
    expect(drawer.parentElement?.closest("[data-theme]")).toHaveAttribute(
      "data-theme",
      "dark",
    );
  });
});
