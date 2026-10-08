import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FlyoutBar, FlyoutBarItem } from "./FlyoutBar";
import { RouterLink } from "../../test/RouterLink";

function Share({
  onCopy = () => {},
  ...props
}: { onCopy?: () => void } & Partial<React.ComponentProps<typeof FlyoutBar>>) {
  return (
    <FlyoutBar
      trigger={
        <button type="button" aria-label="分享">
          <svg />
        </button>
      }
      {...props}
    >
      <FlyoutBarItem aria-label="复制链接" onClick={onCopy}>
        <svg />
      </FlyoutBarItem>
      <FlyoutBarItem aria-label="发邮件" href="mailto:someone@example.com">
        <svg />
      </FlyoutBarItem>
      <FlyoutBarItem aria-label="打印" disabled>
        <svg />
      </FlyoutBarItem>
      <FlyoutBarItem>
        <svg />
        二维码
      </FlyoutBarItem>
    </FlyoutBar>
  );
}

describe("FlyoutBar", () => {
  it("是一个横向菜单，名称取自触发按钮，每一项都有名称", async () => {
    const user = userEvent.setup();
    render(<Share />);
    const trigger = screen.getByRole("button", { name: "分享" });
    expect(trigger).toHaveAttribute("aria-haspopup", "menu");

    await user.click(trigger);
    const bar = await screen.findByRole("menu", { name: "分享" });
    expect(bar).toHaveAttribute("aria-orientation", "horizontal");
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByRole("menuitem", { name: "复制链接" }),
    ).toBeInTheDocument();
    // 带文字的项用文字当名称
    expect(
      screen.getByRole("menuitem", { name: "二维码" }),
    ).toBeInTheDocument();
  });

  it("键盘：回车打开并进到第一项，左右方向键移动，Esc 关闭后回到触发按钮", async () => {
    const user = userEvent.setup();
    render(<Share />);
    const trigger = screen.getByRole("button", { name: "分享" });
    await user.tab();
    await user.keyboard("{Enter}");
    await screen.findByRole("menu");
    await waitFor(() =>
      expect(screen.getByRole("menuitem", { name: "复制链接" })).toHaveFocus(),
    );

    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("menuitem", { name: "发邮件" })).toHaveFocus();
    await user.keyboard("{ArrowLeft}");
    expect(screen.getByRole("menuitem", { name: "复制链接" })).toHaveFocus();

    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.queryByRole("menu")).not.toBeInTheDocument(),
    );
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("点一项：执行并收起", async () => {
    const user = userEvent.setup();
    const onCopy = vi.fn();
    render(<Share onCopy={onCopy} />);
    await user.click(screen.getByRole("button", { name: "分享" }));
    await user.click(await screen.findByRole("menuitem", { name: "复制链接" }));
    expect(onCopy).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(screen.queryByRole("menu")).not.toBeInTheDocument(),
    );
  });

  it("传 href 的项是一个链接；禁用项有标记", async () => {
    const user = userEvent.setup();
    render(<Share />);
    await user.click(screen.getByRole("button", { name: "分享" }));
    const link = await screen.findByRole("menuitem", { name: "发邮件" });
    expect(link.tagName).toBe("A");
    expect(link).toHaveAttribute("href", "mailto:someone@example.com");
    expect(screen.getByRole("menuitem", { name: "打印" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });

  it("横条是一块固定的深色，默认展开在右侧", async () => {
    render(<Share defaultOpen />);
    const bar = await screen.findByRole("menu");
    expect(bar).toHaveAttribute("data-theme", "dark");
    expect(bar).toHaveAttribute("data-side", "right");
  });

  it("受控", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<Share open onOpenChange={onOpenChange} />);
    await screen.findByRole("menu");
    await user.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("render：一项交给路由库的链接组件", async () => {
    const user = userEvent.setup();
    render(
      <FlyoutBar trigger={<button type="button">分享</button>}>
        <FlyoutBarItem
          aria-label="打开详情"
          render={<RouterLink to="/detail" />}
        >
          <svg />
        </FlyoutBarItem>
      </FlyoutBar>,
    );
    await user.click(screen.getByRole("button", { name: "分享" }));
    const item = await screen.findByRole("menuitem", { name: "打开详情" });
    expect(item).toHaveAttribute("href", "/app/detail");
  });
});
