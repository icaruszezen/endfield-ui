import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { Popover, PopoverClose } from "./Popover";

function Basic(props: Partial<React.ComponentProps<typeof Popover>>) {
  return (
    <Popover
      trigger={<button type="button">显示设置</button>}
      title="显示"
      description="只影响这一页。"
      {...props}
    >
      <label>
        <input type="checkbox" /> 紧凑行距
      </label>
      <PopoverClose>
        <button type="button">完成</button>
      </PopoverClose>
    </Popover>
  );
}

describe("Popover", () => {
  it("点触发按钮打开，标题是可访问名称，说明关联给读屏", async () => {
    const user = userEvent.setup();
    render(<Basic />);
    const trigger = screen.getByRole("button", { name: "显示设置" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(trigger);
    const panel = await screen.findByRole("dialog", { name: "显示" });
    expect(panel).toHaveAccessibleDescription("只影响这一页。");
    expect(trigger).toHaveAttribute("aria-expanded", "true");
  });

  it("面板是菜单的那一块：一样从触发按钮那一侧来", async () => {
    const user = userEvent.setup();
    render(<Basic side="top" />);
    await user.click(screen.getByRole("button", { name: "显示设置" }));
    const panel = await screen.findByRole("dialog", { name: "显示" });
    expect(panel).toHaveAttribute("data-side");
    expect(panel).toHaveClass(
      "transition-[opacity,translate]",
      "data-starting-style:data-[side=top]:translate-y-(--motion-shift)",
    );
  });

  it("不是模态：打开后页面其余部分没有被隐藏", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Basic />
        <button type="button">页面上的别的按钮</button>
      </>,
    );
    await user.click(screen.getByRole("button", { name: "显示设置" }));
    const panel = await screen.findByRole("dialog");
    expect(panel).not.toHaveAttribute("aria-modal", "true");
    expect(
      screen.getByRole("button", { name: "页面上的别的按钮" }),
    ).toBeInTheDocument();
  });

  it("打开时焦点进到面板里，Esc 关闭后回到触发按钮", async () => {
    const user = userEvent.setup();
    render(<Basic />);
    const trigger = screen.getByRole("button", { name: "显示设置" });
    await user.click(trigger);
    const panel = await screen.findByRole("dialog");
    await waitFor(() =>
      expect(panel).toContainElement(document.activeElement as HTMLElement),
    );

    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("PopoverClose 包住的按钮点了就关，并保留自己的点击事件", async () => {
    const user = userEvent.setup();
    const onDone = vi.fn();
    render(
      <Popover trigger={<button type="button">打开</button>} title="标题">
        <PopoverClose>
          <button type="button" onClick={onDone}>
            完成
          </button>
        </PopoverClose>
      </Popover>,
    );
    await user.click(screen.getByRole("button", { name: "打开" }));
    await user.click(await screen.findByRole("button", { name: "完成" }));
    expect(onDone).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });

  it("点外面关闭", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Basic />
        <p>外面</p>
      </>,
    );
    await user.click(screen.getByRole("button", { name: "显示设置" }));
    await screen.findByRole("dialog");
    await user.click(screen.getByText("外面"));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });

  it("没有标题时用 aria-label 命名，其余属性给面板本身", async () => {
    const user = userEvent.setup();
    render(
      <Popover
        trigger={<button type="button">打开</button>}
        aria-label="快速编辑"
        data-testid="panel"
        className="w-64"
      >
        内容
      </Popover>,
    );
    await user.click(screen.getByRole("button", { name: "打开" }));
    const panel = await screen.findByRole("dialog", { name: "快速编辑" });
    expect(panel).toHaveAttribute("data-testid", "panel");
    expect(panel).toHaveClass("w-64");
  });

  it("受控：关闭的请求交给 onOpenChange", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    function Controlled() {
      const [open, setOpen] = useState(true);
      return (
        <Basic
          open={open}
          onOpenChange={(next) => {
            onOpenChange(next);
            setOpen(next);
          }}
        />
      );
    }
    render(<Controlled />);
    await screen.findByRole("dialog");
    await user.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenCalledWith(false);
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });

  it("触发按钮在局部主题里时，面板带上同一个主题", async () => {
    const user = userEvent.setup();
    render(
      <div data-theme="dark">
        <Basic />
      </div>,
    );
    await user.click(screen.getByRole("button", { name: "显示设置" }));
    const panel = await screen.findByRole("dialog");
    expect(panel.closest("[data-theme]")).toHaveAttribute("data-theme", "dark");
    expect(panel.closest("[data-theme]")?.parentElement).toBe(document.body);
  });
});
