import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Tooltip, TooltipProvider } from "./Tooltip";

/* 提示的文字同时存在于隐藏的描述里，查浮层时把隐藏的那份排除掉 */
const popup = (text: string) =>
  screen.queryByText(text, { ignore: "[hidden]" });

describe("Tooltip", () => {
  it("悬停后出现，移开后消失", async () => {
    const user = userEvent.setup();
    render(
      <Tooltip content="复制到剪贴板" delay={0}>
        <button type="button" aria-label="复制">
          C
        </button>
      </Tooltip>,
    );
    expect(popup("复制到剪贴板")).not.toBeInTheDocument();

    await user.hover(screen.getByRole("button"));
    await waitFor(() => expect(popup("复制到剪贴板")).toBeInTheDocument());

    await user.unhover(screen.getByRole("button"));
    await waitFor(() => expect(popup("复制到剪贴板")).not.toBeInTheDocument());
  });

  it("键盘聚焦时出现，Esc 关掉", async () => {
    const user = userEvent.setup();
    render(
      <Tooltip content="复制到剪贴板">
        <button type="button" aria-label="复制">
          C
        </button>
      </Tooltip>,
    );

    await user.tab();
    expect(screen.getByRole("button")).toHaveFocus();
    await waitFor(() => expect(popup("复制到剪贴板")).toBeInTheDocument());

    await user.keyboard("{Escape}");
    await waitFor(() => expect(popup("复制到剪贴板")).not.toBeInTheDocument());
  });

  it("内容作为补充说明关联给触发元素", () => {
    render(
      <Tooltip content="复制到剪贴板">
        <button type="button" aria-label="复制">
          C
        </button>
      </Tooltip>,
    );
    const button = screen.getByRole("button", { name: "复制" });
    expect(button).toHaveAccessibleDescription("复制到剪贴板");
  });

  it("和 aria-label 一字不差时不重复关联", () => {
    render(
      <Tooltip content="复制">
        <button type="button" aria-label="复制">
          C
        </button>
      </Tooltip>,
    );
    const button = screen.getByRole("button", { name: "复制" });
    expect(button).not.toHaveAttribute("aria-describedby");
  });

  it("保留触发元素自己的说明与事件", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <>
        <p id="hint">需要管理员权限</p>
        <Tooltip content="复制到剪贴板">
          <button type="button" aria-describedby="hint" onClick={onClick}>
            复制
          </button>
        </Tooltip>
      </>,
    );
    const button = screen.getByRole("button", { name: "复制" });
    expect(button).toHaveAccessibleDescription("需要管理员权限 复制到剪贴板");
    await user.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("禁用后不出现，也不关联说明", async () => {
    const user = userEvent.setup();
    render(
      <Tooltip content="复制到剪贴板" delay={0} disabled>
        <button type="button" aria-label="复制">
          C
        </button>
      </Tooltip>,
    );
    await user.hover(screen.getByRole("button"));
    expect(popup("复制到剪贴板")).not.toBeInTheDocument();
    expect(screen.getByRole("button")).not.toHaveAttribute("aria-describedby");
  });

  it("受控的打开状态", () => {
    render(
      <Tooltip content="复制到剪贴板" open>
        <button type="button" aria-label="复制">
          C
        </button>
      </Tooltip>,
    );
    expect(popup("复制到剪贴板")).toBeInTheDocument();
  });

  it("提示是一块和页面相反的主题：默认的亮色页面上是深色", () => {
    render(
      <Tooltip content="复制到剪贴板" open>
        <button type="button" aria-label="复制">
          C
        </button>
      </Tooltip>,
    );
    expect(popup("复制到剪贴板")?.closest("[data-theme]")).toHaveAttribute(
      "data-theme",
      "dark",
    );
  });

  it("触发元素在暗色的局部主题里时，提示是浅色", () => {
    render(
      <div data-theme="dark">
        <Tooltip content="复制到剪贴板" open>
          <button type="button" aria-label="复制">
            C
          </button>
        </Tooltip>
      </div>,
    );
    const scope = popup("复制到剪贴板")?.closest("[data-theme]");
    expect(scope).toHaveAttribute("data-theme", "light");
    // 是挂在 body 下的那个容器，不是页面里原来的那一层
    expect(scope).not.toContainElement(screen.getByRole("button"));
  });

  it("可以放进 TooltipProvider", async () => {
    const user = userEvent.setup();
    render(
      <TooltipProvider delay={0}>
        <Tooltip content="加粗">
          <button type="button" aria-label="B">
            B
          </button>
        </Tooltip>
      </TooltipProvider>,
    );
    await user.hover(screen.getByRole("button"));
    await waitFor(() => expect(popup("加粗")).toBeInTheDocument());
  });
});
