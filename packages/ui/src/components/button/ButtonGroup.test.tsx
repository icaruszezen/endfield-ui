import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "./Button";
import { ButtonGroup } from "./ButtonGroup";

describe("ButtonGroup", () => {
  it("是一个分组，名称由使用方给", () => {
    render(
      <ButtonGroup aria-label="表单操作">
        <Button variant="light">取消</Button>
        <Button>确认</Button>
      </ButtonGroup>,
    );
    const group = screen.getByRole("group", { name: "表单操作" });
    expect(group.children).toHaveLength(2);
  });

  it("默认横排、靠右、间距 12px", () => {
    render(<ButtonGroup data-testid="group" />);
    const group = screen.getByTestId("group");
    expect(group).toHaveAttribute("data-orientation", "horizontal");
    expect(group).toHaveClass("flex-wrap", "justify-end", "gap-3");
  });

  it("对齐与间距可以换", () => {
    render(<ButtonGroup data-testid="group" align="between" gap="sm" />);
    expect(screen.getByTestId("group")).toHaveClass("justify-between", "gap-2");
  });

  it("竖排时按钮拉到等宽", () => {
    render(<ButtonGroup data-testid="group" orientation="vertical" />);
    const group = screen.getByTestId("group");
    expect(group).toHaveAttribute("data-orientation", "vertical");
    expect(group).toHaveClass("flex-col", "items-stretch");
    expect(group).not.toHaveClass("justify-end");
  });
});
