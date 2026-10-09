import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { Field } from "../field/Field";
import { OtpInput, type OtpInputProps } from "./OtpInput";

const slots = () => screen.getAllByRole("textbox") as HTMLInputElement[];
const values = () => slots().map((slot) => slot.value);

function Code(props: Partial<OtpInputProps>) {
  return <OtpInput aria-label="交接口令" {...props} />;
}

describe("OtpInput", () => {
  it("填上的那一格带 data-filled：字色靠它从透明变成墨色", async () => {
    const user = userEvent.setup();
    render(<OtpInput aria-label="验证码" />);
    expect(slots()[0]).not.toHaveAttribute("data-filled");
    expect(slots()[0]).toHaveClass("text-transparent", "data-filled:text-ink");

    await user.click(slots()[0]!);
    await user.keyboard("2");
    expect(slots()[0]).toHaveAttribute("data-filled");
    expect(slots()[1]).not.toHaveAttribute("data-filled");
  });

  it("默认六格；length 改格数", () => {
    const { rerender } = render(<Code />);
    expect(slots()).toHaveLength(6);
    rerender(<Code length={4} />);
    expect(slots()).toHaveLength(4);
  });

  it("整组是一个有名称的分组；第一格用同一个名称，后面每格报第几位", () => {
    render(<Code length={4} />);
    expect(screen.getByRole("group", { name: "交接口令" })).toBeInTheDocument();
    expect(slots().map((slot) => slot.getAttribute("aria-label"))).toEqual([
      null,
      "第 2 位，共 4 位",
      "第 3 位，共 4 位",
      "第 4 位，共 4 位",
    ]);
    expect(slots()[0]).toHaveAccessibleName("交接口令");
  });

  it("slotLabel 换每一格的名称", () => {
    render(<Code length={3} slotLabel={(position) => `Digit ${position}`} />);
    expect(slots()[1]).toHaveAccessibleName("Digit 2");
    expect(slots()[2]).toHaveAccessibleName("Digit 3");
  });

  it("打一位跳一格；整组只占一个 Tab 停靠点", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <>
        <Code length={4} onValueChange={onValueChange} />
        <button type="button">下一步</button>
      </>,
    );
    await user.tab();
    expect(slots()[0]).toHaveFocus();

    await user.keyboard("12");
    expect(values()).toEqual(["1", "2", "", ""]);
    expect(slots()[2]).toHaveFocus();
    expect(onValueChange).toHaveBeenLastCalledWith("12");

    await user.tab();
    expect(screen.getByRole("button", { name: "下一步" })).toHaveFocus();
  });

  it("Backspace 删掉这一位并退一格", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <Code length={4} defaultValue="123" onValueChange={onValueChange} />,
    );
    await user.click(slots()[2]!);
    await user.keyboard("{Backspace}");
    expect(values()).toEqual(["1", "2", "", ""]);
    expect(onValueChange).toHaveBeenLastCalledWith("12");
  });

  it("方向键在格子之间走", async () => {
    const user = userEvent.setup();
    render(<Code length={4} defaultValue="1234" />);
    await user.click(slots()[1]!);
    await user.keyboard("{ArrowRight}");
    expect(slots()[2]).toHaveFocus();
    await user.keyboard("{ArrowLeft}{ArrowLeft}");
    expect(slots()[0]).toHaveFocus();
  });

  it("粘贴一整串分到各格，空白去掉", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Code onValueChange={onValueChange} />);
    await user.click(slots()[0]!);
    await user.paste("204 157");
    expect(values()).toEqual(["2", "0", "4", "1", "5", "7"]);
    expect(onValueChange).toHaveBeenLastCalledWith("204157");
  });

  it("numeric 不收字母；alphanumeric 收，uppercase 把值也变成大写", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { rerender } = render(<Code length={4} />);
    await user.click(slots()[0]!);
    await user.keyboard("a1");
    expect(values()).toEqual(["1", "", "", ""]);

    rerender(
      <Code
        key="alnum"
        length={4}
        type="alphanumeric"
        uppercase
        onValueChange={onValueChange}
      />,
    );
    await user.click(slots()[0]!);
    await user.keyboard("n7k");
    expect(values()).toEqual(["N", "7", "K", ""]);
    expect(onValueChange).toHaveBeenLastCalledWith("N7K");
  });

  it("填满时调 onComplete，只调一次", async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<Code length={4} onComplete={onComplete} />);
    await user.click(slots()[0]!);
    await user.keyboard("123");
    expect(onComplete).not.toHaveBeenCalled();
    await user.keyboard("4");
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith("1234");
  });

  it("受控：值由外面说了算", async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [value, setValue] = useState("12");
      return (
        <>
          <Code length={4} value={value} onValueChange={setValue} />
          <button type="button" onClick={() => setValue("")}>
            清空
          </button>
        </>
      );
    }
    render(<Controlled />);
    expect(values()).toEqual(["1", "2", "", ""]);
    await user.click(slots()[2]!);
    await user.keyboard("3");
    expect(values()).toEqual(["1", "2", "3", ""]);
    await user.click(screen.getByRole("button", { name: "清空" }));
    expect(values()).toEqual(["", "", "", ""]);
  });

  it("带 name 时拼起来的值随表单提交", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <form>
        <Code length={4} name="code" />
      </form>,
    );
    await user.click(slots()[0]!);
    await user.keyboard("2041");
    const data = new FormData(container.querySelector("form")!);
    expect(data.get("code")).toBe("2041");
  });

  it("mask 把字遮起来", () => {
    const { container } = render(<Code length={3} mask defaultValue="12" />);
    const inputs = [
      ...container.querySelectorAll<HTMLInputElement>(
        "input:not([aria-hidden])",
      ),
    ];
    expect(inputs.map((input) => input.type)).toEqual([
      "password",
      "password",
      "password",
    ]);
  });

  it("groupSize 每几格之间加一道短横，读屏不读", () => {
    const { container } = render(<Code length={6} groupSize={3} />);
    const separators = container.querySelectorAll("[data-separator]");
    expect(separators).toHaveLength(1);
    expect(separators[0]).toHaveAttribute("aria-hidden", "true");
    // 短横在第三格和第四格之间
    expect(separators[0]!.previousElementSibling).toBe(slots()[2]);
    expect(separators[0]!.nextElementSibling).toBe(slots()[3]);
  });

  it("groupSize 分成三组时有两道短横", () => {
    const { container } = render(<Code length={6} groupSize={2} />);
    expect(container.querySelectorAll("[data-separator]")).toHaveLength(2);
  });

  it("invalid：每格都标成不合规，边线变红", () => {
    render(<Code length={3} invalid />);
    for (const slot of slots()) {
      expect(slot).toHaveAttribute("aria-invalid", "true");
      expect(slot).toHaveClass("border-danger");
    }
    expect(screen.getByRole("group")).toHaveAttribute("data-invalid");
  });

  it("disabled：每格都不能填", () => {
    render(<Code length={3} disabled />);
    for (const slot of slots()) expect(slot).toBeDisabled();
  });

  it("readOnly：看得见、改不了", async () => {
    const user = userEvent.setup();
    render(<Code length={3} readOnly defaultValue="12" />);
    await user.click(slots()[2]!);
    await user.keyboard("3");
    expect(values()).toEqual(["1", "2", ""]);
    for (const slot of slots()) expect(slot).toHaveAttribute("readonly");
  });

  it("size 和 variant 写在分组上，className 也给它", () => {
    render(<Code size="lg" variant="outline" className="justify-center" />);
    const group = screen.getByRole("group");
    expect(group).toHaveAttribute("data-size", "lg");
    expect(group).toHaveAttribute("data-variant", "outline");
    expect(group).toHaveClass("justify-center");
    expect(slots()[0]).toHaveClass("h-14", "border");
  });

  it("第一格带 one-time-code，数字的那种唤出数字键盘", () => {
    render(<Code length={3} />);
    expect(slots()[0]).toHaveAttribute("autocomplete", "one-time-code");
    expect(slots()[0]).toHaveAttribute("inputmode", "numeric");
    expect(slots()[1]).toHaveAttribute("autocomplete", "off");
  });

  describe("放进 Field", () => {
    it("第一格的名称是字段的标签，整组也是；帮助文字关联给第一格", () => {
      render(
        <Field label="交接口令" help="六位数字，在交接单的右上角。">
          <OtpInput />
        </Field>,
      );
      expect(slots()[0]).toHaveAccessibleName("交接口令");
      expect(slots()[0]).toHaveAccessibleDescription(
        "六位数字，在交接单的右上角。",
      );
      expect(
        screen.getByRole("group", { name: "交接口令" }),
      ).toBeInTheDocument();
      expect(slots()[1]).toHaveAccessibleName("第 2 位，共 6 位");
    });

    it("点标签焦点落在第一格", async () => {
      const user = userEvent.setup();
      render(
        <Field label="交接口令">
          <OtpInput />
        </Field>,
      );
      await user.click(screen.getByText("交接口令"));
      expect(slots()[0]).toHaveFocus();
    });

    it("字段有错误时每格都是错误态，错误说明关联给第一格", () => {
      render(
        <Field label="交接口令" error="口令不对，再核对一遍交接单。">
          <OtpInput length={4} />
        </Field>,
      );
      for (const slot of slots()) {
        expect(slot).toHaveAttribute("aria-invalid", "true");
      }
      expect(slots()[0]).toHaveAccessibleDescription(
        "口令不对，再核对一遍交接单。",
      );
    });

    it("字段禁用、必填会交给它", () => {
      const { rerender } = render(
        <Field label="交接口令" disabled>
          <OtpInput length={3} />
        </Field>,
      );
      for (const slot of slots()) expect(slot).toBeDisabled();

      rerender(
        <Field label="交接口令" required>
          <OtpInput length={3} />
        </Field>,
      );
      expect(slots()[0]).toBeRequired();
    });
  });
});
