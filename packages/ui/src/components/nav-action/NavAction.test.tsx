import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { RouterLink } from "../../test/RouterLink";
import { NavAction } from "./NavAction";

describe("NavAction", () => {
  it("默认是一个按钮，三角和分隔线不进名称", async () => {
    const onClick = vi.fn();
    render(<NavAction onClick={onClick}>前往控制台</NavAction>);
    const button = screen.getByRole("button", { name: "前往控制台" });
    expect(button).toHaveAttribute("type", "button");
    expect(button).toHaveAttribute("data-layout", "inline");
    expect(button.querySelector("svg")).toHaveAttribute("aria-hidden", "true");

    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("反转的一整块，悬停变信号黄", () => {
    render(<NavAction>前往控制台</NavAction>);
    expect(screen.getByRole("button")).toHaveClass(
      "bg-surface-inverse",
      "text-ink-inverse",
      "hover:bg-action",
      "hover:text-on-action",
    );
  });

  it("传 href 是链接；传 render 交给路由库的链接组件", () => {
    const { rerender } = render(
      <NavAction href="#console">前往控制台</NavAction>,
    );
    expect(screen.getByRole("link", { name: "前往控制台" })).toHaveAttribute(
      "href",
      "#console",
    );

    rerender(
      <NavAction render={<RouterLink to="/console" />}>前往控制台</NavAction>,
    );
    const link = screen.getByRole("link", { name: "前往控制台" });
    expect(link).toHaveAttribute("href", "/app/console");
    expect(link).toHaveClass("bg-surface-inverse");
  });

  it("禁用：按钮用 disabled，链接去掉地址并标 aria-disabled", async () => {
    const onClick = vi.fn();
    const { rerender } = render(
      <NavAction disabled onClick={onClick}>
        未开放
      </NavAction>,
    );
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button).toHaveClass("bg-disabled", "text-on-disabled");
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();

    rerender(
      <NavAction disabled href="#console" onClick={onClick}>
        未开放
      </NavAction>,
    );
    const link = screen.getByRole("link", { name: "未开放" });
    expect(link).not.toHaveAttribute("href");
    expect(link).toHaveAttribute("aria-disabled", "true");
    await userEvent.click(link);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("三种摆法：竖排的那种文字是竖写的", () => {
    const { rerender } = render(<NavAction layout="block">控制台</NavAction>);
    expect(screen.getByRole("button")).toHaveClass("h-12", "w-full");

    rerender(<NavAction layout="stacked">控制台</NavAction>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("min-h-24", "w-12", "flex-col");
    expect(screen.getByText("控制台")).toHaveClass(
      "[writing-mode:vertical-rl]",
    );

    rerender(<NavAction layout="inline">控制台</NavAction>);
    expect(screen.getByRole("button")).toHaveClass("h-10");
  });

  it("icon 换掉默认的三角", () => {
    render(
      <NavAction icon={<svg data-testid="custom" />}>前往控制台</NavAction>,
    );
    expect(screen.getByTestId("custom")).toBeInTheDocument();
    expect(screen.getByRole("button").querySelectorAll("svg")).toHaveLength(1);
  });
});
