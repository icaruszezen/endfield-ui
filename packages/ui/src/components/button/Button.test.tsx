import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./Button";
import { RouterLink } from "../../test/RouterLink";

describe("Button", () => {
  it("默认渲染为 type=button 的 control 按钮", () => {
    render(<Button>更多情报</Button>);
    const button = screen.getByRole("button", { name: "更多情报" });
    expect(button).toHaveAttribute("type", "button");
    expect(button).toHaveAttribute("data-variant", "control");
    expect(button).toHaveAttribute("data-size", "md");
  });

  it("点击时触发 onClick", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>确认</Button>);
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("禁用时不触发 onClick", async () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        确认
      </Button>,
    );
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("加载中保持可聚焦、标记忙碌、键盘也触发不了", async () => {
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        提交
      </Button>,
    );
    const button = screen.getByRole("button", { name: "提交" });
    expect(button).not.toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toHaveAttribute("aria-disabled", "true");

    button.focus();
    await userEvent.keyboard("{Enter}");
    expect(onClick).not.toHaveBeenCalled();
  });

  it("loadingText 只在加载中进入可访问名称", () => {
    const { rerender } = render(<Button loadingText="处理中">提交</Button>);
    expect(screen.getByRole("button")).toHaveAccessibleName("提交");

    rerender(
      <Button loading loadingText="处理中">
        提交
      </Button>,
    );
    expect(screen.getByRole("button")).toHaveAccessibleName("处理中");
  });

  it("传 href 时渲染为链接", () => {
    render(<Button href="/news">查看全部</Button>);
    const link = screen.getByRole("link", { name: "查看全部" });
    expect(link).toHaveAttribute("href", "/news");
  });

  it("禁用的链接去掉 href 并标记 aria-disabled", () => {
    render(
      <Button href="/news" disabled>
        查看全部
      </Button>,
    );
    const link = screen.getByRole("link", { name: "查看全部" });
    expect(link).not.toHaveAttribute("href");
    expect(link).toHaveAttribute("aria-disabled", "true");
  });

  it("装饰记号不进入可访问名称", () => {
    render(<Button variant="text">查看全部</Button>);
    expect(screen.getByRole("button")).toHaveAccessibleName("查看全部");
  });

  it("className 可以覆盖内置类", () => {
    render(<Button className="min-w-40">确认</Button>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("min-w-40");
    expect(button).not.toHaveClass("min-w-24");
  });

  it("text 以外都是 4px 圆角，左侧不再有竖条", () => {
    for (const variant of [
      "control",
      "action",
      "light",
      "back",
      "danger",
    ] as const) {
      const { container, unmount } = render(
        <Button variant={variant}>确认</Button>,
      );
      expect(screen.getByRole("button")).toHaveClass("rounded-sm");
      expect(container.querySelector(".marker-bar")).toBeNull();
      unmount();
    }

    render(<Button variant="text">查看全部</Button>);
    expect(screen.getByRole("button")).not.toHaveClass("rounded-sm");
  });

  it("配色：control 用按钮令牌，danger 是红底白字，light 是浅灰底加点阵", () => {
    const control = render(<Button>确认</Button>);
    expect(screen.getByRole("button")).toHaveClass(
      "bg-button",
      "text-on-button",
      "hover:bg-button-hover",
    );
    control.unmount();

    const danger = render(<Button variant="danger">删除</Button>);
    expect(screen.getByRole("button")).toHaveClass(
      "bg-alert-fill",
      "text-white",
      "hover:bg-alert-fill-hover",
    );
    danger.unmount();

    render(<Button variant="light">取消</Button>);
    expect(screen.getByRole("button")).toHaveClass(
      "dot-grid",
      "bg-neutral-100",
      "hover:bg-neutral-50",
    );
  });

  it("有 iconStart 时图标和文字之间一条细竖线；text 变体和 iconEnd 不加", () => {
    const icon = <svg data-testid="icon" />;
    const { container, unmount } = render(
      <Button iconStart={icon}>下载</Button>,
    );
    const divider = container.querySelector("[data-button-divider]");
    expect(divider).toHaveAttribute("aria-hidden", "true");
    expect(divider).toHaveClass("w-px", "h-3.5", "bg-current", "opacity-30");
    // 竖线排在图标和文字之间
    expect(divider?.previousElementSibling).toBe(screen.getByTestId("icon"));
    expect(screen.getByRole("button")).toHaveAccessibleName("下载");
    unmount();

    // back 默认的左箭头也是 iconStart
    const back = render(<Button variant="back">返回</Button>);
    expect(
      back.container.querySelector("[data-button-divider]"),
    ).not.toBeNull();
    back.unmount();

    for (const props of [
      { variant: "text" as const, iconStart: icon },
      { iconEnd: icon },
      { iconStart: null },
    ]) {
      const other = render(<Button {...props}>查看</Button>);
      expect(other.container.querySelector("[data-button-divider]")).toBeNull();
      other.unmount();
    }
  });

  it("加载中：有图标时旋转方块换掉图标；没有图标时放在左侧留白里", () => {
    const icon = <svg data-testid="icon" />;
    const withIcon = render(
      <Button iconStart={icon} loading>
        下载
      </Button>,
    );
    expect(screen.queryByTestId("icon")).toBeNull();
    expect(withIcon.container.querySelectorAll(".animate-spin")).toHaveLength(
      1,
    );
    // 竖线还在，宽度不变
    expect(
      withIcon.container.querySelector("[data-button-divider]"),
    ).not.toBeNull();
    withIcon.unmount();

    const bare = render(<Button loading>提交</Button>);
    const spinner = bare.container.querySelector(".animate-spin");
    expect(spinner?.parentElement).toHaveClass("absolute", "left-2", "size-2");
    bare.unmount();

    // action 的旋转方块在分隔线右边：图标照旧，不会有两个
    const action = render(
      <Button variant="action" iconStart={icon} loading>
        提交
      </Button>,
    );
    expect(screen.getByTestId("icon")).toBeInTheDocument();
    expect(action.container.querySelectorAll(".animate-spin")).toHaveLength(1);
  });

  it("高对比模式：带底色的变体补一圈线，细竖线和分隔线用按钮的字色；text 靠下划线，不补", () => {
    for (const variant of [
      "control",
      "action",
      "light",
      "back",
      "danger",
    ] as const) {
      const { unmount } = render(<Button variant={variant}>确认</Button>);
      expect(screen.getByRole("button")).toHaveClass(
        "forced-colors:border",
        "forced-colors:border-[ButtonText]",
      );
      unmount();
    }

    // 平时是字色的 30%；高对比模式下底色画的线会被换掉，要写成实色的系统色
    const control = render(<Button iconStart={<svg />}>确认</Button>);
    expect(
      control.container.querySelector("[data-button-divider]"),
    ).toHaveClass("forced-colors:bg-[ButtonText]", "forced-colors:opacity-100");
    control.unmount();

    // 分隔线平时悬停、按下各深一档：那两档带着状态，高对比模式下要各写一份才盖得住
    const action = render(<Button variant="action">确认</Button>);
    expect(
      action.container.querySelector("button > span[aria-hidden]"),
    ).toHaveClass(
      "forced-colors:bg-[ButtonText]",
      "forced-colors:group-hover:bg-[ButtonText]",
      "forced-colors:group-active:bg-[ButtonText]",
    );
    action.unmount();

    render(<Button variant="text">查看全部</Button>);
    expect(screen.getByRole("button").className).not.toContain(
      "forced-colors:",
    );
  });

  it("高对比模式：底色的变化看不见，悬停时字加下划线；禁用的和 text 不加", () => {
    for (const variant of [
      "control",
      "action",
      "light",
      "back",
      "danger",
    ] as const) {
      const { unmount } = render(<Button variant={variant}>确认</Button>);
      expect(screen.getByRole("button")).toHaveClass(
        "forced-colors:hover:underline",
      );
      unmount();
    }

    const disabled = render(<Button disabled>确认</Button>);
    expect(screen.getByRole("button")).not.toHaveClass(
      "forced-colors:hover:underline",
    );
    disabled.unmount();

    render(<Button variant="text">查看全部</Button>);
    expect(screen.getByRole("button")).not.toHaveClass(
      "forced-colors:hover:underline",
    );
  });

  it("高对比模式：禁用的线、字、记号都是灰字色，链接形态也是", () => {
    const { container, unmount } = render(
      <Button disabled iconStart={<svg />}>
        确认
      </Button>,
    );
    const button = screen.getByRole("button");
    expect(button).toHaveClass(
      "forced-colors:border",
      "forced-colors:border-[GrayText]",
      "forced-colors:text-[GrayText]",
    );
    expect(button).not.toHaveClass("forced-colors:border-[ButtonText]");
    const startDivider = container.querySelector("[data-button-divider]");
    expect(startDivider).toHaveClass("forced-colors:bg-[GrayText]");
    expect(startDivider).not.toHaveClass("forced-colors:bg-[ButtonText]");
    unmount();

    const action = render(
      <Button variant="action" disabled>
        确认
      </Button>,
    );
    const divider = action.container.querySelector(
      "button > span[aria-hidden]",
    );
    expect(divider).toHaveClass("forced-colors:bg-[GrayText]");
    expect(divider?.className).not.toContain("[ButtonText]");
    action.unmount();

    // 去掉了地址的 <a> 不是真的禁用，系统不会替它把字换灰：字色是自己写的
    const link = render(
      <Button href="/news" disabled>
        查看全部
      </Button>,
    );
    expect(screen.getByRole("link")).toHaveClass(
      "forced-colors:border-[GrayText]",
      "forced-colors:text-[GrayText]",
    );
    link.unmount();

    // text 变体不补线，但下划线和字一起写明
    render(
      <Button variant="text" disabled>
        查看全部
      </Button>,
    );
    const text = screen.getByRole("button");
    expect(text).toHaveClass(
      "forced-colors:border-[GrayText]",
      "forced-colors:text-[GrayText]",
    );
    expect(text).not.toHaveClass("forced-colors:border");
  });

  it("高对比模式：加载中线和字照旧，旋转方块用按钮的字色", () => {
    for (const variant of [
      "control",
      "action",
      "light",
      "back",
      "danger",
      "text",
    ] as const) {
      const { container, unmount } = render(
        <Button variant={variant} loading>
          提交
        </Button>,
      );
      const button = screen.getByRole("button");
      expect(button).toHaveClass("forced-colors:text-[ButtonText]");
      expect(button.className).not.toContain("[GrayText]");
      // 加载指示自己写的是页面的字色，在按钮里换成按钮的字色
      const spinner = container.querySelector(".animate-spin");
      expect(spinner).toHaveClass("forced-colors:bg-[ButtonText]");
      expect(spinner).not.toHaveClass("forced-colors:bg-[CanvasText]");
      unmount();
    }

    // 那一圈线也照旧
    render(<Button loading>提交</Button>);
    expect(screen.getByRole("button")).toHaveClass(
      "forced-colors:border",
      "forced-colors:border-[ButtonText]",
    );
  });

  it("render：交给路由库的链接组件来渲染，长相和状态属性都还在", async () => {
    const onClick = vi.fn();
    render(
      <Button
        variant="action"
        render={<RouterLink to="/archive" className="from-router" />}
        onClick={onClick}
      >
        查看档案
      </Button>,
    );
    const link = screen.getByRole("link", { name: "查看档案" });
    expect(link).toHaveAttribute("data-router-link");
    expect(link).toHaveAttribute("href", "/app/archive");
    expect(link).toHaveAttribute("data-variant", "action");
    expect(link).toHaveClass("bg-action", "from-router");
    expect(link).not.toHaveAttribute("type");

    await userEvent.click(link);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("render：禁用时标 aria-disabled 并拦下点击", async () => {
    const onClick = vi.fn();
    const onNavigate = vi.fn(
      (event: { defaultPrevented: boolean }) => event.defaultPrevented,
    );
    render(
      // 路由库的链接组件在自己的 onClick 之后看 defaultPrevented 决定跳不跳
      <div onClick={onNavigate}>
        <Button
          disabled
          render={<RouterLink to="/archive" />}
          onClick={onClick}
        >
          查看档案
        </Button>
      </div>,
    );
    const link = screen.getByRole("link", { name: "查看档案" });
    expect(link).toHaveAttribute("aria-disabled", "true");

    await userEvent.click(link);
    expect(onClick).not.toHaveBeenCalled();
    expect(onNavigate).toHaveReturnedWith(true);
  });
});
