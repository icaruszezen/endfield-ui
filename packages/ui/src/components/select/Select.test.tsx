import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Field } from "../field/Field";
import { Select, SelectGroup, SelectItem, SelectSeparator } from "./Select";

const regions = [
  { value: "valley", label: "四号谷地" },
  { value: "ridge", label: "北岭" },
  { value: "delta", label: "三角洲", disabled: true },
];

describe("Select", () => {
  it("触发器是一个有名称的 combobox，没选时显示占位文字", () => {
    render(<Select items={regions} aria-label="地区" placeholder="请选择" />);
    const trigger = screen.getByRole("combobox", { name: "地区" });
    expect(trigger).toHaveTextContent("请选择");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("点开后选一项：触发器显示它的文字，并通知 onValueChange", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <Select
        items={regions}
        aria-label="地区"
        placeholder="请选择"
        onValueChange={onValueChange}
      />,
    );
    const trigger = screen.getByRole("combobox");
    await user.click(trigger);
    const listbox = await screen.findByRole("listbox");
    expect(within(listbox).getAllByRole("option")).toHaveLength(3);

    await user.click(within(listbox).getByRole("option", { name: "北岭" }));
    expect(onValueChange).toHaveBeenCalledWith("ridge");
    await waitFor(() =>
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument(),
    );
    expect(trigger).toHaveTextContent("北岭");
  });

  it("键盘：回车打开，方向键移动，回车选中，焦点回到触发器", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <Select
        items={regions}
        aria-label="地区"
        defaultValue="valley"
        onValueChange={onValueChange}
      />,
    );
    const trigger = screen.getByRole("combobox");
    await user.tab();
    expect(trigger).toHaveFocus();
    await user.keyboard("{Enter}");
    await screen.findByRole("listbox");
    await user.keyboard("{ArrowDown}{Enter}");
    expect(onValueChange).toHaveBeenCalledWith("ridge");
    await waitFor(() =>
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument(),
    );
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("已选项有标记，禁用项选不了", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <Select
        items={regions}
        aria-label="地区"
        defaultValue="valley"
        onValueChange={onValueChange}
      />,
    );
    await user.click(screen.getByRole("combobox"));
    const current = await screen.findByRole("option", { name: "四号谷地" });
    expect(current).toHaveAttribute("aria-selected", "true");
    expect(current).toHaveClass("bg-surface-muted", "font-medium");

    const disabled = screen.getByRole("option", { name: "三角洲" });
    expect(disabled).toHaveAttribute("aria-disabled", "true");
    await user.click(disabled);
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("受控的值", () => {
    const { rerender } = render(
      <Select items={regions} aria-label="地区" value="valley" />,
    );
    expect(screen.getByRole("combobox")).toHaveTextContent("四号谷地");
    rerender(<Select items={regions} aria-label="地区" value="ridge" />);
    expect(screen.getByRole("combobox")).toHaveTextContent("北岭");
  });

  it("带 name 时值随表单提交", () => {
    render(
      <form data-testid="form">
        <Select
          items={regions}
          aria-label="地区"
          name="region"
          defaultValue="ridge"
        />
      </form>,
    );
    const data = new FormData(screen.getByTestId<HTMLFormElement>("form"));
    expect(data.get("region")).toBe("ridge");
  });

  it("放进 Field：标签、帮助与错误说明自动关联", () => {
    render(
      <Field label="地区" help="决定默认的补给线" error="请选一个地区" required>
        <Select items={regions} placeholder="请选择" />
      </Field>,
    );
    const trigger = screen.getByRole("combobox", { name: "地区" });
    expect(trigger).toHaveAttribute("aria-invalid", "true");
    expect(trigger).toHaveAccessibleDescription(
      "请选一个地区 决定默认的补给线",
    );
    // 外框和输入框一样：错误态是红色的边线
    expect(trigger.parentElement).toHaveClass("border-danger");
    expect(trigger.parentElement).toHaveAttribute("data-invalid");
  });

  it("禁用", async () => {
    const user = userEvent.setup();
    render(<Select items={regions} aria-label="地区" disabled />);
    const trigger = screen.getByRole("combobox");
    expect(trigger).toBeDisabled();
    await user.click(trigger);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(trigger.parentElement).toHaveClass(
      "cursor-not-allowed",
      "text-ink-disabled",
    );
  });

  it("尺寸与两种外框和输入框相同", () => {
    const { rerender } = render(<Select items={regions} aria-label="地区" />);
    const box = () => screen.getByRole("combobox").parentElement!;
    expect(box()).toHaveClass("h-10", "border-b-2", "bg-surface-sunken");

    rerender(
      <Select items={regions} aria-label="地区" size="sm" variant="outline" />,
    );
    expect(box()).toHaveClass("h-8", "border", "bg-surface");
  });

  it("自定义面板内容：分组与分隔线", async () => {
    const user = userEvent.setup();
    render(
      <Select items={regions} aria-label="地区">
        <SelectGroup label="已勘探">
          <SelectItem value="valley">四号谷地</SelectItem>
          <SelectItem value="ridge">北岭</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup label="未开放">
          <SelectItem value="delta" disabled>
            三角洲
          </SelectItem>
        </SelectGroup>
      </Select>,
    );
    await user.click(screen.getByRole("combobox"));
    expect(
      await screen.findByRole("group", { name: "已勘探" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "未开放" })).toBeInTheDocument();
    expect(screen.getAllByRole("option")).toHaveLength(3);
  });

  it("strong 面板是一块固定的深色，当前项整行黄底", async () => {
    const user = userEvent.setup();
    render(
      <Select
        items={regions}
        aria-label="地区"
        defaultValue="valley"
        panelVariant="strong"
      />,
    );
    await user.click(screen.getByRole("combobox"));
    const current = await screen.findByRole("option", { name: "四号谷地" });
    expect(current).toHaveClass("bg-action", "text-on-action");
    expect(current.closest("[data-theme]")).toHaveAttribute(
      "data-theme",
      "dark",
    );
  });

  it("触发器在局部主题里时，面板带上同一个主题", async () => {
    const user = userEvent.setup();
    render(
      <div data-theme="dark">
        <Select items={regions} aria-label="地区" />
      </div>,
    );
    await user.click(screen.getByRole("combobox"));
    const listbox = await screen.findByRole("listbox");
    const scope = listbox.closest("[data-theme]");
    expect(scope).toHaveAttribute("data-theme", "dark");
    expect(scope).not.toContainElement(
      screen.getByRole("combobox", { hidden: true }),
    );
  });
  it("多选：值是数组，选了不关面板，选项报出选没选", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <Select
        multiple
        items={regions}
        aria-label="地区"
        placeholder="请选择"
        onValueChange={onValueChange}
      />,
    );
    const trigger = screen.getByRole("combobox");
    expect(trigger).toHaveTextContent("请选择");

    await user.click(trigger);
    const listbox = await screen.findByRole("listbox");
    expect(listbox).toHaveAttribute("aria-multiselectable", "true");

    await user.click(within(listbox).getByRole("option", { name: "北岭" }));
    expect(onValueChange).toHaveBeenLastCalledWith(["ridge"]);
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    await user.click(within(listbox).getByRole("option", { name: "四号谷地" }));
    expect(onValueChange.mock.lastCall?.[0]).toHaveLength(2);
    expect(
      within(listbox).getByRole("option", { name: "北岭" }),
    ).toHaveAttribute("aria-selected", "true");
    expect(
      within(listbox).getByRole("option", { name: "三角洲" }),
    ).toHaveAttribute("aria-selected", "false");

    // 再点一次是取消
    await user.click(within(listbox).getByRole("option", { name: "北岭" }));
    expect(onValueChange).toHaveBeenLastCalledWith(["valley"]);
  });

  it("多选：触发器把已选项按 items 的顺序连起来，两项以上带计数", () => {
    const { rerender } = render(
      <Select
        multiple
        items={regions}
        aria-label="地区"
        value={["ridge"]}
        placeholder="请选择"
      />,
    );
    const trigger = screen.getByRole("combobox");
    expect(trigger).toHaveTextContent("北岭");
    expect(trigger).not.toHaveTextContent("项");

    rerender(
      <Select
        multiple
        items={regions}
        aria-label="地区"
        value={["ridge", "valley"]}
      />,
    );
    expect(trigger).toHaveTextContent("四号谷地、北岭2 项");

    rerender(
      <Select
        multiple
        items={regions}
        aria-label="地区"
        value={[]}
        placeholder="请选择"
      />,
    );
    expect(trigger).toHaveTextContent("请选择");
  });

  it("多选：renderValue 自己画触发器里的内容", () => {
    render(
      <Select
        multiple
        items={regions}
        aria-label="地区"
        defaultValue={["valley", "ridge"]}
        renderValue={(selected) => `已选 ${selected.length} 个地区`}
      />,
    );
    expect(screen.getByRole("combobox")).toHaveTextContent("已选 2 个地区");
  });

  it("多选：选项行首是小方格，不用当前项的整行底色", async () => {
    const user = userEvent.setup();
    render(
      <Select
        multiple
        items={regions}
        aria-label="地区"
        defaultValue={["valley"]}
      />,
    );
    await user.click(screen.getByRole("combobox"));
    const selected = await screen.findByRole("option", { name: "四号谷地" });
    const other = screen.getByRole("option", { name: "北岭" });
    expect(selected.querySelector("[data-checked]")).toBeInTheDocument();
    expect(selected).not.toHaveClass("bg-surface-muted");
    expect(other.querySelector("[aria-hidden=true]")).toBeInTheDocument();
    expect(other.querySelector("[data-checked]")).not.toBeInTheDocument();
  });

  it("多选：带 name 时每个选中的值各提交一份", () => {
    render(
      <form data-testid="form">
        <Select
          multiple
          items={regions}
          aria-label="地区"
          name="region"
          defaultValue={["valley", "ridge"]}
        />
      </form>,
    );
    const data = new FormData(screen.getByTestId<HTMLFormElement>("form"));
    expect(data.getAll("region")).toEqual(["valley", "ridge"]);
  });
});
