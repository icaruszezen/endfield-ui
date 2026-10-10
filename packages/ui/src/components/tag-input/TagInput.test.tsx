import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Field } from "../field/Field";
import { TagInput, type TagInputProps } from "./TagInput";

const input = () => screen.getByRole("textbox");
const tags = () =>
  [...document.querySelectorAll("[data-tag]")].map(
    (chip) => chip.textContent ?? "",
  );

function Example(props: Partial<TagInputProps>) {
  return <TagInput aria-label="站点标签" {...props} />;
}

afterEach(() => {
  vi.useRealTimers();
});

describe("TagInput", () => {
  it("新加的小块淡入；一开始就有的不动，粘贴的几个一起，删了再加回来的也算", async () => {
    const user = userEvent.setup();
    render(<TagInput aria-label="标签" defaultValue={["北岭", "管廊"]} />);
    const chip = (name: string) => screen.getByText(name).closest("[data-tag]");
    const fading = (name: string) =>
      chip(name)!.classList.contains("animate-fade-in");
    const input = screen.getByRole("textbox", { name: "标签" });
    expect([fading("北岭"), fading("管廊")]).toEqual([false, false]);

    await user.type(input, "泵站{Enter}");
    expect(chip("泵站")).toHaveClass(
      "animate-fade-in",
      "[animation-duration:var(--duration-fast)]",
    );
    // 别的没有跟着重播
    expect([fading("北岭"), fading("管廊")]).toEqual([false, false]);

    await user.click(input);
    await user.paste("闸门,水塔");
    expect([fading("闸门"), fading("水塔"), fading("泵站")]).toEqual([
      true,
      true,
      true,
    ]);

    await user.click(screen.getByRole("button", { name: "移除北岭" }));
    await user.type(input, "北岭{Enter}");
    expect(fading("北岭")).toBe(true);
    expect(fading("管廊")).toBe(false);
  });

  it("回车加一个：前后的空白去掉，框清空；空的不加", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Example onValueChange={onValueChange} />);

    await user.type(input(), "  北岭  {Enter}");
    expect(tags()).toEqual(["北岭"]);
    expect(onValueChange).toHaveBeenLastCalledWith(["北岭"]);
    expect(input()).toHaveValue("");

    await user.type(input(), "   {Enter}");
    expect(tags()).toEqual(["北岭"]);
    expect(onValueChange).toHaveBeenCalledTimes(1);
  });

  it("打出分隔符就提交：默认是半角和全角的逗号", async () => {
    const user = userEvent.setup();
    render(<Example />);
    await user.type(input(), "北岭,管廊，");
    expect(tags()).toEqual(["北岭", "管廊"]);
    expect(input()).toHaveValue("");
  });

  it("separators 可以换：换成空格之后逗号是普通的字", async () => {
    const user = userEvent.setup();
    render(<Example separators={[" "]} />);
    await user.type(input(), "a,b c ");
    expect(tags()).toEqual(["a,b", "c"]);
  });

  it("粘贴一串：按分隔符和换行拆开，接在已经打的字后面", async () => {
    const user = userEvent.setup();
    render(<Example />);
    await user.type(input(), "北");
    await user.paste("岭,管廊\n二号线\r\n,  ");
    expect(tags()).toEqual(["北岭", "管廊", "二号线"]);
    expect(input()).toHaveValue("");
  });

  it("粘贴的字里没有分隔符：就是普通的粘贴", async () => {
    const user = userEvent.setup();
    render(<Example />);
    input().focus();
    await user.paste("北岭");
    expect(tags()).toEqual([]);
    expect(input()).toHaveValue("北岭");
  });

  it("离开输入框时把没提交的字也加进去；commitOnBlur 关掉就不加", async () => {
    const user = userEvent.setup();
    const { unmount } = render(
      <>
        <Example />
        <button type="button">别处</button>
      </>,
    );
    await user.type(input(), "北岭");
    await user.tab();
    expect(tags()).toEqual(["北岭"]);
    unmount();

    render(
      <>
        <Example commitOnBlur={false} />
        <button type="button">别处</button>
      </>,
    );
    await user.type(input(), "北岭");
    await user.tab();
    expect(tags()).toEqual([]);
    expect(input()).toHaveValue("北岭");
  });

  it("已经有了：不加，字留着，那个小块闪一下，onReject 拿到原因", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const onReject = vi.fn();
    render(<Example defaultValue={["北岭", "管廊"]} onReject={onReject} />);

    await user.type(input(), "北岭{Enter}");
    expect(tags()).toEqual(["北岭", "管廊"]);
    expect(input()).toHaveValue("北岭");
    expect(onReject).toHaveBeenLastCalledWith("北岭", "duplicate", undefined);

    const [first, second] = document.querySelectorAll("[data-tag]");
    expect(first).toHaveAttribute("data-flash");
    expect(second).not.toHaveAttribute("data-flash");
    expect(screen.getByText("已经有北岭了")).toHaveClass("sr-only");

    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(first).not.toHaveAttribute("data-flash");
  });

  it("到了上限：不加，计数是满的", async () => {
    const user = userEvent.setup();
    const onReject = vi.fn();
    render(<Example defaultValue={["北岭"]} max={2} onReject={onReject} />);
    const count = () => document.querySelector("[data-count]")!;
    expect(count()).toHaveTextContent("1 / 2");
    expect(count()).toHaveClass("text-ink-secondary");

    await user.type(input(), "管廊{Enter}");
    expect(count()).toHaveTextContent("2 / 2");
    expect(count()).toHaveClass("text-ink");

    await user.type(input(), "二号线{Enter}");
    expect(tags()).toEqual(["北岭", "管廊"]);
    expect(input()).toHaveValue("二号线");
    expect(onReject).toHaveBeenLastCalledWith("二号线", "max", undefined);
    expect(screen.getByText("最多 2 个")).toHaveClass("sr-only");
  });

  it("没传 max 就没有计数", () => {
    render(<Example defaultValue={["北岭"]} />);
    expect(document.querySelector("[data-count]")).toBeNull();
  });

  it("validate 返回一句话就是不让加：这句话交给 onReject", async () => {
    const user = userEvent.setup();
    const onReject = vi.fn();
    const validate = vi.fn((text: string) =>
      text.length > 4 ? "标签最多四个字" : null,
    );
    render(
      <Example
        defaultValue={["北岭"]}
        validate={validate}
        onReject={onReject}
      />,
    );

    await user.type(input(), "一二三四五{Enter}");
    expect(tags()).toEqual(["北岭"]);
    expect(input()).toHaveValue("一二三四五");
    expect(validate).toHaveBeenLastCalledWith("一二三四五", ["北岭"]);
    expect(onReject).toHaveBeenLastCalledWith(
      "一二三四五",
      "invalid",
      "标签最多四个字",
    );

    await user.clear(input());
    await user.type(input(), "管廊{Enter}");
    expect(tags()).toEqual(["北岭", "管廊"]);
  });

  it("一次粘贴好几个、其中有没加成的：加得进的照加，框里不留字", async () => {
    const user = userEvent.setup();
    const onReject = vi.fn();
    render(<Example defaultValue={["北岭"]} max={3} onReject={onReject} />);
    input().focus();
    await user.paste("北岭,管廊,二号线,三号线");
    expect(tags()).toEqual(["北岭", "管廊", "二号线"]);
    expect(input()).toHaveValue("");
    expect(onReject.mock.calls).toEqual([
      ["北岭", "duplicate", undefined],
      ["三号线", "max", undefined],
    ]);
  });

  it("输入法正在组字时的回车和逗号都不算提交，组完了才算", () => {
    render(<Example />);
    const field = input();
    fireEvent.compositionStart(field);
    // 组字途中框里的字在变，里面可以有逗号
    fireEvent.input(field, {
      target: { value: "bei,ling" },
      isComposing: true,
    });
    expect(tags()).toEqual([]);
    expect(field).toHaveValue("bei,ling");
    fireEvent.keyDown(field, { key: "Enter", keyCode: 229, isComposing: true });
    expect(tags()).toEqual([]);

    // 选完字：框里是"北岭，"
    fireEvent.input(field, { target: { value: "北岭，" }, isComposing: true });
    expect(tags()).toEqual([]);
    fireEvent.compositionEnd(field);
    expect(tags()).toEqual(["北岭"]);
    expect(field).toHaveValue("");
  });

  it("框里空着时 Backspace 删最后一个；有字时只是删字", async () => {
    const user = userEvent.setup();
    render(<Example defaultValue={["北岭", "管廊"]} />);
    await user.type(input(), "二{Backspace}");
    expect(tags()).toEqual(["北岭", "管廊"]);
    await user.keyboard("{Backspace}");
    expect(tags()).toEqual(["北岭"]);
    expect(input()).toHaveFocus();
    expect(screen.getByText("已移除管廊")).toHaveClass("sr-only");
  });

  it("← 走到小块上，在小块之间走，→ 走回框里；Tab 不停在小块上", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Example defaultValue={["北岭", "管廊"]} />
        <button type="button">别处</button>
      </>,
    );
    const remove = (name: string) =>
      screen.getByRole("button", { name: `移除${name}` });
    expect(remove("北岭")).toHaveAttribute("tabindex", "-1");

    await user.click(input());
    await user.keyboard("{ArrowLeft}");
    expect(remove("管廊")).toHaveFocus();
    await user.keyboard("{ArrowLeft}");
    expect(remove("北岭")).toHaveFocus();
    await user.keyboard("{ArrowLeft}");
    expect(remove("北岭")).toHaveFocus();
    await user.keyboard("{ArrowRight}{ArrowRight}");
    expect(input()).toHaveFocus();

    await user.tab();
    expect(screen.getByRole("button", { name: "别处" })).toHaveFocus();
  });

  it("框里有字、光标不在开头时，← 只是移光标", async () => {
    const user = userEvent.setup();
    render(<Example defaultValue={["北岭"]} />);
    await user.type(input(), "ab{ArrowLeft}");
    expect(input()).toHaveFocus();
    await user.keyboard("{ArrowLeft}");
    expect(input()).toHaveFocus();
    // 到了开头再按才走出去
    await user.keyboard("{ArrowLeft}");
    expect(screen.getByRole("button", { name: "移除北岭" })).toHaveFocus();
  });

  it("在小块上 Backspace / Delete 删掉它：焦点落到旁边那个，一个不剩就回框里", async () => {
    const user = userEvent.setup();
    render(<Example defaultValue={["北岭", "管廊", "二号线"]} />);
    const remove = (name: string) =>
      screen.getByRole("button", { name: `移除${name}` });

    await user.click(input());
    await user.keyboard("{ArrowLeft}{ArrowLeft}");
    expect(remove("管廊")).toHaveFocus();
    // 删中间的：落到原来的下一个上
    await user.keyboard("{Delete}");
    expect(tags()).toEqual(["北岭", "二号线"]);
    expect(remove("二号线")).toHaveFocus();
    // 删最后一个：落到前一个上
    await user.keyboard("{Backspace}");
    expect(tags()).toEqual(["北岭"]);
    expect(remove("北岭")).toHaveFocus();
    // 回车也是删
    await user.keyboard("{Enter}");
    expect(tags()).toEqual([]);
    expect(input()).toHaveFocus();
  });

  it("鼠标点小块上的叉：删掉，焦点回到框里", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <Example defaultValue={["北岭", "管廊"]} onValueChange={onValueChange} />,
    );
    await user.click(screen.getByRole("button", { name: "移除北岭" }));
    expect(onValueChange).toHaveBeenLastCalledWith(["管廊"]);
    expect(input()).toHaveFocus();
  });

  it("受控：只报告，显示的是传进来的值", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    function Controlled() {
      const [value, setValue] = useState(["北岭"]);
      return (
        <>
          <Example
            value={value}
            onValueChange={(next) => {
              onValueChange(next);
              // 只收两个字的
              setValue(next.filter((tag) => tag.length === 2));
            }}
          />
        </>
      );
    }
    render(<Controlled />);
    await user.type(input(), "管廊{Enter}二号线{Enter}");
    expect(onValueChange.mock.calls).toEqual([
      [["北岭", "管廊"]],
      [["北岭", "管廊", "二号线"]],
    ]);
    expect(tags()).toEqual(["北岭", "管廊"]);
  });

  it("带 name 时每个标签一个同名的隐藏字段，随表单提交", async () => {
    const user = userEvent.setup();
    render(
      <form data-testid="form">
        <Example name="tags" defaultValue={["北岭"]} />
      </form>,
    );
    await user.type(input(), "管廊,");
    const data = new FormData(
      screen.getByTestId("form") as unknown as HTMLFormElement,
    );
    expect(data.getAll("tags")).toEqual(["北岭", "管廊"]);
  });

  it("框里有字时回车不提交表单；空着时回车留给表单", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((event: { preventDefault: () => void }) =>
      event.preventDefault(),
    );
    render(
      <form onSubmit={onSubmit}>
        <Example />
        <button type="submit">保存</button>
      </form>,
    );
    await user.type(input(), "北岭{Enter}");
    expect(onSubmit).not.toHaveBeenCalled();
    await user.keyboard("{Enter}");
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("读屏：输入框的补充说明里有现在的标签；加了有一句播报", async () => {
    const user = userEvent.setup();
    render(<Example defaultValue={["北岭"]} />);
    expect(input()).toHaveAccessibleDescription("已有 1 个标签：北岭");
    await user.type(input(), "管廊{Enter}");
    expect(input()).toHaveAccessibleDescription("已有 2 个标签：北岭、管廊");
    expect(screen.getByText("已添加管廊")).toHaveAttribute(
      "aria-live",
      "polite",
    );
  });

  it("放进 Field：标签、帮助、错误、必填、禁用都跟着字段", () => {
    const { rerender } = render(
      <Field label="站点标签" help="最多八个。" required>
        <TagInput />
      </Field>,
    );
    const field = screen.getByRole("textbox", { name: "站点标签" });
    expect(field).toBeRequired();
    expect(field).toHaveAccessibleDescription("还没有标签 最多八个。");

    rerender(
      <Field label="站点标签" error="至少填一个。" disabled>
        <TagInput defaultValue={["北岭"]} />
      </Field>,
    );
    expect(field).toBeDisabled();
    expect(field).toBeInvalid();
    // 禁用优先：边线是禁用的那一档，不是错误的红
    expect(field.closest("[data-invalid]")).toHaveClass("border-line");

    rerender(
      <Field label="站点标签" error="至少填一个。">
        <TagInput defaultValue={["北岭"]} />
      </Field>,
    );
    expect(field.closest("[data-invalid]")).toHaveClass("border-danger");
    // 错误说明接在"现在有哪些标签"后面（还是同一个控件，defaultValue 只在一开始算数）
    expect(field).toHaveAccessibleDescription("还没有标签 至少填一个。");
  });

  it("必填：已经有标签了就不算没填", () => {
    const { rerender } = render(<Example required />);
    expect(input()).toBeRequired();
    expect(input()).toHaveAttribute("aria-required", "true");
    // 原生的 required 拿掉（不然框里空着就过不了浏览器的校验），读屏听到的"必填"还在
    rerender(<Example required value={["北岭"]} />);
    expect(input()).not.toHaveAttribute("required");
    expect(input()).toHaveAttribute("aria-required", "true");
  });

  it("有标签时不显示提示文字", () => {
    const { rerender } = render(<Example placeholder="输入后按回车" />);
    expect(input()).toHaveAttribute("placeholder", "输入后按回车");
    rerender(<Example placeholder="输入后按回车" value={["北岭"]} />);
    expect(input()).not.toHaveAttribute("placeholder");
  });

  it("禁用和只读：小块上没有叉，加不了也删不了", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { rerender } = render(
      <Example
        disabled
        defaultValue={["北岭"]}
        onValueChange={onValueChange}
      />,
    );
    expect(input()).toBeDisabled();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();

    rerender(
      <Example
        readOnly
        defaultValue={["北岭"]}
        onValueChange={onValueChange}
      />,
    );
    expect(input()).toHaveAttribute("readonly");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    await user.click(input());
    await user.keyboard("{Backspace}");
    expect(tags()).toEqual(["北岭"]);
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("外框是输入框的外框：两种变体、三档最小高度；className 给外框，ref 给 input", () => {
    const ref = { current: null as HTMLInputElement | null };
    const { rerender } = render(<Example ref={ref} className="max-w-sm" />);
    const box = () => input().closest("[data-variant]")!;
    expect(ref.current).toBe(input());
    expect(box()).toHaveClass("max-w-sm", "bg-surface-sunken", "min-h-10");
    rerender(<Example variant="outline" size="sm" />);
    expect(box()).toHaveClass("border", "bg-surface", "min-h-8");
    rerender(<Example size="lg" />);
    expect(box()).toHaveClass("min-h-14");
  });

  it("removeLabel 和 labels 可以换", async () => {
    const user = userEvent.setup();
    render(
      <Example
        defaultValue={["north"]}
        removeLabel={(tag) => `Remove ${tag}`}
        labels={{ added: (tag) => `Added ${tag}` }}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Remove north" }),
    ).toBeInTheDocument();
    await user.type(input(), "south{Enter}");
    expect(screen.getByText("Added south")).toBeInTheDocument();
  });
});
