import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { Pagination } from "./Pagination";

const prev = () => screen.getByRole("button", { name: "上一页" });
const next = () => screen.getByRole("button", { name: "下一页" });

describe("Pagination", () => {
  it("是一个名为“分页”的导航地标，页码补零", () => {
    render(<Pagination pageCount={12} />);
    const nav = screen.getByRole("navigation", { name: "分页" });
    expect(nav).toHaveTextContent("01");
    expect(nav).toHaveTextContent("/ 12");
  });

  it("读屏听到的是一句完整的话，看得见的页码对它隐藏", () => {
    render(<Pagination pageCount={12} defaultPage={3} />);
    const status = screen.getByText("第 3 页，共 12 页");
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(screen.getByText("03")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByText("/ 12")).toHaveAttribute("aria-hidden", "true");
  });

  it("非受控：点按钮翻页，并通知 onPageChange", async () => {
    const onPageChange = vi.fn();
    render(<Pagination pageCount={3} onPageChange={onPageChange} />);

    await userEvent.click(next());
    expect(screen.getByText("第 2 页，共 3 页")).toBeInTheDocument();
    expect(onPageChange).toHaveBeenLastCalledWith(2);

    await userEvent.click(prev());
    expect(screen.getByText("第 1 页，共 3 页")).toBeInTheDocument();
    expect(onPageChange).toHaveBeenLastCalledWith(1);
  });

  it("到头时对应的按钮禁用", async () => {
    render(<Pagination pageCount={2} />);
    expect(prev()).toBeDisabled();
    expect(next()).toBeEnabled();

    await userEvent.click(next());
    expect(next()).toBeDisabled();
    expect(prev()).toBeEnabled();
  });

  it("只有一页时两个按钮都禁用", () => {
    render(<Pagination pageCount={1} />);
    expect(prev()).toBeDisabled();
    expect(next()).toBeDisabled();
  });

  it("受控：页码由外面决定", async () => {
    function Controlled() {
      const [page, setPage] = useState(5);
      return <Pagination pageCount={9} page={page} onPageChange={setPage} />;
    }
    render(<Controlled />);
    await userEvent.click(next());
    expect(screen.getByText("06")).toBeInTheDocument();
  });

  it("越界的页码被夹回范围内", () => {
    render(<Pagination pageCount={4} page={99} />);
    expect(screen.getByText("04")).toBeInTheDocument();
    expect(next()).toBeDisabled();
  });

  it("总页数上百时补零的位数跟着变", () => {
    render(<Pagination pageCount={128} defaultPage={7} />);
    expect(screen.getByText("007")).toBeInTheDocument();
    expect(screen.getByText("/ 128")).toBeInTheDocument();
  });

  it("没有 jump 时没有输入框", () => {
    render(<Pagination pageCount={12} />);
    expect(screen.queryByRole("textbox")).toBeNull();
  });

  it("jump：输入页码后回车跳页", async () => {
    const onPageChange = vi.fn();
    render(<Pagination pageCount={12} jump onPageChange={onPageChange} />);
    const input = screen.getByRole("textbox", { name: "跳到第几页" });
    expect(input).toHaveValue("01");

    await userEvent.clear(input);
    await userEvent.type(input, "8{Enter}");
    expect(onPageChange).toHaveBeenLastCalledWith(8);
    expect(input).toHaveValue("08");
  });

  it("jump：失焦同样跳页，越界时夹回范围", async () => {
    render(<Pagination pageCount={12} jump />);
    const input = screen.getByRole("textbox");

    await userEvent.clear(input);
    await userEvent.type(input, "99");
    await userEvent.tab();
    expect(input).toHaveValue("12");
    expect(next()).toBeDisabled();
  });

  it("jump：Esc 还原，清空后失焦也还原", async () => {
    const onPageChange = vi.fn();
    render(
      <Pagination
        pageCount={12}
        defaultPage={4}
        jump
        onPageChange={onPageChange}
      />,
    );
    const input = screen.getByRole("textbox");

    await userEvent.clear(input);
    await userEvent.type(input, "9{Escape}");
    expect(input).toHaveValue("04");

    await userEvent.clear(input);
    await userEvent.tab();
    expect(input).toHaveValue("04");
    expect(onPageChange).not.toHaveBeenCalled();
  });

  it("jump：只收数字", async () => {
    render(<Pagination pageCount={12} jump />);
    const input = screen.getByRole("textbox");
    await userEvent.clear(input);
    await userEvent.type(input, "a7b");
    expect(input).toHaveValue("7");
  });

  it("按钮名称与读屏文字可以换掉", () => {
    render(
      <Pagination
        aria-label="Pagination"
        pageCount={5}
        prevLabel="Previous"
        nextLabel="Next"
        pageLabel={(page, total) => `Page ${page} of ${total}`}
      />,
    );
    expect(
      screen.getByRole("navigation", { name: "Pagination" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();
    expect(screen.getByText("Page 1 of 5")).toBeInTheDocument();
  });
});
