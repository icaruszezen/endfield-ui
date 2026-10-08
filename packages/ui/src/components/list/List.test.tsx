import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { List, ListRow } from "./List";

describe("List", () => {
  it("是一个列表，每行一个列表项", () => {
    render(
      <List>
        <ListRow>甲</ListRow>
        <ListRow>乙</ListRow>
      </List>,
    );
    expect(screen.getByRole("list")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });
});

describe("ListRow", () => {
  it("默认是静态行，没有可点击元素", () => {
    render(
      <List>
        <ListRow start="01" end="1,280" description="次要说明">
          采样点
        </ListRow>
      </List>,
    );
    const row = screen.getByRole("listitem");
    expect(row).toHaveTextContent("01采样点次要说明1,280");
    expect(row.querySelector("a, button")).toBeNull();
  });

  it("传 href 时整行是一个链接", () => {
    render(
      <List>
        <ListRow href="/log/1" end="10.08">
          测绘记录
        </ListRow>
      </List>,
    );
    const link = screen.getByRole("link", { name: /测绘记录/ });
    expect(link).toHaveAttribute("href", "/log/1");
    expect(link).not.toHaveAttribute("aria-current");
  });

  it("选中的链接行带 aria-current", () => {
    render(
      <List>
        <ListRow href="/log/1" selected>
          测绘记录
        </ListRow>
      </List>,
    );
    expect(screen.getByRole("link")).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("listitem")).toHaveAttribute("data-selected");
  });

  it("传 onClick 时整行是一个按钮", async () => {
    const onClick = vi.fn();
    render(
      <List>
        <ListRow onClick={onClick}>测绘记录</ListRow>
      </List>,
    );
    const button = screen.getByRole("button", { name: "测绘记录" });
    expect(button).not.toHaveAttribute("aria-pressed");

    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("声明了 selected 的按钮行输出 aria-pressed", () => {
    const { rerender } = render(
      <List>
        <ListRow onClick={() => {}} selected={false}>
          测绘记录
        </ListRow>
      </List>,
    );
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "false");

    rerender(
      <List>
        <ListRow onClick={() => {}} selected>
          测绘记录
        </ListRow>
      </List>,
    );
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "true");
  });

  it("禁用的按钮行点不动", async () => {
    const onClick = vi.fn();
    render(
      <List>
        <ListRow onClick={onClick} disabled>
          测绘记录
        </ListRow>
      </List>,
    );
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("禁用的链接行去掉 href，仍然读作不可用的链接", async () => {
    const onClick = vi.fn();
    render(
      <List>
        <ListRow href="/log/1" onClick={onClick} disabled>
          测绘记录
        </ListRow>
      </List>,
    );
    const link = screen.getByRole("link");
    expect(link).not.toHaveAttribute("href");
    expect(link).toHaveAttribute("aria-disabled", "true");

    await userEvent.click(link);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("完成态：读屏多读一句，描边词是装饰", () => {
    render(
      <List>
        <ListRow completed data-testid="row">
          校准传感器
        </ListRow>
      </List>,
    );
    const row = screen.getByTestId("row");
    expect(row).toHaveAttribute("data-completed");
    expect(row).toHaveTextContent("校准传感器（已完成）");

    const word = screen.getByText("DONE");
    expect(word).toHaveAttribute("aria-hidden", "true");
    expect(word).toHaveClass("ghost-outline");
  });

  it("完成态的描边词可以换、可以去掉", () => {
    const { rerender } = render(
      <List>
        <ListRow completed completedWord="CLEAR">
          校准传感器
        </ListRow>
      </List>,
    );
    expect(screen.getByText("CLEAR")).toBeInTheDocument();

    rerender(
      <List>
        <ListRow completed completedWord={null}>
          校准传感器
        </ListRow>
      </List>,
    );
    expect(screen.queryByText("CLEAR")).not.toBeInTheDocument();
    expect(screen.getByText("（已完成）")).toBeInTheDocument();
  });
});
