import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { Dialog, DialogClose } from "./Dialog";

const backdrop = () => document.querySelector<HTMLElement>(".bg-scrim");

function Basic(props: Partial<React.ComponentProps<typeof Dialog>>) {
  return (
    <Dialog
      trigger={<button type="button">打开</button>}
      title="归档这份报告"
      description="归档后仍然可以在档案室里找到。"
      footer={
        <>
          <DialogClose>
            <button type="button">取消</button>
          </DialogClose>
          <button type="button">归档</button>
        </>
      }
      {...props}
    >
      <p>正文</p>
    </Dialog>
  );
}

describe("Dialog", () => {
  it("点触发按钮打开，标题是可访问名称，说明关联给读屏", async () => {
    const user = userEvent.setup();
    render(<Basic />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "打开" }));
    const dialog = await screen.findByRole("dialog", { name: "归档这份报告" });
    expect(dialog).toHaveAccessibleDescription(
      "归档后仍然可以在档案室里找到。",
    );
    expect(
      screen.getByRole("heading", { name: "归档这份报告" }),
    ).toBeInTheDocument();
    expect(dialog).toHaveTextContent("正文");
  });

  it("入场是从下面升上来并淡入，不放大；退场只淡出。确认弹窗是同一个面板", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<Basic />);
    await user.click(screen.getByRole("button", { name: "打开" }));
    const dialog = await screen.findByRole("dialog");
    const enter = [
      "transition-[opacity,translate]",
      "data-starting-style:translate-y-(--motion-shift-lg)",
      "data-starting-style:opacity-0",
      "data-ending-style:opacity-0",
    ];
    expect(dialog).toHaveClass(...enter);
    expect(dialog.className).not.toMatch(/scale-/);
    expect(dialog.className).not.toMatch(/data-ending-style:[^ ]*translate/);
    unmount();

    render(<Basic alert />);
    await user.click(screen.getByRole("button", { name: "打开" }));
    expect(await screen.findByRole("alertdialog")).toHaveClass(...enter);
  });

  it("打开时焦点进入弹窗，Esc 关闭后回到触发按钮", async () => {
    const user = userEvent.setup();
    render(<Basic />);
    const trigger = screen.getByRole("button", { name: "打开" });
    await user.click(trigger);
    await screen.findByRole("dialog");
    // 落在行动区的第一个按钮上，不是标题带里的关闭图标
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "取消" })).toHaveFocus(),
    );

    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("内容区里有字段时，焦点落在第一个字段上", async () => {
    render(
      <Dialog defaultOpen title="重命名">
        <label>
          名称
          <input defaultValue="北区仓储站" />
        </label>
      </Dialog>,
    );
    await waitFor(() =>
      expect(screen.getByRole("textbox", { name: "名称" })).toHaveFocus(),
    );
  });

  it("内容区里没有可聚焦的元素时，焦点落在关闭图标上", async () => {
    render(<Dialog defaultOpen title="说明" description="只有一段话。" />);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "关闭" })).toHaveFocus(),
    );
  });

  it("关闭图标有可访问名称，点了就关", async () => {
    const user = userEvent.setup();
    render(<Basic closeLabel="关闭弹窗" />);
    await user.click(screen.getByRole("button", { name: "打开" }));
    await user.click(await screen.findByRole("button", { name: "关闭弹窗" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });

  it("DialogClose 包住的按钮点了就关，并保留自己的点击事件", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(
      <Dialog
        defaultOpen
        title="归档"
        footer={
          <DialogClose>
            <button type="button" onClick={onCancel}>
              取消
            </button>
          </DialogClose>
        }
      />,
    );
    await user.click(await screen.findByRole("button", { name: "取消" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });

  it("点遮罩关闭", async () => {
    const user = userEvent.setup();
    render(<Basic defaultOpen />);
    await screen.findByRole("dialog");
    await user.click(backdrop()!);
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });

  it("alert：角色是 alertdialog，点遮罩不关，Esc 仍然能关", async () => {
    const user = userEvent.setup();
    render(<Basic defaultOpen alert />);
    const dialog = await screen.findByRole("alertdialog", {
      name: "归档这份报告",
    });
    await user.click(backdrop()!);
    expect(dialog).toBeInTheDocument();

    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument(),
    );
  });

  it("受控：关闭的请求交给 onOpenChange", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    function Controlled() {
      const [open, setOpen] = useState(true);
      return (
        <Dialog
          open={open}
          onOpenChange={(next) => {
            onOpenChange(next);
            setOpen(next);
          }}
          title="受控"
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

  it("三档宽度，其余属性给弹窗本身", async () => {
    render(
      <Basic defaultOpen size="lg" data-testid="popup" className="custom" />,
    );
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveAttribute("data-size", "lg");
    expect(dialog).toHaveAttribute("data-testid", "popup");
    expect(dialog).toHaveClass("max-w-[65rem]", "custom");
  });

  it("标题带是一块固定的深色", async () => {
    render(<Basic defaultOpen />);
    const heading = await screen.findByRole("heading", {
      name: "归档这份报告",
    });
    expect(heading.closest("[data-theme]")).toHaveAttribute(
      "data-theme",
      "dark",
    );
  });

  it("触发按钮在局部主题里时，浮层带上同一个主题和表单符号方案", async () => {
    const user = userEvent.setup();
    render(
      <div data-theme="dark" data-choice="diamond">
        <Basic />
      </div>,
    );
    await user.click(screen.getByRole("button", { name: "打开" }));
    const dialog = await screen.findByRole("dialog");
    const scope = dialog.parentElement?.closest("[data-theme]");
    expect(scope).toHaveAttribute("data-theme", "dark");
    expect(scope).toHaveAttribute("data-choice", "diamond");
    expect(scope).not.toContainElement(
      screen.getByRole("button", { name: "打开", hidden: true }),
    );
  });

  it("没有局部主题时不往浮层上写主题", async () => {
    render(<Basic defaultOpen />);
    const dialog = await screen.findByRole("dialog");
    expect(dialog.parentElement?.closest("[data-theme]")).toBeNull();
  });
  it("两处装饰默认没有；开了也对读屏隐藏，不影响可访问名称", async () => {
    const { unmount } = render(<Basic defaultOpen />);
    const plain = await screen.findByRole("dialog");
    expect(plain.querySelector("[data-ornament]")).not.toBeInTheDocument();
    expect(plain.querySelector("[data-corner-art]")).not.toBeInTheDocument();
    unmount();

    render(
      <Basic
        defaultOpen
        ornament
        cornerArt={<svg data-testid="art" viewBox="0 0 10 10" />}
      />,
    );
    const dialog = await screen.findByRole("dialog", { name: "归档这份报告" });
    const dots = dialog.querySelector("[data-ornament]");
    expect(dots).toHaveAttribute("aria-hidden", "true");
    expect(dots?.children).toHaveLength(6);
    // 小方点在标题带里，跟着它按深色底取值
    expect(dots?.closest("[data-theme]")).toHaveAttribute("data-theme", "dark");

    const art = screen.getByTestId("art").closest("[data-corner-art]");
    expect(art).toHaveAttribute("aria-hidden", "true");
    expect(art).toHaveClass("pointer-events-none");
  });
});
