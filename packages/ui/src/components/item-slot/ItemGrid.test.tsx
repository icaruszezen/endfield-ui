import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ItemGrid, nextSlotIndex } from "./ItemGrid";
import { ItemSlot } from "./ItemSlot";

/* 三列的网格，第三行只有两格：
 *   0 1 2
 *   3 4 5
 *   6 7
 */
const positions = Array.from({ length: 8 }, (_, index) => ({
  top: Math.floor(index / 3) * 80,
  left: (index % 3) * 80,
}));

describe("nextSlotIndex", () => {
  it("左右在同一行里移动，到头不折行", () => {
    expect(nextSlotIndex(positions, 0, "ArrowRight")).toBe(1);
    expect(nextSlotIndex(positions, 2, "ArrowRight")).toBe(2);
    expect(nextSlotIndex(positions, 4, "ArrowLeft")).toBe(3);
    expect(nextSlotIndex(positions, 3, "ArrowLeft")).toBe(3);
  });

  it("上下落在相邻一行的同一列", () => {
    expect(nextSlotIndex(positions, 1, "ArrowDown")).toBe(4);
    expect(nextSlotIndex(positions, 4, "ArrowUp")).toBe(1);
    expect(nextSlotIndex(positions, 0, "ArrowUp")).toBe(0);
    expect(nextSlotIndex(positions, 7, "ArrowDown")).toBe(7);
  });

  it("下一行没有这一列时，落在水平位置最近的那一格", () => {
    expect(nextSlotIndex(positions, 5, "ArrowDown")).toBe(7);
  });

  it("Home / End 到行首行尾，带 Ctrl 到第一格和最后一格", () => {
    expect(nextSlotIndex(positions, 4, "Home")).toBe(3);
    expect(nextSlotIndex(positions, 4, "End")).toBe(5);
    expect(nextSlotIndex(positions, 4, "Home", true)).toBe(0);
    expect(nextSlotIndex(positions, 4, "End", true)).toBe(7);
  });

  it("顶边差一两个小数像素的仍然算同一行", () => {
    const uneven = [
      { top: 0, left: 0 },
      { top: 0.4, left: 80 },
      { top: 80, left: 0 },
    ];
    expect(nextSlotIndex(uneven, 0, "ArrowRight")).toBe(1);
    expect(nextSlotIndex(uneven, 1, "ArrowDown")).toBe(2);
  });

  it("不认识的键不动", () => {
    expect(nextSlotIndex(positions, 4, "a")).toBe(4);
  });
});

const names = ["碎石", "滤芯", "合金锭", "备用电池", "冷却液", "高能燃料"];

function Inventory({
  initial = null,
  disabled = [],
}: {
  initial?: string | null;
  disabled?: string[];
}) {
  const [items, setItems] = useState(names);
  const [selected, setSelected] = useState<string | null>(initial);
  return (
    <>
      <button type="button">前面的按钮</button>
      <ItemGrid aria-label="物资">
        {items.map((name) => (
          <ItemSlot
            key={name}
            name={name}
            selected={name === selected}
            disabled={disabled.includes(name)}
            onClick={() => setSelected(name)}
          />
        ))}
        <ItemSlot name="未登记的样本" unowned />
      </ItemGrid>
      <button
        type="button"
        onClick={() => setItems((current) => current.slice(1))}
      >
        移走第一格
      </button>
    </>
  );
}

const slot = (name: string) => screen.getByRole("button", { name });

/** jsdom 不排版：按文档顺序把格子摆成三列 */
function layOutInThreeColumns() {
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
    function (this: HTMLElement) {
      const controls = [...document.querySelectorAll("[data-slot-control]")];
      const index = Math.max(0, controls.indexOf(this));
      return new DOMRect((index % 3) * 80, Math.floor(index / 3) * 80, 72, 72);
    },
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ItemGrid", () => {
  it("是一个有名称的分组，默认带自动填充的网格", () => {
    render(<Inventory />);
    const grid = screen.getByRole("group", { name: "物资" });
    expect(grid).toHaveClass("grid", "gap-2", "p-1");
  });

  it("整个矩阵只占一个 Tab 停靠点：没有选中的格子时是第一格", async () => {
    const user = userEvent.setup();
    render(<Inventory />);
    await waitFor(() => expect(slot("碎石")).toHaveAttribute("tabindex", "0"));
    for (const name of names.slice(1)) {
      expect(slot(name)).toHaveAttribute("tabindex", "-1");
    }

    await user.tab();
    await user.tab();
    expect(slot("碎石")).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: "移走第一格" })).toHaveFocus();
  });

  it("有选中的格子时，停靠点是它", async () => {
    render(<Inventory initial="合金锭" />);
    await waitFor(() =>
      expect(slot("合金锭")).toHaveAttribute("tabindex", "0"),
    );
    expect(slot("碎石")).toHaveAttribute("tabindex", "-1");
  });

  it("方向键移动焦点，停靠点跟着走；选中不变", async () => {
    const user = userEvent.setup();
    layOutInThreeColumns();
    render(<Inventory initial="碎石" />);
    await user.tab();
    await user.tab();
    expect(slot("碎石")).toHaveFocus();

    await user.keyboard("{ArrowRight}");
    expect(slot("滤芯")).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(slot("冷却液")).toHaveFocus();
    await user.keyboard("{Home}");
    expect(slot("备用电池")).toHaveFocus();
    await user.keyboard("{Control>}{End}{/Control}");
    expect(slot("高能燃料")).toHaveFocus();

    expect(slot("高能燃料")).toHaveAttribute("tabindex", "0");
    expect(slot("碎石")).toHaveAttribute("tabindex", "-1");
    expect(slot("碎石")).toHaveAttribute("aria-pressed", "true");

    // 回车才是选中
    await user.keyboard("{Enter}");
    expect(slot("高能燃料")).toHaveAttribute("aria-pressed", "true");
  });

  it("禁用的格子和静态的格子走不到", async () => {
    const user = userEvent.setup();
    layOutInThreeColumns();
    render(<Inventory disabled={["滤芯"]} />);
    await user.tab();
    await user.tab();
    expect(slot("碎石")).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(slot("合金锭")).toHaveFocus();

    await user.keyboard("{Control>}{End}{/Control}");
    expect(slot("高能燃料")).toHaveFocus();
  });

  it("停靠的那一格被移走之后，停靠点落到剩下的第一格", async () => {
    const user = userEvent.setup();
    render(<Inventory />);
    await waitFor(() => expect(slot("碎石")).toHaveAttribute("tabindex", "0"));
    await user.click(screen.getByRole("button", { name: "移走第一格" }));
    await waitFor(() => expect(slot("滤芯")).toHaveAttribute("tabindex", "0"));
  });

  it("不放在矩阵里的格子不带 tabindex", () => {
    render(<ItemSlot name="合金锭" onClick={() => {}} />);
    expect(slot("合金锭")).not.toHaveAttribute("tabindex");
  });
});
