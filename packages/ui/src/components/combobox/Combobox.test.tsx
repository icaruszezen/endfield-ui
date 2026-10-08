import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { Field } from "../field/Field";
import { Combobox } from "./Combobox";

const stations = [
  { value: "n07", label: "北区七号站", keywords: ["N-07"] },
  { value: "n12", label: "北区十二号站", keywords: ["N-12"] },
  { value: "s03", label: "南岸三号站", keywords: ["S-03"] },
  { value: "e01", label: "东线一号站", keywords: ["E-01"], disabled: true },
];

const grouped = [
  { label: "北区", items: stations.slice(0, 2) },
  { label: "其他", items: stations.slice(2) },
];

const options = () =>
  within(screen.getByRole("listbox"))
    .getAllByRole("option")
    .map((option) => option.textContent);

describe("Combobox", () => {
  it("是一个有名称的 combobox 输入框，没选时显示提示", () => {
    render(
      <Combobox items={stations} aria-label="站点" placeholder="输入站名" />,
    );
    const input = screen.getByRole("combobox", { name: "站点" });
    expect(input.tagName).toBe("INPUT");
    expect(input).toHaveAttribute("placeholder", "输入站名");
    expect(input).toHaveAttribute("aria-expanded", "false");
  });

  it("打字即筛选：匹配文字，也匹配别名，不分大小写", async () => {
    const user = userEvent.setup();
    render(<Combobox items={stations} aria-label="站点" />);
    const input = screen.getByRole("combobox");

    await user.type(input, "北区");
    await screen.findByRole("listbox");
    expect(options()).toEqual(["北区七号站", "北区十二号站"]);

    await user.clear(input);
    await user.type(input, "s-03");
    await waitFor(() => expect(options()).toEqual(["南岸三号站"]));
  });

  it("一个都没匹配上时，面板里是一句说明", async () => {
    const user = userEvent.setup();
    render(
      <Combobox items={stations} aria-label="站点" emptyText="查无此站" />,
    );
    await user.type(screen.getByRole("combobox"), "西");
    expect(await screen.findByText("查无此站")).toBeVisible();
    expect(screen.queryAllByRole("option")).toHaveLength(0);
  });

  it("点一项：输入框显示它的文字，面板关上，并通知 onValueChange", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <Combobox
        items={stations}
        aria-label="站点"
        onValueChange={onValueChange}
      />,
    );
    const input = screen.getByRole("combobox");
    await user.click(input);
    await user.click(await screen.findByRole("option", { name: "南岸三号站" }));

    expect(onValueChange).toHaveBeenCalledWith("s03");
    expect(input).toHaveValue("南岸三号站");
    await waitFor(() =>
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument(),
    );
  });

  it("键盘：打字、方向键移动、回车选中；禁用的选项选不了", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <Combobox
        items={stations}
        aria-label="站点"
        onValueChange={onValueChange}
      />,
    );
    await user.tab();
    await user.keyboard("北{ArrowDown}{ArrowDown}{Enter}");
    expect(onValueChange).toHaveBeenCalledWith("n12");
    expect(screen.getByRole("combobox")).toHaveValue("北区十二号站");

    onValueChange.mockClear();
    await user.clear(screen.getByRole("combobox"));
    await user.keyboard("东");
    const option = await screen.findByRole("option", { name: "东线一号站" });
    expect(option).toHaveAttribute("aria-disabled", "true");
    await user.click(option);
    expect(onValueChange).not.toHaveBeenCalledWith("e01");
  });

  it("有值时出现清除钮：点了清空，通知 null", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <Combobox
        items={stations}
        aria-label="站点"
        defaultValue="n07"
        onValueChange={onValueChange}
      />,
    );
    const input = screen.getByRole("combobox");
    expect(input).toHaveValue("北区七号站");

    await user.click(screen.getByRole("button", { name: "清除" }));
    expect(onValueChange).toHaveBeenCalledWith(null);
    expect(input).toHaveValue("");
    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: "清除" }),
      ).not.toBeInTheDocument(),
    );
  });

  it("受控：值由外面决定", async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [value, setValue] = useState<string | null>("s03");
      return (
        <>
          <Combobox
            items={stations}
            aria-label="站点"
            value={value}
            onValueChange={setValue}
          />
          <button type="button" onClick={() => setValue("n12")}>
            换成十二号站
          </button>
          <output>{String(value)}</output>
        </>
      );
    }
    render(<Controlled />);
    const input = screen.getByRole("combobox");
    expect(input).toHaveValue("南岸三号站");

    await user.click(screen.getByRole("button", { name: "换成十二号站" }));
    await waitFor(() => expect(input).toHaveValue("北区十二号站"));

    await user.click(screen.getByRole("button", { name: "清除" }));
    expect(screen.getByRole("status")).toHaveTextContent("null");
  });

  it("带 name 时选中的值随表单提交", () => {
    render(
      <form data-testid="form">
        <Combobox
          items={stations}
          aria-label="站点"
          name="station"
          defaultValue="n12"
        />
      </form>,
    );
    const data = new FormData(screen.getByTestId<HTMLFormElement>("form"));
    expect(data.get("station")).toBe("n12");
  });

  it("放进 Field：标签、帮助文字和错误态都关联上", () => {
    render(
      <Field label="常驻站点" help="可以输入编号。" error="这个站点已经停用。">
        <Combobox items={stations} />
      </Field>,
    );
    const input = screen.getByRole("combobox", { name: "常驻站点" });
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription(/这个站点已经停用/);
  });

  it("禁用时不能输入，也打不开", async () => {
    const user = userEvent.setup();
    render(<Combobox items={stations} aria-label="站点" disabled />);
    const input = screen.getByRole("combobox");
    expect(input).toBeDisabled();
    await user.click(input);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("分组：小标题在面板里，检索时空了的组不显示", async () => {
    const user = userEvent.setup();
    render(<Combobox items={grouped} aria-label="站点" />);
    const input = screen.getByRole("combobox");
    await user.click(input);
    const listbox = await screen.findByRole("listbox");
    expect(within(listbox).getAllByRole("group")).toHaveLength(2);
    expect(within(listbox).getByText("北区")).toBeInTheDocument();

    await user.type(input, "南岸");
    await waitFor(() =>
      expect(within(listbox).getAllByRole("group")).toHaveLength(1),
    );
    expect(options()).toEqual(["南岸三号站"]);
  });

  it("strong 面板是固定的深色", async () => {
    const user = userEvent.setup();
    render(
      <Combobox items={stations} aria-label="站点" panelVariant="strong" />,
    );
    await user.click(screen.getByRole("combobox"));
    const listbox = await screen.findByRole("listbox");
    expect(listbox.closest("[data-theme]")).toHaveAttribute(
      "data-theme",
      "dark",
    );
  });

  describe("多选", () => {
    it("选了不关面板，已选项在框里排成小块，值是数组", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(
        <Combobox
          multiple
          items={stations}
          aria-label="站点"
          placeholder="输入站名"
          onValueChange={onValueChange}
        />,
      );
      const input = screen.getByRole("combobox");
      await user.click(input);
      await user.click(
        await screen.findByRole("option", { name: "北区七号站" }),
      );
      expect(onValueChange).toHaveBeenLastCalledWith(["n07"]);
      expect(screen.getByRole("listbox")).toBeInTheDocument();

      await user.click(screen.getByRole("option", { name: "南岸三号站" }));
      expect(onValueChange).toHaveBeenLastCalledWith(["n07", "s03"]);
      expect(
        screen.getByRole("button", { name: "移除北区七号站" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "移除南岸三号站" }),
      ).toBeInTheDocument();
      // 已经有小块了，提示不再显示
      expect(input).not.toHaveAttribute("placeholder");
      expect(
        screen.getByRole("option", { name: "北区七号站" }),
      ).toHaveAttribute("aria-selected", "true");
    });

    it("点小块上的叉移除这一项；输入框空着时退格删掉最后一项", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(
        <Combobox
          multiple
          items={stations}
          aria-label="站点"
          defaultValue={["n07", "n12", "s03"]}
          onValueChange={onValueChange}
        />,
      );
      await user.click(
        screen.getByRole("button", { name: "移除北区十二号站" }),
      );
      expect(onValueChange).toHaveBeenLastCalledWith(["n07", "s03"]);

      await user.click(screen.getByRole("combobox"));
      await user.keyboard("{Backspace}");
      expect(onValueChange).toHaveBeenLastCalledWith(["n07"]);
    });

    it("带 name 时每个选中的值各提交一份", () => {
      render(
        <form data-testid="form">
          <Combobox
            multiple
            items={stations}
            aria-label="站点"
            name="stations"
            defaultValue={["n07", "s03"]}
          />
        </form>,
      );
      const data = new FormData(screen.getByTestId<HTMLFormElement>("form"));
      expect(data.getAll("stations")).toEqual(["n07", "s03"]);
    });
  });
});
