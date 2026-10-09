import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CompletionBanner } from "./CompletionBanner";

describe("CompletionBanner", () => {
  it("是一个状态区，标题默认是三级", () => {
    render(<CompletionBanner title="第三阶段已完成" />);
    const banner = screen.getByRole("status");
    expect(banner).toHaveTextContent("第三阶段已完成");
    expect(
      screen.getByRole("heading", { level: 3, name: "第三阶段已完成" }),
    ).toBeInTheDocument();
  });

  it("整块是一个反转主题：行动按钮按这块底色取值", () => {
    render(
      <CompletionBanner
        title="全部完成"
        action={<button type="button">领取</button>}
      />,
    );
    const banner = screen.getByRole("status");
    expect(banner).toHaveAttribute("data-theme", "inverse");
    expect(banner).toHaveClass("bg-surface", "text-ink");
    expect(screen.getByRole("heading")).toHaveClass("text-accent-ink");
    expect(
      screen.getByRole("button", { name: "领取" }).closest("[data-theme]"),
    ).toBe(banner);
  });

  it("标题层级可以换", () => {
    render(<CompletionBanner title="全部完成" level={2} />);
    expect(screen.getByRole("heading", { level: 2 })).toBeInTheDocument();
  });

  it("背后的描边词是装饰，可以换、可以去掉", () => {
    const { rerender } = render(<CompletionBanner title="全部完成" />);
    const word = screen.getByText("COMPLETED");
    expect(word).toHaveAttribute("aria-hidden", "true");
    expect(word).toHaveClass("ghost-outline");

    rerender(<CompletionBanner title="全部完成" word="CLEAR" />);
    expect(screen.getByText("CLEAR")).toBeInTheDocument();

    rerender(<CompletionBanner title="全部完成" word={null} />);
    expect(screen.queryByText("CLEAR")).not.toBeInTheDocument();
    expect(
      screen.getByRole("status").querySelector("[aria-hidden]"),
    ).toBeNull();
  });

  it("说明与行动按需出现", () => {
    render(
      <CompletionBanner
        title="全部完成"
        description="共 6 项，用时 3 天"
        action={<button type="button">领取</button>}
      />,
    );
    expect(screen.getByText("共 6 项，用时 3 天")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "领取" })).toBeInTheDocument();
  });
});
