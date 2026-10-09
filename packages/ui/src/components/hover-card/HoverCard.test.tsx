import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { RouterLink } from "../../test/RouterLink";
import { HoverCard, type HoverCardProps } from "./HoverCard";

function Station(props: Partial<HoverCardProps>) {
  return (
    <HoverCard
      trigger={<a href="/stations/n-07">N-07 三号管廊中继</a>}
      title="三号管廊中继"
      description="北段的第二个中继站。"
      delay={0}
      closeDelay={0}
      {...props}
    >
      <p>四人值守</p>
    </HoverCard>
  );
}

const card = () => document.querySelector<HTMLElement>("[data-hover-card]");

describe("HoverCard", () => {
  it("触发元素还是那个链接：地址、文字都在", () => {
    render(<Station />);
    const link = screen.getByRole("link", { name: "N-07 三号管廊中继" });
    expect(link).toHaveAttribute("href", "/stations/n-07");
    expect(card()).toBeNull();
  });

  it("悬停后出现，里面是标题、说明和内容；移开后消失", async () => {
    const user = userEvent.setup();
    render(<Station />);
    const link = screen.getByRole("link");

    await user.hover(link);
    await waitFor(() => expect(card()).toBeInTheDocument());
    expect(card()).toHaveTextContent("三号管廊中继");
    expect(card()).toHaveTextContent("北段的第二个中继站。");
    expect(card()).toHaveTextContent("四人值守");

    await user.unhover(link);
    await waitFor(() => expect(card()).toBeNull());
  });

  it("要等 delay 那么久才出现", async () => {
    const user = userEvent.setup();
    render(<Station delay={250} />);
    await user.hover(screen.getByRole("link"));
    // 刚悬停：还没到时候
    await new Promise((resolve) => setTimeout(resolve, 80));
    expect(card()).toBeNull();
    await waitFor(() => expect(card()).toBeInTheDocument());
  });

  it("键盘聚焦时也出现，Esc 收起，焦点留在链接上", async () => {
    const user = userEvent.setup();
    render(<Station />);
    const link = screen.getByRole("link");

    await user.tab();
    expect(link).toHaveFocus();
    await waitFor(() => expect(card()).toBeInTheDocument());

    await user.keyboard("{Escape}");
    await waitFor(() => expect(card()).toBeNull());
    expect(link).toHaveFocus();
  });

  it("不关联给读屏：链接上没有多出说明，卡片也不是对话框", async () => {
    const user = userEvent.setup();
    render(<Station />);
    const link = screen.getByRole("link");
    await user.hover(link);
    await waitFor(() => expect(card()).toBeInTheDocument());
    expect(link).not.toHaveAttribute("aria-describedby");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("受控：open 说了算，开关时调 onOpenChange", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const { rerender } = render(
      <Station open={false} onOpenChange={onOpenChange} />,
    );
    await user.hover(screen.getByRole("link"));
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(true));
    // 没把 open 改过来，卡片就不出现
    expect(card()).toBeNull();

    rerender(<Station open onOpenChange={onOpenChange} />);
    await waitFor(() => expect(card()).toBeInTheDocument());
  });

  it("defaultOpen 一开始就开着", async () => {
    render(<Station defaultOpen />);
    await waitFor(() => expect(card()).toBeInTheDocument());
  });

  it("没有标题和说明时只有内容，不留空壳", async () => {
    render(<Station defaultOpen title={undefined} description={undefined} />);
    await waitFor(() => expect(card()).toBeInTheDocument());
    expect(card()!.children).toHaveLength(1);
    expect(card()).toHaveTextContent("四人值守");
  });

  it("className 和其余属性给卡片", async () => {
    render(<Station defaultOpen className="w-64" id="station-card" />);
    await waitFor(() => expect(card()).toBeInTheDocument());
    expect(card()).toHaveClass("w-64", "p-4");
    expect(card()).toHaveAttribute("id", "station-card");
  });

  it("render 形态的链接组件也能当触发元素", async () => {
    const user = userEvent.setup();
    render(
      <Station trigger={<RouterLink to="/stations/n-07">N-07</RouterLink>} />,
    );
    const link = screen.getByRole("link", { name: "N-07" });
    expect(link).toHaveAttribute("href", "/app/stations/n-07");
    await user.hover(link);
    await waitFor(() => expect(card()).toBeInTheDocument());
  });

  it("带上触发处的局部主题", async () => {
    render(
      <div data-theme="dark">
        <Station defaultOpen />
      </div>,
    );
    await waitFor(() => expect(card()).toBeInTheDocument());
    const scope = card()!.closest("[data-theme]");
    expect(scope).toHaveAttribute("data-theme", "dark");
    expect(scope?.parentElement).toBe(document.body);
  });
});
