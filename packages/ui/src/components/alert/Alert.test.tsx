import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Alert } from "./Alert";

describe("Alert", () => {
  it("info 与 success 是 status，warning 与 danger 是 alert", () => {
    const { rerender } = render(<Alert tone="info">内容</Alert>);
    expect(screen.getByRole("status")).toHaveTextContent("内容");

    rerender(<Alert tone="success">内容</Alert>);
    expect(screen.getByRole("status")).toBeInTheDocument();

    rerender(<Alert tone="warning">内容</Alert>);
    expect(screen.getByRole("alert")).toBeInTheDocument();

    rerender(<Alert tone="danger">内容</Alert>);
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("role 可以由使用方覆盖", () => {
    render(
      <Alert tone="danger" role="status">
        内容
      </Alert>,
    );
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("图标是装饰，对读屏隐藏；传 null 去掉", () => {
    const { container, rerender } = render(<Alert>内容</Alert>);
    expect(container.querySelector("svg")?.parentElement).toHaveAttribute(
      "aria-hidden",
      "true",
    );

    rerender(<Alert icon={null}>内容</Alert>);
    expect(container.querySelector("svg")).toBeNull();
  });

  it("渲染标题与操作", () => {
    render(
      <Alert title="保存失败" action={<button type="button">重试</button>}>
        网络连接已断开。
      </Alert>,
    );
    expect(screen.getByText("保存失败")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "重试" })).toBeInTheDocument();
  });

  it("传了 onClose 才有关闭按钮，点击时调用", async () => {
    const onClose = vi.fn();
    const { rerender } = render(<Alert>内容</Alert>);
    expect(screen.queryByRole("button")).toBeNull();

    rerender(<Alert onClose={onClose}>内容</Alert>);
    await userEvent.click(screen.getByRole("button", { name: "关闭" }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
