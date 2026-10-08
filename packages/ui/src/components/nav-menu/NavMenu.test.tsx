import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { RouterLink } from "../../test/RouterLink";
import { NavAction } from "../nav-action/NavAction";
import { NavMenu, NavMenuItem, type NavMenuProps } from "./NavMenu";

const icon = <svg />;

function Menu({
  onNavigate,
  ...props
}: Partial<NavMenuProps> & { onNavigate?: (key: string) => void }) {
  return (
    <NavMenu
      trigger={<button type="button">打开菜单</button>}
      title="菜单"
      footer={<NavAction href="#console">前往控制台</NavAction>}
      {...props}
    >
      <NavMenuItem
        icon={icon}
        href="#overview"
        onClick={() => onNavigate?.("overview")}
      >
        总览
      </NavMenuItem>
      <NavMenuItem icon={icon} href="#dispatch" current>
        调度
      </NavMenuItem>
      <NavMenuItem icon={icon} href="#settings" disabled>
        设置
      </NavMenuItem>
    </NavMenu>
  );
}

const open = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole("button", { name: "打开菜单" }));
  return screen.findByRole("dialog", { name: "菜单" });
};

describe("NavMenu", () => {
  it("点菜单钮打开：一个有名称的对话框，里面是一个导航地标", async () => {
    const user = userEvent.setup();
    render(<Menu />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    const dialog = await open(user);
    const nav = within(dialog).getByRole("navigation", { name: "主导航" });
    expect(within(nav).getAllByRole("listitem")).toHaveLength(3);
    expect(dialog).toHaveClass("fixed", "inset-0", "z-(--z-overlay)");
  });

  it("打开时焦点落在第一个栏目上；Esc 关闭，焦点回到菜单钮", async () => {
    const user = userEvent.setup();
    render(<Menu />);
    await open(user);
    await waitFor(() =>
      expect(screen.getByRole("link", { name: "总览" })).toHaveFocus(),
    );

    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(screen.getByRole("button", { name: "打开菜单" })).toHaveFocus();
  });

  it("关闭钮有自己的名称，点了关掉", async () => {
    const user = userEvent.setup();
    render(<Menu closeLabel="收起菜单" />);
    const dialog = await open(user);
    await user.click(within(dialog).getByRole("button", { name: "收起菜单" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });

  it("当前栏目整条变信号黄，输出 aria-current=page，另有粗体和左缘竖条", async () => {
    const user = userEvent.setup();
    render(<Menu />);
    await open(user);
    const current = screen.getByRole("link", { name: "调度" });
    expect(current).toHaveAttribute("aria-current", "page");
    expect(current).toHaveClass(
      "bg-action",
      "text-on-action",
      "font-bold",
      "before:bg-on-action",
    );
    // 暗色主题下普通的焦点色也是黄的：当前项的焦点环换成压得住黄底的颜色
    expect(current).toHaveClass("focus-visible:outline-on-action");
    expect(screen.getByRole("link", { name: "总览" })).toHaveClass(
      "bg-surface-sunken",
    );
  });

  it("点一个栏目：先触发它的 onClick，再把菜单关上", async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(<Menu onNavigate={onNavigate} />);
    await open(user);
    await user.click(screen.getByRole("link", { name: "总览" }));
    expect(onNavigate).toHaveBeenCalledWith("overview");
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });

  it("closeOnClick={false} 的栏目点了不关", async () => {
    const user = userEvent.setup();
    render(
      <NavMenu trigger={<button type="button">打开菜单</button>} title="菜单">
        <NavMenuItem closeOnClick={false} onClick={() => {}}>
          切换语言
        </NavMenuItem>
      </NavMenu>,
    );
    await open(user);
    await user.click(screen.getByRole("button", { name: "切换语言" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("禁用的栏目点了没反应，菜单也不关", async () => {
    const user = userEvent.setup();
    render(<Menu />);
    await open(user);
    const disabled = screen.getByRole("link", { name: "设置" });
    expect(disabled).toHaveAttribute("aria-disabled", "true");
    expect(disabled).not.toHaveAttribute("href");
    await user.click(disabled);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("render：栏目交给路由库的链接组件，点了同样关菜单", async () => {
    const user = userEvent.setup();
    render(
      <NavMenu trigger={<button type="button">打开菜单</button>} title="菜单">
        <NavMenuItem render={<RouterLink to="/archive" />} current>
          档案
        </NavMenuItem>
      </NavMenu>,
    );
    await open(user);
    const link = screen.getByRole("link", { name: "档案" });
    expect(link).toHaveAttribute("href", "/app/archive");
    expect(link).toHaveAttribute("aria-current", "page");
    await user.click(link);
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });

  it("受控：开合由外面决定", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    function Controlled() {
      const [isOpen, setIsOpen] = useState(true);
      return (
        <Menu
          trigger={undefined}
          open={isOpen}
          onOpenChange={(next) => {
            onOpenChange(next);
            setIsOpen(next);
          }}
        />
      );
    }
    render(<Controlled />);
    await screen.findByRole("dialog", { name: "菜单" });
    await user.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenCalledWith(false);
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });

  it("有标志时标题只留给读屏；没有时显示在最上面一行", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Menu />);
    const dialog = await open(user);
    expect(within(dialog).getByText("菜单")).not.toHaveClass("sr-only");

    rerender(<Menu brand={<span>第七勘探队</span>} />);
    expect(within(dialog).getByText("菜单")).toHaveClass("sr-only");
    expect(within(dialog).getByText("第七勘探队")).toBeInTheDocument();
  });

  it("底部的主行动块是通宽的横条；工具和镂空巨字各在其位", async () => {
    const user = userEvent.setup();
    render(
      <Menu ghost="Seventh" tools={<button type="button">切换主题</button>} />,
    );
    const dialog = await open(user);
    expect(
      within(dialog).getByRole("link", { name: "前往控制台" }),
    ).toHaveAttribute("data-layout", "block");
    expect(
      within(dialog).getByRole("button", { name: "切换主题" }),
    ).toBeInTheDocument();
    // 巨字是装饰
    expect(within(dialog).getByText("Seventh")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });
});
