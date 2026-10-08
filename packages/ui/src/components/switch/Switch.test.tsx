import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { Switch } from "./Switch";

describe("Switch", () => {
  it("输出 switch 语义，文字标签是可访问名称", () => {
    render(<Switch>自动同步</Switch>);
    const control = screen.getByRole("switch", { name: "自动同步" });
    expect(control).not.toBeChecked();
  });

  it("点击标签或按空格切换，并通知 onCheckedChange", async () => {
    const onCheckedChange = vi.fn();
    render(<Switch onCheckedChange={onCheckedChange}>自动同步</Switch>);

    await userEvent.click(screen.getByText("自动同步"));
    expect(screen.getByRole("switch")).toBeChecked();
    expect(onCheckedChange).toHaveBeenLastCalledWith(true);

    await userEvent.keyboard(" ");
    expect(screen.getByRole("switch")).not.toBeChecked();
    expect(onCheckedChange).toHaveBeenLastCalledWith(false);
  });

  it("defaultChecked 决定初始状态", () => {
    render(<Switch defaultChecked>自动同步</Switch>);
    expect(screen.getByRole("switch")).toBeChecked();
  });

  it("受控用法", async () => {
    function Controlled() {
      const [checked, setChecked] = useState(true);
      return (
        <Switch checked={checked} onCheckedChange={setChecked}>
          自动同步
        </Switch>
      );
    }
    render(<Controlled />);
    await userEvent.click(screen.getByRole("switch"));
    expect(screen.getByRole("switch")).not.toBeChecked();
  });

  it("禁用时点不动", async () => {
    const onCheckedChange = vi.fn();
    render(
      <Switch disabled onCheckedChange={onCheckedChange}>
        自动同步
      </Switch>,
    );
    await userEvent.click(screen.getByText("自动同步"));
    expect(screen.getByRole("switch")).not.toBeChecked();
    expect(onCheckedChange).not.toHaveBeenCalled();
  });

  it("没有文字标签时用 aria-label", () => {
    render(<Switch aria-label="自动同步" />);
    expect(screen.getByRole("switch", { name: "自动同步" })).toBeInTheDocument();
  });
});
