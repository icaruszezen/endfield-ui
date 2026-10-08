import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import {
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
} from "./DropdownMenu";

function Basic({
  onRename = () => {},
  onDelete = () => {},
  ...props
}: {
  onRename?: () => void;
  onDelete?: () => void;
} & Partial<React.ComponentProps<typeof DropdownMenu>>) {
  return (
    <DropdownMenu trigger={<button type="button">更多</button>} {...props}>
      <DropdownMenuGroup label="条目">
        <DropdownMenuItem onClick={onRename}>重命名</DropdownMenuItem>
        <DropdownMenuItem disabled>移动到…</DropdownMenuItem>
        <DropdownMenuItem href="#detail">查看详情</DropdownMenuItem>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuItem tone="danger" onClick={onDelete}>
        删除
      </DropdownMenuItem>
    </DropdownMenu>
  );
}

describe("DropdownMenu", () => {
  it("点触发按钮打开一个菜单，触发按钮报告展开状态", async () => {
    const user = userEvent.setup();
    render(<Basic />);
    const trigger = screen.getByRole("button", { name: "更多" });
    expect(trigger).toHaveAttribute("aria-haspopup", "menu");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    await user.click(trigger);
    expect(await screen.findByRole("menu")).toBeInTheDocument();
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getAllByRole("menuitem")).toHaveLength(4);
    expect(screen.getByRole("group", { name: "条目" })).toBeInTheDocument();
  });

  it("点一项：执行并关掉菜单，焦点回到触发按钮", async () => {
    const user = userEvent.setup();
    const onRename = vi.fn();
    render(<Basic onRename={onRename} />);
    const trigger = screen.getByRole("button", { name: "更多" });
    await user.click(trigger);
    await user.click(await screen.findByRole("menuitem", { name: "重命名" }));
    expect(onRename).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(screen.queryByRole("menu")).not.toBeInTheDocument(),
    );
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("键盘：回车打开，方向键移动并跳过禁用项，回车执行", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(<Basic onDelete={onDelete} />);
    await user.tab();
    await user.keyboard("{Enter}");
    await screen.findByRole("menu");
    await waitFor(() =>
      expect(screen.getByRole("menuitem", { name: "重命名" })).toHaveFocus(),
    );

    await user.keyboard("{ArrowDown}");
    // 禁用项仍然能被方向键走到（读屏要能读到它），但回车不起作用
    await user.keyboard("{End}");
    expect(screen.getByRole("menuitem", { name: "删除" })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(onDelete).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(screen.queryByRole("menu")).not.toBeInTheDocument(),
    );
  });

  it("按首字母跳到对应的项", async () => {
    const user = userEvent.setup();
    render(
      <DropdownMenu trigger={<button type="button">更多</button>}>
        <DropdownMenuItem>Archive</DropdownMenuItem>
        <DropdownMenuItem>Move</DropdownMenuItem>
        <DropdownMenuItem>Rename</DropdownMenuItem>
      </DropdownMenu>,
    );
    await user.tab();
    await user.keyboard("{Enter}");
    await screen.findByRole("menu");
    await user.keyboard("r");
    await waitFor(() =>
      expect(screen.getByRole("menuitem", { name: "Rename" })).toHaveFocus(),
    );
  });

  it("Esc 关闭", async () => {
    const user = userEvent.setup();
    render(<Basic defaultOpen />);
    await screen.findByRole("menu");
    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.queryByRole("menu")).not.toBeInTheDocument(),
    );
  });

  it("禁用项点了没有反应", async () => {
    const user = userEvent.setup();
    render(<Basic defaultOpen />);
    const item = await screen.findByRole("menuitem", { name: "移动到…" });
    expect(item).toHaveAttribute("aria-disabled", "true");
    await user.click(item);
    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  it("传 href 的项是一个链接；危险项有标记", async () => {
    render(<Basic defaultOpen />);
    const link = await screen.findByRole("menuitem", { name: "查看详情" });
    expect(link.tagName).toBe("A");
    expect(link).toHaveAttribute("href", "#detail");

    const danger = screen.getByRole("menuitem", { name: "删除" });
    expect(danger).toHaveAttribute("data-tone", "danger");
    expect(danger).toHaveClass("text-danger");
  });

  it("单选组：当前项有标记，选了就换并关掉菜单", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    function Language() {
      const [value, setValue] = useState("zh");
      return (
        <DropdownMenu trigger={<button type="button">语言</button>}>
          <DropdownMenuRadioGroup
            label="界面语言"
            value={value}
            onValueChange={(next) => {
              onValueChange(next);
              setValue(next);
            }}
          >
            <DropdownMenuRadioItem value="zh">简体中文</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="en">English</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenu>
      );
    }
    render(<Language />);
    await user.click(screen.getByRole("button", { name: "语言" }));
    const current = await screen.findByRole("menuitemradio", {
      name: "简体中文",
    });
    expect(current).toHaveAttribute("aria-checked", "true");
    expect(current).toHaveClass("bg-surface-muted", "font-medium");

    await user.click(screen.getByRole("menuitemradio", { name: "English" }));
    expect(onValueChange).toHaveBeenCalledWith("en");
    await waitFor(() =>
      expect(screen.queryByRole("menu")).not.toBeInTheDocument(),
    );
  });

  it("strong 面板是一块固定的深色，当前项整行黄底", async () => {
    render(
      <DropdownMenu
        defaultOpen
        variant="strong"
        trigger={<button type="button">语言</button>}
      >
        <DropdownMenuRadioGroup defaultValue="zh">
          <DropdownMenuRadioItem value="zh">简体中文</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="en">English</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenu>,
    );
    const menu = await screen.findByRole("menu");
    expect(menu).toHaveAttribute("data-theme", "dark");
    expect(screen.getByRole("menuitemradio", { name: "简体中文" })).toHaveClass(
      "bg-action",
      "text-on-action",
    );
  });

  it("触发按钮在局部主题里时，面板带上同一个主题", async () => {
    const user = userEvent.setup();
    render(
      <div data-theme="dark">
        <Basic />
      </div>,
    );
    await user.click(screen.getByRole("button", { name: "更多" }));
    const menu = await screen.findByRole("menu");
    expect(menu.parentElement?.closest("[data-theme]")).toHaveAttribute(
      "data-theme",
      "dark",
    );
  });

  it("受控", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<Basic open onOpenChange={onOpenChange} />);
    await screen.findByRole("menu");
    await user.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
