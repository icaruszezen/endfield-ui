// 键盘聚焦时看得见焦点环，颜色跟着主题走（亮色是墨色，暗色是黄色）
import assert from "node:assert/strict";
import { test } from "node:test";
import { useStorybook, type Page } from "./lib/harness.ts";

const storybook = useStorybook();

/** 当前焦点（或它的某一层父元素）上的焦点环，以及这个位置上 `focus` 令牌的取值 */
function ring(page: Page, levelsUp = 0) {
  return page.evaluate((levels) => {
    let element = document.activeElement as HTMLElement;
    for (let i = 0; i < levels; i++) element = element.parentElement!;
    const style = getComputedStyle(element);
    // 令牌写的是十六进制，量到的是 rgb()：借一个元素把前者也换算成 rgb()
    const probe = document.createElement("span");
    probe.style.color = style.getPropertyValue("--ef-focus");
    element.append(probe);
    const token = getComputedStyle(probe).color;
    probe.remove();
    return {
      style: style.outlineStyle,
      width: style.outlineWidth,
      color: style.outlineColor,
      token,
    };
  }, levelsUp);
}

/**
 * 等焦点环画出来：2px 实线、`focus` 令牌的颜色。
 * 要等而不是直接量——"减少动态效果"把所有过渡压到 0.01ms，但仍然是一次过渡，
 * 聚焦后的头一帧量到的是起点值（3px、文字色）。
 */
async function waitRing(page: Page, where: string, levelsUp = 0) {
  let found: Awaited<ReturnType<typeof ring>> | undefined;
  try {
    await page.waitFor(
      async () => {
        found = await ring(page, levelsUp);
        return (
          found.style === "solid" &&
          found.width === "2px" &&
          found.color === found.token
        );
      },
      "",
      2000,
    );
  } catch {
    assert.fail(
      `${where}的焦点环不对（要 2px 实线、focus 令牌的颜色）：${JSON.stringify(found)}`,
    );
  }
}

for (const theme of ["light", "dark"] as const) {
  test(`${theme}：菜单项有焦点环`, async () => {
    const { page } = storybook;
    await page.story("控件-dropdownmenu-下拉菜单--playground", theme);
    await page.key("Tab");
    await page.key("Enter");
    await page.waitVisible("[role=menu]");
    await page.key("ArrowDown");
    await waitRing(page, "菜单项");
  });

  test(`${theme}：下拉的选项有焦点环，触发器的环画在外框上`, async () => {
    const { page } = storybook;
    await page.story("控件-select-下拉选择--playground", theme);
    await page.key("Tab");
    await page.waitFocused("combobox:地区");
    await waitRing(page, "触发器的外框", 1);

    await page.key("Enter");
    await page.waitVisible("[role=listbox]");
    await page.key("ArrowDown");
    await waitRing(page, "选项");
  });
}

test("两个主题下焦点环的颜色不同", async () => {
  const { page } = storybook;
  const colors: string[] = [];
  for (const theme of ["light", "dark"] as const) {
    await page.story("控件-dropdownmenu-下拉菜单--playground", theme);
    await page.key("Tab");
    colors.push((await ring(page)).token);
  }
  assert.notEqual(colors[0], colors[1]);
});
