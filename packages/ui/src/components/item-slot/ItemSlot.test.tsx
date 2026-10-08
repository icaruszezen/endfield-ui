import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ItemSlot } from "./ItemSlot";

describe("ItemSlot", () => {
  it("不传 href 和 onClick 时是静态格，名称读得到", () => {
    render(<ItemSlot name="合金锭" data-testid="slot" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByTestId("slot")).toHaveTextContent("合金锭");
  });

  it("传 onClick 是按钮，选中用 aria-pressed 表达", async () => {
    const onClick = vi.fn();
    const { rerender } = render(<ItemSlot name="合金锭" onClick={onClick} />);
    const button = screen.getByRole("button", { name: "合金锭" });
    expect(button).toHaveAttribute("aria-pressed", "false");

    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);

    rerender(<ItemSlot name="合金锭" onClick={onClick} selected />);
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "true");
  });

  it("传 href 是链接，选中用 aria-current 表达", () => {
    render(<ItemSlot name="合金锭" href="#alloy" selected />);
    const link = screen.getByRole("link", { name: "合金锭" });
    expect(link).toHaveAttribute("href", "#alloy");
    expect(link).toHaveAttribute("aria-current", "true");
  });

  it("选中时最外层画角括号，焦点环让到括号之外", () => {
    const { rerender } = render(
      <ItemSlot name="合金锭" onClick={() => {}} data-testid="slot" />,
    );
    expect(screen.getByTestId("slot")).not.toHaveClass("corner-brackets");

    rerender(
      <ItemSlot name="合金锭" onClick={() => {}} selected data-testid="slot" />,
    );
    expect(screen.getByTestId("slot")).toHaveClass("corner-brackets");
    expect(screen.getByTestId("slot")).toHaveAttribute("data-selected");
    expect(screen.getByRole("button")).toHaveClass(
      "focus-visible:outline-offset-[6px]",
    );
  });

  it("数量、稀有度与各状态拼进读屏文字", () => {
    render(
      <ItemSlot
        name="合金锭"
        count={128}
        rarity={3}
        isNew
        locked
        onClick={() => {}}
      />,
    );
    expect(
      screen.getByRole("button", {
        name: "合金锭，数量 128，稀有度 3，新获得，已锁定",
      }),
    ).toBeInTheDocument();
  });

  it("看得见的数量与角标对读屏隐藏，不重复朗读", () => {
    render(<ItemSlot name="合金锭" count={128} isNew data-testid="slot" />);
    const slot = screen.getByTestId("slot");
    expect(screen.getByText("128")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByText("NEW")).toHaveAttribute("aria-hidden", "true");
    expect(slot.querySelectorAll(".sr-only")).toHaveLength(1);
  });

  it("稀有度另有同样个数的小菱形，不只靠颜色", () => {
    render(<ItemSlot name="合金锭" rarity={4} data-testid="slot" />);
    const slot = screen.getByTestId("slot");
    expect(slot).toHaveAttribute("data-rarity", "4");
    expect(slot.querySelectorAll(".rotate-45")).toHaveLength(4);
    // 最高一档在渐变上叠斜纹
    expect(slot.querySelector(".hatch-fine")).not.toBeNull();
  });

  it("未获得时不渲染内容，换成占位符", () => {
    render(
      <ItemSlot name="合金锭" unowned onClick={() => {}}>
        <span data-testid="icon" />
      </ItemSlot>,
    );
    expect(screen.queryByTestId("icon")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "合金锭，未获得" }),
    ).toBeInTheDocument();
  });

  it("不可用：遮罩上的字进入读屏文字；只传 true 时读作\"不可用\"", () => {
    const { rerender } = render(
      <ItemSlot name="合金锭" unavailable="售罄" onClick={() => {}} />,
    );
    expect(
      screen.getByRole("button", { name: "合金锭，售罄" }),
    ).toBeInTheDocument();

    rerender(<ItemSlot name="合金锭" unavailable onClick={() => {}} />);
    expect(
      screen.getByRole("button", { name: "合金锭，不可用" }),
    ).toBeInTheDocument();
  });

  it("label 可以整句换掉", () => {
    render(
      <ItemSlot name="合金锭" count={3} label="Alloy ingot ×3" onClick={() => {}} />,
    );
    expect(
      screen.getByRole("button", { name: "Alloy ingot ×3" }),
    ).toBeInTheDocument();
  });

  it("禁用的按钮点不动", async () => {
    const onClick = vi.fn();
    render(<ItemSlot name="合金锭" onClick={onClick} disabled />);
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("两种宽高比", () => {
    const { rerender } = render(<ItemSlot name="合金锭" data-testid="slot" />);
    expect(screen.getByTestId("slot")).toHaveClass("aspect-square");

    rerender(<ItemSlot name="合金锭" ratio="4/5" data-testid="slot" />);
    expect(screen.getByTestId("slot")).toHaveClass("aspect-4/5");
  });
});
