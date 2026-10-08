import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ToastProvider, useToast, type ToastOptions } from "./Toast";

function Demo({ options }: { options: (string | ToastOptions)[] }) {
  const toast = useToast();
  return (
    <>
      {options.map((option, index) => (
        <button key={index} type="button" onClick={() => toast(option)}>
          弹出 {index + 1}
        </button>
      ))}
      <button type="button" onClick={() => toast.dismiss()}>
        全部关掉
      </button>
    </>
  );
}

function setup(options: (string | ToastOptions)[], duration?: number) {
  return render(
    <ToastProvider duration={duration}>
      <Demo options={options} />
    </ToastProvider>,
  );
}

/* 读屏用的那份副本是隐藏的；这里查看得见的那一条 */
const toastOf = (text: string) =>
  screen.queryAllByText(text).find((node) => node.closest("[data-theme]")) ??
  null;

afterEach(() => {
  vi.useRealTimers();
});

describe("Toast", () => {
  it("弹出一句话，放在一个有名称的提示区域里", async () => {
    const user = userEvent.setup();
    setup(["已保存"]);
    expect(screen.getByRole("region", { name: "通知" })).toBeInTheDocument();
    expect(toastOf("已保存")).toBeNull();

    await user.click(screen.getByRole("button", { name: "弹出 1" }));
    await waitFor(() => expect(toastOf("已保存")).toBeInTheDocument());
    const root = toastOf("已保存")!.closest("[data-theme]")!;
    // 黑底白字不随主题变
    expect(root).toHaveAttribute("data-theme", "dark");
    expect(root).toHaveClass("bg-black/80", "text-white");
  });

  it("同时只显示一条，新的替换旧的", async () => {
    const user = userEvent.setup();
    setup(["第一条", "第二条"]);
    await user.click(screen.getByRole("button", { name: "弹出 1" }));
    await waitFor(() => expect(toastOf("第一条")).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: "弹出 2" }));
    await waitFor(() => expect(toastOf("第二条")).toBeInTheDocument());
    await waitFor(() => expect(toastOf("第一条")).toBeNull());
  });

  it("到时间自己消失", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    setup(["已保存"], 2000);
    await user.click(screen.getByRole("button", { name: "弹出 1" }));
    await waitFor(() => expect(toastOf("已保存")).toBeInTheDocument());

    act(() => {
      vi.advanceTimersByTime(1900);
    });
    expect(toastOf("已保存")).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(300);
    });
    await waitFor(() => expect(toastOf("已保存")).toBeNull());
  });

  it("duration 为 0 时一直留着，并出现关闭图标", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    setup([{ message: "连接已断开", duration: 0 }], 2000);
    await user.click(screen.getByRole("button", { name: "弹出 1" }));
    await waitFor(() => expect(toastOf("连接已断开")).toBeInTheDocument());

    act(() => {
      vi.advanceTimersByTime(10000);
    });
    expect(toastOf("连接已断开")).toBeInTheDocument();

    // 基元在指针或焦点进入提示区域之前不把关闭图标报给读屏，所以按标签查，不按角色查
    await user.click(screen.getByLabelText("关闭"));
    await waitFor(() => expect(toastOf("连接已断开")).toBeNull());
  });

  it("普通的提示没有关闭图标", async () => {
    const user = userEvent.setup();
    setup(["已保存"]);
    await user.click(screen.getByRole("button", { name: "弹出 1" }));
    await waitFor(() => expect(toastOf("已保存")).toBeInTheDocument());
    expect(screen.queryByLabelText("关闭")).not.toBeInTheDocument();
  });

  it("带操作：点了执行并关掉这一条", async () => {
    const user = userEvent.setup();
    const onUndo = vi.fn();
    setup([
      { message: "已销毁 3 件", action: { label: "撤销", onClick: onUndo } },
    ]);
    await user.click(screen.getByRole("button", { name: "弹出 1" }));
    await user.click(await screen.findByRole("button", { name: "撤销" }));
    expect(onUndo).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(toastOf("已销毁 3 件")).toBeNull());
  });

  it("色调只加一个小图形；警告与失败会打断读屏", async () => {
    const user = userEvent.setup();
    setup([
      { message: "已保存", tone: "success" },
      { message: "保存失败", tone: "danger" },
    ]);
    await user.click(screen.getByRole("button", { name: "弹出 1" }));
    await waitFor(() => expect(toastOf("已保存")).toBeInTheDocument());
    const success = toastOf("已保存")!.closest("[data-theme]")!;
    expect(success).toHaveAttribute("data-type", "success");
    expect(success).toHaveAttribute("role", "dialog");
    expect(success.querySelector("svg")).toHaveClass("text-success");
    // 底色不换
    expect(success).toHaveClass("bg-black/80");

    await user.click(screen.getByRole("button", { name: "弹出 2" }));
    await waitFor(() => expect(toastOf("保存失败")).toBeInTheDocument());
    expect(toastOf("保存失败")!.closest("[data-theme]")).toHaveAttribute(
      "role",
      "alertdialog",
    );
  });

  it("dismiss 关掉当前这条", async () => {
    const user = userEvent.setup();
    setup([{ message: "连接已断开", duration: 0 }]);
    await user.click(screen.getByRole("button", { name: "弹出 1" }));
    await waitFor(() => expect(toastOf("连接已断开")).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: "全部关掉" }));
    await waitFor(() => expect(toastOf("连接已断开")).toBeNull());
  });

  it("在 ToastProvider 外面用会直接报错", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Demo options={[]} />)).toThrow(/ToastProvider/);
    spy.mockRestore();
  });
});
