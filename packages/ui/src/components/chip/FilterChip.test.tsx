import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { FilterChip } from "./FilterChip";

describe("FilterChip", () => {
  it("是一个切换按钮，点击在选中与未选之间切换", async () => {
    const onSelectedChange = vi.fn();
    render(<FilterChip onSelectedChange={onSelectedChange}>新闻</FilterChip>);
    const chip = screen.getByRole("button", { name: "新闻" });
    expect(chip).toHaveAttribute("aria-pressed", "false");

    await userEvent.click(chip);
    expect(chip).toHaveAttribute("aria-pressed", "true");
    expect(onSelectedChange).toHaveBeenLastCalledWith(true);

    await userEvent.click(chip);
    expect(chip).toHaveAttribute("aria-pressed", "false");
    expect(onSelectedChange).toHaveBeenLastCalledWith(false);
  });

  it("defaultSelected 决定初始状态", () => {
    render(<FilterChip defaultSelected>新闻</FilterChip>);
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "true");
  });

  it("受控用法由外部决定状态", async () => {
    function Controlled() {
      const [selected, setSelected] = useState(false);
      return (
        <FilterChip selected={selected} onSelectedChange={setSelected}>
          公告
        </FilterChip>
      );
    }
    render(<Controlled />);
    await userEvent.click(screen.getByRole("button"));
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "true");
  });

  it("受控但外部不更新时保持原状", async () => {
    render(<FilterChip selected={false}>公告</FilterChip>);
    await userEvent.click(screen.getByRole("button"));
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "false");
  });

  it("禁用时点不动", async () => {
    const onSelectedChange = vi.fn();
    render(
      <FilterChip disabled onSelectedChange={onSelectedChange}>
        活动
      </FilterChip>,
    );
    await userEvent.click(screen.getByRole("button"));
    expect(onSelectedChange).not.toHaveBeenCalled();
  });

  it("onClick 里 preventDefault 可以拦下切换", async () => {
    render(
      <FilterChip onClick={(event) => event.preventDefault()}>活动</FilterChip>,
    );
    await userEvent.click(screen.getByRole("button"));
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "false");
  });
});
