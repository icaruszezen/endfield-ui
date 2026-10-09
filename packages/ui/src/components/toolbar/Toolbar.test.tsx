import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DropdownMenu, DropdownMenuItem } from "../dropdown-menu/DropdownMenu";
import { Tooltip } from "../tooltip/Tooltip";
import {
  Toolbar,
  ToolbarButton,
  ToolbarGroup,
  ToolbarSeparator,
  ToolbarToggle,
  ToolbarToggleGroup,
  type ToolbarProps,
  type ToolbarToggleGroupProps,
} from "./Toolbar";

const Dot = () => <svg data-testid="dot" aria-hidden="true" />;

function Tools({
  group,
  onPrint,
  ...props
}: Partial<ToolbarProps> & {
  group?: Partial<ToolbarToggleGroupProps>;
  onPrint?: () => void;
}) {
  return (
    <Toolbar aria-label="表格工具" {...props}>
      <ToolbarToggleGroup aria-label="行高" defaultValue={["md"]} {...group}>
        <ToolbarToggle value="md">标准</ToolbarToggle>
        <ToolbarToggle value="sm">紧凑</ToolbarToggle>
      </ToolbarToggleGroup>
      <ToolbarSeparator />
      <ToolbarToggle icon={<Dot />} aria-label="每五行加重" />
      <ToolbarButton icon={<Dot />} onClick={onPrint}>
        打印
      </ToolbarButton>
      <ToolbarButton disabled>导出</ToolbarButton>
    </Toolbar>
  );
}

describe("Toolbar", () => {
  it("是一个有名称的工具栏；开关组是里面有名称的一组；分隔是 separator", () => {
    render(<Tools />);
    const toolbar = screen.getByRole("toolbar", { name: "表格工具" });
    expect(toolbar).toHaveAttribute("aria-orientation", "horizontal");
    const group = within(toolbar).getByRole("group", { name: "行高" });
    expect(within(group).getAllByRole("button")).toHaveLength(2);
    expect(within(toolbar).getByRole("separator")).toHaveAttribute(
      "aria-orientation",
      "vertical",
    );
  });

  it("两档尺寸、两种带子", () => {
    const { rerender } = render(<Tools />);
    const toolbar = screen.getByRole("toolbar");
    const print = () => screen.getByRole("button", { name: "打印" });
    expect(toolbar).toHaveClass("bg-surface-sunken", "p-0.5");
    expect(print()).toHaveClass("h-9", "px-2.5");
    // 只有图标的钮是方的：没有水平内边距，图标跟着档位走
    const rule = () => screen.getByRole("button", { name: "每五行加重" });
    expect(rule()).toHaveClass("h-9", "min-w-9", "[&_svg]:size-5");
    expect(rule()).not.toHaveClass("px-2.5");

    rerender(<Tools size="sm" variant="outline" />);
    expect(toolbar).toHaveClass("border", "border-line-strong", "p-px");
    expect(toolbar).not.toHaveClass("bg-surface-sunken");
    expect(print()).toHaveClass("h-7", "px-2");
    expect(rule()).toHaveClass("h-7", "min-w-7", "[&_svg]:size-4");
  });

  it("整条只占一个 Tab 停靠点；方向键在各项之间走，走到头绕回去，Home / End 到两头", async () => {
    const user = userEvent.setup();
    render(
      <>
        <button type="button">前面</button>
        <Tools />
        <button type="button">后面</button>
      </>,
    );
    const name = () =>
      document.activeElement?.getAttribute("aria-label") ??
      document.activeElement?.textContent;

    await user.tab();
    await user.tab();
    expect(name()).toBe("标准");
    await user.keyboard("{ArrowRight}");
    expect(name()).toBe("紧凑");
    await user.keyboard("{ArrowRight}{ArrowRight}");
    expect(name()).toBe("打印");
    // 禁用的钮仍然走得到
    await user.keyboard("{ArrowRight}");
    expect(name()).toBe("导出");
    await user.keyboard("{ArrowRight}");
    expect(name()).toBe("标准");
    await user.keyboard("{End}");
    expect(name()).toBe("导出");
    await user.keyboard("{Home}");
    expect(name()).toBe("标准");

    // Tab 直接出去，不在里面一个个停
    await user.keyboard("{ArrowRight}");
    await user.tab();
    expect(name()).toBe("后面");
    // 回来落在上次停的那一个上
    await user.tab({ shift: true });
    expect(name()).toBe("紧凑");
  });

  it("按钮：点击触发；有字的钮名称就是字，图标是装饰", async () => {
    const user = userEvent.setup();
    const onPrint = vi.fn();
    render(<Tools onPrint={onPrint} />);
    const print = screen.getByRole("button", { name: "打印" });
    expect(print).toHaveAttribute("type", "button");
    expect(within(print).getByTestId("dot")).toBeInTheDocument();
    await user.click(print);
    expect(onPrint).toHaveBeenCalledTimes(1);
  });

  it("禁用的钮：读得出不可用，点了没反应，但没有被拿出焦点序列", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Toolbar aria-label="工具">
        <ToolbarButton disabled onClick={onClick}>
          导出
        </ToolbarButton>
      </Toolbar>,
    );
    const button = screen.getByRole("button", { name: "导出" });
    expect(button).toHaveAttribute("aria-disabled", "true");
    expect(button).not.toBeDisabled();
    expect(button).toHaveAttribute("data-disabled");
    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("开关钮：不受控时自己记着，输出 aria-pressed", async () => {
    const user = userEvent.setup();
    render(<Tools />);
    const rule = screen.getByRole("button", { name: "每五行加重" });
    expect(rule).toHaveAttribute("aria-pressed", "false");
    await user.click(rule);
    expect(rule).toHaveAttribute("aria-pressed", "true");
    expect(rule).toHaveAttribute("data-pressed");
    rule.focus();
    await user.keyboard(" ");
    expect(rule).toHaveAttribute("aria-pressed", "false");
  });

  it("开关钮：受控时只报告", async () => {
    const user = userEvent.setup();
    const onPressedChange = vi.fn();
    const { rerender } = render(
      <Toolbar aria-label="工具">
        <ToolbarToggle pressed={false} onPressedChange={onPressedChange}>
          加重
        </ToolbarToggle>
      </Toolbar>,
    );
    const toggle = screen.getByRole("button", { name: "加重" });
    await user.click(toggle);
    expect(onPressedChange).toHaveBeenLastCalledWith(true);
    expect(toggle).toHaveAttribute("aria-pressed", "false");

    rerender(
      <Toolbar aria-label="工具">
        <ToolbarToggle pressed onPressedChange={onPressedChange}>
          加重
        </ToolbarToggle>
      </Toolbar>,
    );
    expect(toggle).toHaveAttribute("aria-pressed", "true");
  });

  it("开关组：默认同时只按下一个，再点一次弹起来，可以一个都不按", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Tools group={{ onValueChange }} />);
    const normal = screen.getByRole("button", { name: "标准" });
    const dense = screen.getByRole("button", { name: "紧凑" });
    expect(normal).toHaveAttribute("aria-pressed", "true");
    expect(dense).toHaveAttribute("aria-pressed", "false");

    await user.click(dense);
    expect(onValueChange).toHaveBeenLastCalledWith(["sm"]);
    expect(normal).toHaveAttribute("aria-pressed", "false");
    expect(dense).toHaveAttribute("aria-pressed", "true");

    await user.click(dense);
    expect(onValueChange).toHaveBeenLastCalledWith([]);
    expect(dense).toHaveAttribute("aria-pressed", "false");
  });

  it("开关组：multiple 可以同时按下几个", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Tools group={{ multiple: true, onValueChange }} />);
    await user.click(screen.getByRole("button", { name: "紧凑" }));
    expect(onValueChange).toHaveBeenLastCalledWith(["md", "sm"]);
    expect(screen.getByRole("button", { name: "标准" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "紧凑" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("开关组：受控", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <Tools
        group={{ value: ["sm"], defaultValue: undefined, onValueChange }}
      />,
    );
    const normal = screen.getByRole("button", { name: "标准" });
    expect(normal).toHaveAttribute("aria-pressed", "false");
    await user.click(normal);
    expect(onValueChange).toHaveBeenLastCalledWith(["md"]);
    expect(normal).toHaveAttribute("aria-pressed", "false");
  });

  it("整条禁用：里面的钮都不可用", async () => {
    const user = userEvent.setup();
    const onPrint = vi.fn();
    render(<Tools disabled onPrint={onPrint} />);
    expect(screen.getByRole("toolbar")).toHaveAttribute("data-disabled");
    const print = screen.getByRole("button", { name: "打印" });
    expect(print).toHaveAttribute("aria-disabled", "true");
    await user.click(print);
    expect(onPrint).not.toHaveBeenCalled();
    const dense = screen.getByRole("button", { name: "紧凑" });
    await user.click(dense);
    expect(dense).toHaveAttribute("aria-pressed", "false");
  });

  it("链接形态：href 渲染成链接，render 换成你给的元素；它们也在方向键的序列里", async () => {
    const user = userEvent.setup();
    render(
      <Toolbar aria-label="工具">
        <ToolbarButton>打印</ToolbarButton>
        <ToolbarButton href="/archive" target="_blank" rel="noreferrer">
          档案
        </ToolbarButton>
        <ToolbarButton
          aria-label="帮助"
          icon={<Dot />}
          render={<a href="/help" data-router="" />}
        />
      </Toolbar>,
    );
    const archive = screen.getByRole("link", { name: "档案" });
    expect(archive).toHaveAttribute("href", "/archive");
    expect(archive).toHaveAttribute("target", "_blank");
    expect(archive).toHaveClass("h-9", "text-ink-secondary");
    const help = screen.getByRole("link", { name: "帮助" });
    expect(help).toHaveAttribute("href", "/help");
    expect(help).toHaveAttribute("data-router");

    await user.tab();
    await user.keyboard("{ArrowRight}");
    expect(archive).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(help).toHaveFocus();
  });

  it("禁用的链接：去掉地址、标上 aria-disabled", () => {
    render(
      <Toolbar aria-label="工具">
        <ToolbarButton href="/archive" disabled>
          档案
        </ToolbarButton>
      </Toolbar>,
    );
    const link = screen.getByRole("link", { name: "档案" });
    expect(link).not.toHaveAttribute("href");
    expect(link).toHaveAttribute("aria-disabled", "true");
    expect(link).toHaveAttribute("data-disabled");
  });

  it("竖排：方向键换成上下，分隔换成横线，开关组跟着竖过来", async () => {
    const user = userEvent.setup();
    render(<Tools orientation="vertical" />);
    const toolbar = screen.getByRole("toolbar");
    expect(toolbar).toHaveAttribute("aria-orientation", "vertical");
    expect(toolbar).toHaveClass("flex-col");
    expect(screen.getByRole("separator")).toHaveAttribute(
      "aria-orientation",
      "horizontal",
    );
    expect(screen.getByRole("group", { name: "行高" })).toHaveAttribute(
      "data-orientation",
      "vertical",
    );

    await user.tab();
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("button", { name: "紧凑" })).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("button", { name: "紧凑" })).toHaveFocus();
  });

  it("ToolbarGroup：读屏里的一组", () => {
    render(
      <Toolbar aria-label="工具">
        <ToolbarGroup aria-label="单据">
          <ToolbarButton>打印</ToolbarButton>
          <ToolbarButton>导出</ToolbarButton>
        </ToolbarGroup>
      </Toolbar>,
    );
    const group = screen.getByRole("group", { name: "单据" });
    expect(within(group).getAllByRole("button")).toHaveLength(2);
  });

  it("交给菜单当触发钮：点了打开，开着的时候带 data-popup-open，仍然在方向键的序列里", async () => {
    const user = userEvent.setup();
    const onExport = vi.fn();
    render(
      <Toolbar aria-label="工具">
        <ToolbarButton>打印</ToolbarButton>
        <DropdownMenu trigger={<ToolbarButton>导出</ToolbarButton>}>
          <DropdownMenuItem onClick={onExport}>导出为表格</DropdownMenuItem>
        </DropdownMenu>
      </Toolbar>,
    );
    const trigger = screen.getByRole("button", { name: "导出" });
    expect(trigger).toHaveAttribute("aria-haspopup", "menu");

    await user.tab();
    await user.keyboard("{ArrowRight}");
    expect(trigger).toHaveFocus();

    await user.click(trigger);
    expect(await screen.findByRole("menu")).toBeInTheDocument();
    expect(trigger).toHaveAttribute("data-popup-open");
    await user.click(screen.getByRole("menuitem", { name: "导出为表格" }));
    expect(onExport).toHaveBeenCalledTimes(1);
  });

  it("用文字提示包住：钮还是工具栏里的一项", async () => {
    const user = userEvent.setup();
    render(
      <Toolbar aria-label="工具">
        <ToolbarButton>打印</ToolbarButton>
        <Tooltip content="每隔五行加重一条线">
          <ToolbarToggle icon={<Dot />} aria-label="加重" />
        </Tooltip>
      </Toolbar>,
    );
    const toggle = screen.getByRole("button", { name: "加重" });
    await user.tab();
    await user.keyboard("{ArrowRight}");
    expect(toggle).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(toggle).toHaveAttribute("aria-pressed", "true");
  });
});
