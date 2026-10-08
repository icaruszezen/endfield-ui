import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./Button";

describe("Button", () => {
  it("默认渲染为 type=button 的 control 按钮", () => {
    render(<Button>更多情报</Button>);
    const button = screen.getByRole("button", { name: "更多情报" });
    expect(button).toHaveAttribute("type", "button");
    expect(button).toHaveAttribute("data-variant", "control");
    expect(button).toHaveAttribute("data-size", "md");
  });

  it("点击时触发 onClick", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>确认</Button>);
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("禁用时不触发 onClick", async () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        确认
      </Button>,
    );
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("加载中保持可聚焦、标记忙碌、键盘也触发不了", async () => {
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        提交
      </Button>,
    );
    const button = screen.getByRole("button", { name: "提交" });
    expect(button).not.toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toHaveAttribute("aria-disabled", "true");

    button.focus();
    await userEvent.keyboard("{Enter}");
    expect(onClick).not.toHaveBeenCalled();
  });

  it("loadingText 只在加载中进入可访问名称", () => {
    const { rerender } = render(<Button loadingText="处理中">提交</Button>);
    expect(screen.getByRole("button")).toHaveAccessibleName("提交");

    rerender(
      <Button loading loadingText="处理中">
        提交
      </Button>,
    );
    expect(screen.getByRole("button")).toHaveAccessibleName("处理中");
  });

  it("传 href 时渲染为链接", () => {
    render(<Button href="/news">查看全部</Button>);
    const link = screen.getByRole("link", { name: "查看全部" });
    expect(link).toHaveAttribute("href", "/news");
  });

  it("禁用的链接去掉 href 并标记 aria-disabled", () => {
    render(
      <Button href="/news" disabled>
        查看全部
      </Button>,
    );
    const link = screen.getByRole("link", { name: "查看全部" });
    expect(link).not.toHaveAttribute("href");
    expect(link).toHaveAttribute("aria-disabled", "true");
  });

  it("装饰记号不进入可访问名称", () => {
    render(<Button variant="text">查看全部</Button>);
    expect(screen.getByRole("button")).toHaveAccessibleName("查看全部");
  });

  it("className 可以覆盖内置类", () => {
    render(<Button className="min-w-40">确认</Button>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("min-w-40");
    expect(button).not.toHaveClass("min-w-24");
  });
});
