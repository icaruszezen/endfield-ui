import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "../dropdown-menu/DropdownMenu";
import { ContextMenu } from "./ContextMenu";

function Basic({
  onRename = () => {},
  ...props
}: { onRename?: () => void } & Partial<
  React.ComponentProps<typeof ContextMenu>
>) {
  return (
    <ContextMenu
      menu={
        <>
          <DropdownMenuItem onClick={onRename}>重命名</DropdownMenuItem>
          <DropdownMenuCheckboxItem>置顶</DropdownMenuCheckboxItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem tone="danger">删除</DropdownMenuItem>
        </>
      }
      {...props}
    >
      <div data-testid="area" className="row">
        北区七号站
      </div>
    </ContextMenu>
  );
}

describe("ContextMenu", () => {
  it("区域还是原来那个元素，平时没有菜单", () => {
    render(<Basic />);
    const area = screen.getByTestId("area");
    expect(area.tagName).toBe("DIV");
    expect(area).toHaveClass("row");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("右键打开菜单，里面是下拉菜单的那一组选项", async () => {
    render(<Basic />);
    fireEvent.contextMenu(screen.getByTestId("area"));
    expect(await screen.findByRole("menu")).toBeInTheDocument();
    expect(screen.getAllByRole("menuitem")).toHaveLength(2);
    expect(
      screen.getByRole("menuitemcheckbox", { name: "置顶" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "删除" })).toHaveAttribute(
      "data-tone",
      "danger",
    );
  });

  it("点一项：执行并关掉菜单", async () => {
    const user = userEvent.setup();
    const onRename = vi.fn();
    const onOpenChange = vi.fn();
    render(<Basic onRename={onRename} onOpenChange={onOpenChange} />);
    fireEvent.contextMenu(screen.getByTestId("area"));
    expect(onOpenChange).toHaveBeenLastCalledWith(true);

    await user.click(await screen.findByRole("menuitem", { name: "重命名" }));
    expect(onRename).toHaveBeenCalledOnce();
    await waitFor(() =>
      expect(screen.queryByRole("menu")).not.toBeInTheDocument(),
    );
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it("Esc 关闭", async () => {
    const user = userEvent.setup();
    render(<Basic />);
    fireEvent.contextMenu(screen.getByTestId("area"));
    await screen.findByRole("menu");
    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.queryByRole("menu")).not.toBeInTheDocument(),
    );
  });

  it("strong：面板是一个深色的局部主题", async () => {
    render(<Basic variant="strong" />);
    fireEvent.contextMenu(screen.getByTestId("area"));
    const menu = await screen.findByRole("menu");
    expect(menu).toHaveAttribute("data-theme", "dark");
    expect(menu).toHaveAttribute("data-variant", "strong");
  });

  it("disabled：右键不打开菜单，也不拦浏览器自己的", () => {
    render(<Basic disabled />);
    const notPrevented = fireEvent.contextMenu(screen.getByTestId("area"));
    expect(notPrevented).toBe(true);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("区域在一个局部主题里时，菜单的容器抄到同一个主题", async () => {
    render(
      <div data-theme="dark">
        <Basic />
      </div>,
    );
    fireEvent.contextMenu(screen.getByTestId("area"));
    const menu = await screen.findByRole("menu");
    expect(menu.closest("[data-theme]")).toHaveAttribute("data-theme", "dark");
  });
});
