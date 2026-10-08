import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { Textarea } from "./Textarea";

describe("Textarea", () => {
  it("默认三行", () => {
    render(<Textarea aria-label="备注" />);
    expect(screen.getByRole("textbox", { name: "备注" })).toHaveAttribute(
      "rows",
      "3",
    );
  });

  it("默认不显示字数", () => {
    const { container } = render(<Textarea aria-label="备注" />);
    expect(container.querySelector("[data-count]")).toBeNull();
  });

  it("非受控：字数随输入更新，有上限时写成 n / max", async () => {
    const { container } = render(
      <Textarea
        aria-label="备注"
        showCount
        maxLength={200}
        defaultValue="已归档"
      />,
    );
    const count = container.querySelector("[data-count]");
    expect(count).toHaveTextContent("3 / 200");

    await userEvent.type(screen.getByRole("textbox"), "两字");
    expect(count).toHaveTextContent("5 / 200");
  });

  it("受控：字数取自 value", async () => {
    function Controlled() {
      const [value, setValue] = useState("记录");
      return (
        <Textarea
          aria-label="备注"
          showCount
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
      );
    }
    const { container } = render(<Controlled />);
    const count = container.querySelector("[data-count]");
    expect(count).toHaveTextContent("2");

    await userEvent.type(screen.getByRole("textbox"), "一");
    expect(count).toHaveTextContent("3");
  });

  it("invalid 输出 aria-invalid", () => {
    render(<Textarea aria-label="备注" invalid />);
    expect(screen.getByRole("textbox")).toHaveAttribute("aria-invalid", "true");
  });

  it("outline 换成四边描边", () => {
    render(<Textarea aria-label="备注" variant="outline" />);
    const box = screen.getByRole("textbox").parentElement;
    expect(box).toHaveAttribute("data-variant", "outline");
    expect(box).toHaveClass("border", "bg-surface");
    expect(box).not.toHaveClass("border-b-2");
  });
});
