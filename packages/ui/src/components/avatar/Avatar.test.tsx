import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Avatar, initialsOf } from "./Avatar";
import { AvatarSwitcher, AvatarSwitcherItem } from "./AvatarSwitcher";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("initialsOf", () => {
  it("中文名取第一个字，拉丁字母的名字取前两个词的首字母", () => {
    expect(initialsOf("陈知远")).toBe("陈");
    expect(initialsOf("  林 澈 ")).toBe("林");
    expect(initialsOf("mira kessel")).toBe("MK");
    expect(initialsOf("Odile")).toBe("O");
    expect(initialsOf("")).toBe("");
  });
});

describe("Avatar", () => {
  it("没有图时是一张以名字命名的图，里面是名字的首字", () => {
    render(<Avatar name="陈知远" />);
    const avatar = screen.getByRole("img", { name: "陈知远" });
    expect(avatar).toHaveTextContent("陈");
    expect(avatar).toHaveClass("rounded-full", "size-10");
  });

  it("alt 传空串：纯装饰，对读屏隐藏", () => {
    render(<Avatar name="陈知远" alt="" data-testid="avatar" />);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByTestId("avatar")).toHaveAttribute("aria-hidden", "true");
  });

  it("alt 可以和 name 不一样", () => {
    render(<Avatar name="陈知远" alt="值班调度员陈知远" />);
    expect(
      screen.getByRole("img", { name: "值班调度员陈知远" }),
    ).toHaveTextContent("陈");
  });

  it("四档尺寸", () => {
    const { rerender } = render(<Avatar name="林澈" size="sm" />);
    const avatar = () => screen.getByRole("img");
    expect(avatar()).toHaveClass("size-8");
    rerender(<Avatar name="林澈" size="lg" />);
    expect(avatar()).toHaveClass("size-14");
    rerender(<Avatar name="林澈" size="xl" />);
    expect(avatar()).toHaveClass("size-20");
  });

  it("selected：带选中环", () => {
    const { rerender } = render(<Avatar name="林澈" />);
    expect(screen.getByRole("img")).not.toHaveAttribute("data-selected");
    rerender(<Avatar name="林澈" selected />);
    expect(screen.getByRole("img")).toHaveAttribute("data-selected");
    expect(screen.getByRole("img").className).toContain("var(--ef-action)");
  });

  it("子元素代替首字", () => {
    render(
      <Avatar name="访客">
        <svg data-testid="icon" />
      </Avatar>,
    );
    const avatar = screen.getByRole("img", { name: "访客" });
    expect(avatar).toContainElement(screen.getByTestId("icon"));
    expect(avatar).not.toHaveTextContent("访");
  });

  it("图加载好了才换上去；没加载出来时一直是首字", async () => {
    // jsdom 不会真的去取图：假装它加载成功
    vi.stubGlobal(
      "Image",
      class {
        onload: (() => void) | null = null;
        set src(_: string) {
          queueMicrotask(() => this.onload?.());
        }
      },
    );
    render(<Avatar name="陈知远" src="/portrait.svg" />);
    const avatar = screen.getByRole("img", { name: "陈知远" });
    const image = await vi.waitFor(() => {
      const found = avatar.querySelector("img");
      expect(found).not.toBeNull();
      return found!;
    });
    expect(image).toHaveAttribute("src", "/portrait.svg");
    // 名称在外面那一层上，里面的图不再重复
    expect(image).toHaveAttribute("alt", "");
  });
});

const people = [
  { value: "chen", label: "陈知远" },
  { value: "lin", label: "林澈" },
  { value: "mira", label: "Mira Kessel" },
  { value: "odile", label: "Odile" },
];

function Switcher(
  props: Partial<React.ComponentProps<typeof AvatarSwitcher>> & {
    disabledValue?: string;
  },
) {
  const { disabledValue, ...rest } = props;
  return (
    <AvatarSwitcher aria-label="值班人员" {...rest}>
      {people.map((person) => (
        <AvatarSwitcherItem
          key={person.value}
          value={person.value}
          label={person.label}
          disabled={person.value === disabledValue}
        />
      ))}
    </AvatarSwitcher>
  );
}

const radio = (name: string) => screen.getByRole("radio", { name });

describe("AvatarSwitcher", () => {
  it("是一个有名称的单选组，每个头像是一个以名字命名的单选按钮", () => {
    render(<Switcher defaultValue="lin" />);
    const group = screen.getByRole("radiogroup", { name: "值班人员" });
    expect(group).toHaveAttribute("aria-orientation", "vertical");
    expect(screen.getAllByRole("radio")).toHaveLength(4);
    expect(radio("林澈")).toBeChecked();
    expect(radio("陈知远")).not.toBeChecked();
    // 头像本身是装饰：名字已经在单选按钮上了
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("点头像选中它，并通知 onValueChange", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Switcher defaultValue="lin" onValueChange={onValueChange} />);
    await user.click(radio("Odile"));
    expect(onValueChange).toHaveBeenLastCalledWith("odile");
    expect(radio("Odile")).toBeChecked();
    expect(radio("林澈")).not.toBeChecked();
  });

  it("翻页钮选上一个 / 下一个，到头时禁用；不占 Tab 顺序", async () => {
    const user = userEvent.setup();
    render(<Switcher defaultValue="chen" />);
    const previous = screen.getByRole("button", { name: "上一个" });
    const next = screen.getByRole("button", { name: "下一个" });
    expect(previous).toBeDisabled();
    expect(next).toBeEnabled();
    expect(next).toHaveAttribute("tabindex", "-1");

    await user.click(next);
    expect(radio("林澈")).toBeChecked();
    expect(previous).toBeEnabled();
    await user.click(next);
    await user.click(next);
    expect(radio("Odile")).toBeChecked();
    expect(next).toBeDisabled();
    await user.click(previous);
    expect(radio("Mira Kessel")).toBeChecked();
  });

  it("loop：到头之后绕回另一头", async () => {
    const user = userEvent.setup();
    render(<Switcher defaultValue="odile" loop />);
    const next = screen.getByRole("button", { name: "下一个" });
    expect(next).toBeEnabled();
    await user.click(next);
    expect(radio("陈知远")).toBeChecked();
    await user.click(screen.getByRole("button", { name: "上一个" }));
    expect(radio("Odile")).toBeChecked();
  });

  it("翻页钮跳过禁用的头像", async () => {
    const user = userEvent.setup();
    render(<Switcher defaultValue="chen" disabledValue="lin" />);
    expect(radio("林澈")).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "下一个" }));
    expect(radio("Mira Kessel")).toBeChecked();
  });

  it("受控：选中谁由外面决定", async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [value, setValue] = useState("lin");
      return (
        <>
          <Switcher value={value} onValueChange={setValue} />
          <output>{value}</output>
        </>
      );
    }
    render(<Controlled />);
    await user.click(screen.getByRole("button", { name: "下一个" }));
    expect(screen.getByRole("status")).toHaveTextContent("mira");
    expect(radio("Mira Kessel")).toBeChecked();
  });

  it("带 name 时选中的值随表单提交", () => {
    render(
      <form data-testid="form">
        <Switcher name="operator" defaultValue="mira" />
      </form>,
    );
    expect(
      new FormData(screen.getByTestId<HTMLFormElement>("form")).get("operator"),
    ).toBe("mira");
  });

  it("横排：方向写在单选组上", () => {
    render(<Switcher orientation="horizontal" defaultValue="lin" />);
    expect(screen.getByRole("radiogroup")).toHaveAttribute(
      "aria-orientation",
      "horizontal",
    );
  });

  it("选中的头像带选中环，其余的退后一档", () => {
    render(<Switcher defaultValue="lin" />);
    const avatarOf = (name: string) =>
      radio(name).parentElement!.querySelector("[data-size]")!;
    expect(avatarOf("林澈")).toHaveAttribute("data-selected");
    expect(avatarOf("林澈")).not.toHaveClass("opacity-60");
    expect(avatarOf("陈知远")).not.toHaveAttribute("data-selected");
    expect(avatarOf("陈知远")).toHaveClass("opacity-60");
  });
});
