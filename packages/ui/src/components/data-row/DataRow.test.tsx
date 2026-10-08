import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { DataRow, DataRowList } from "./DataRow";

const columns = {
  name: "项目",
  trend: "走势",
  value: "当前",
  reference: "理论",
};

function Ledger() {
  return (
    <DataRowList label="本周收支" columns={columns}>
      <DataRow
        name="钢材"
        categoryColor="var(--color-special)"
        favorite
        series={[3, 5, 4, 8]}
        value="+128"
        tone="info"
        reference="+140"
      />
      <DataRow
        name="滤芯"
        favorite={false}
        series={[9, 4, 6, 2]}
        value="−212"
        tone="danger"
        reference="−180"
      />
    </DataRowList>
  );
}

describe("DataRowList", () => {
  it("是一张有名称的表格：列头、行、行头与单元格", () => {
    render(<Ledger />);
    const table = screen.getByRole("table", { name: "本周收支" });
    expect(
      within(table)
        .getAllByRole("columnheader")
        .map((cell) => cell.textContent),
    ).toEqual(["项目", "走势", "当前", "理论"]);
    // 列头一行 + 两行数据
    expect(within(table).getAllByRole("row")).toHaveLength(3);

    const row = within(table).getAllByRole("row")[1]!;
    expect(within(row).getByRole("rowheader")).toHaveTextContent("钢材");
    expect(
      within(row)
        .getAllByRole("cell")
        .map((cell) => cell.textContent),
    ).toEqual(["", "+128", "+140"]);
  });

  it("不给 trend / reference 的列名就没有那一列，行里对应的内容也不出现", () => {
    render(
      <DataRowList columns={{ name: "项目", value: "当前" }}>
        <DataRow name="钢材" series={[1, 2, 3]} value="+128" reference="+140" />
      </DataRowList>,
    );
    expect(screen.getAllByRole("columnheader")).toHaveLength(2);
    const row = screen.getAllByRole("row")[1]!;
    expect(within(row).getAllByRole("cell")).toHaveLength(1);
    expect(row.querySelector("svg")).not.toBeInTheDocument();
    expect(row).not.toHaveTextContent("+140");
  });

  it("className 与其余属性给画布", () => {
    render(
      <DataRowList columns={columns} className="max-w-md" data-testid="canvas">
        <DataRow name="钢材" value="+1" />
      </DataRowList>,
    );
    expect(screen.getByTestId("canvas")).toHaveClass(
      "max-w-md",
      "bg-surface-sunken",
    );
  });
});

describe("DataRow", () => {
  it("每一行是一块固定的深色", () => {
    render(<Ledger />);
    for (const row of screen.getAllByRole("row").slice(1)) {
      expect(row).toHaveAttribute("data-theme", "dark");
    }
  });

  it("当前值按 tone 着色，异常行的走势图也换成红", () => {
    render(<Ledger />);
    const [, steel, filter] = screen.getAllByRole("row");
    expect(within(steel!).getByText("+128")).toHaveClass("text-info");
    expect(steel!.querySelector("svg")).toHaveAttribute("data-tone", "info");
    expect(within(filter!).getByText("−212")).toHaveClass("text-danger");
    expect(filter!.querySelector("svg")).toHaveAttribute("data-tone", "danger");
    // 走势图只是帮着看趋势，对读屏隐藏
    expect(steel!.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("类目色条的颜色由 categoryColor 给，没给就没有色条", () => {
    render(<Ledger />);
    const [, steel, filter] = screen.getAllByRole("row");
    expect(steel!.querySelector("[data-category]")).toBeInTheDocument();
    expect(steel!.style.getPropertyValue("--data-row-category")).toBe(
      "var(--color-special)",
    );
    expect(filter!.querySelector("[data-category]")).not.toBeInTheDocument();
  });

  it("只传 favorite：一个静态的标记，读屏另有一句已收藏", () => {
    render(<Ledger />);
    const [, steel, filter] = screen.getAllByRole("row");
    expect(within(steel!).queryByRole("button")).not.toBeInTheDocument();
    expect(within(steel!).getByRole("rowheader")).toHaveTextContent(
      "钢材（已收藏）",
    );
    expect(within(filter!).getByRole("rowheader")).toHaveTextContent(/^滤芯$/);
  });

  it("传了 onFavoriteChange：一个切换按钮，报出收没收藏", async () => {
    const user = userEvent.setup();
    const onFavoriteChange = vi.fn();
    function Toggle() {
      const [favorite, setFavorite] = useState(false);
      return (
        <DataRowList columns={columns}>
          <DataRow
            name="钢材"
            value="+128"
            favorite={favorite}
            favoriteLabel="收藏钢材"
            onFavoriteChange={(next) => {
              onFavoriteChange(next);
              setFavorite(next);
            }}
          />
        </DataRowList>
      );
    }
    render(<Toggle />);
    const button = screen.getByRole("button", { name: "收藏钢材" });
    expect(button).toHaveAttribute("aria-pressed", "false");

    await user.click(button);
    expect(onFavoriteChange).toHaveBeenCalledWith(true);
    expect(button).toHaveAttribute("aria-pressed", "true");
    // 按钮自己已经报了状态，不再多读一句
    expect(screen.getByRole("rowheader")).not.toHaveTextContent("已收藏");

    await user.keyboard(" ");
    expect(onFavoriteChange).toHaveBeenLastCalledWith(false);
  });

  it("收藏和 favorite 都没传时不画收藏圆", () => {
    render(
      <DataRowList columns={columns}>
        <DataRow name="钢材" value="+128" />
      </DataRowList>,
    );
    const header = screen.getByRole("rowheader");
    expect(header.children).toHaveLength(1);
  });
});
