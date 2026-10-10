import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { stubAnimations } from "../../test/animations";
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

  it("不传 open：点关闭只是通知，提示条还在；和传了 open 的画出来一样", async () => {
    const { rerender } = render(<Alert onClose={() => {}}>内容</Alert>);
    await userEvent.click(screen.getByRole("button", { name: "关闭" }));
    const plain = screen.getByRole("status");
    expect(plain).not.toHaveAttribute("inert");
    expect(plain).not.toHaveAttribute("style");
    const className = plain.className;

    rerender(
      <Alert open onClose={() => {}}>
        内容
      </Alert>,
    );
    expect(screen.getByRole("status").className).toBe(className);
  });

  it("open 一开始就是假的：什么都不渲染；置真就在", () => {
    const { rerender } = render(<Alert open={false}>内容</Alert>);
    expect(screen.queryByRole("status")).toBeNull();

    rerender(<Alert open>内容</Alert>);
    expect(screen.getByRole("status")).toHaveTextContent("内容");
  });

  it("open 置假：先留着收起（点不到），收完卸载并触发 onExited", async () => {
    const finish = stubAnimations();
    const onExited = vi.fn();
    const { rerender } = render(
      <Alert open onExited={onExited}>
        内容
      </Alert>,
    );
    const alert = screen.getByRole("status");

    rerender(
      <Alert open={false} onExited={onExited}>
        内容
      </Alert>,
    );
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveAttribute("inert");
    expect(alert).toHaveClass("pointer-events-none", "overflow-hidden");
    // 收到"它不在了"的样子
    expect(alert.style.height).toBe("0px");
    expect(alert.style.opacity).toBe("0");
    expect(onExited).not.toHaveBeenCalled();

    await finish();
    expect(alert).not.toBeInTheDocument();
    expect(onExited).toHaveBeenCalledTimes(1);
  });

  it("没有动效可等的环境里：open 置假就卸载", () => {
    const onExited = vi.fn();
    const { rerender } = render(
      <Alert open onExited={onExited}>
        内容
      </Alert>,
    );
    rerender(
      <Alert open={false} onExited={onExited}>
        内容
      </Alert>,
    );
    expect(screen.queryByRole("status")).toBeNull();
    expect(onExited).toHaveBeenCalledTimes(1);
  });

  it("收到一半又置真：还在，摆上去的样式撤掉，使用方自己的样式留着", async () => {
    const finish = stubAnimations();
    const style = { marginBottom: 8 };
    const { rerender } = render(
      <Alert open style={style}>
        内容
      </Alert>,
    );
    const alert = screen.getByRole("status");

    rerender(
      <Alert open={false} style={style}>
        内容
      </Alert>,
    );
    expect(alert.style.marginBottom).toBe("0px");

    rerender(
      <Alert open style={style}>
        内容
      </Alert>,
    );
    expect(alert).not.toHaveAttribute("inert");
    expect(alert).not.toHaveClass("pointer-events-none");
    expect(alert.style.height).toBe("");
    expect(alert.style.opacity).toBe("");
    expect(alert.style.marginBottom).toBe("8px");

    await finish();
    expect(alert).toBeInTheDocument();
  });

  it("ref 仍然给最外面那一层", () => {
    const ref = { current: null as HTMLDivElement | null };
    render(<Alert ref={ref}>内容</Alert>);
    expect(ref.current).toBe(screen.getByRole("status"));
  });
});
