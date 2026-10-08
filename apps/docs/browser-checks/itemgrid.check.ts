// 物品格矩阵：只占一个 Tab 停靠点，方向键按格子的实际位置走
import assert from "node:assert/strict";
import { test } from "node:test";
import { useStorybook, type Page } from "./lib/harness.ts";

const storybook = useStorybook();

const STORY = "控件-itemslot-物品格--grid";

/** 当前焦点是哪一格、在哪 */
const here = (page: Page) =>
  page.evaluate(() => {
    const element = document.activeElement as HTMLElement;
    const rect = element.getBoundingClientRect();
    return {
      inGrid: !!element.closest("[role=group]"),
      // 读屏的那一句以名称开头；看得见的数量、角标不算
      name:
        element.querySelector(".sr-only")?.textContent?.split("，")[0] ?? "",
      left: Math.round(rect.left),
      top: Math.round(rect.top),
    };
  });

/** 按一个键，等焦点真的换了格子再量 */
async function move(page: Page, key: string, options?: { ctrl?: boolean }) {
  const before = await here(page);
  await page.key(key, options);
  return page.waitFor(async () => {
    const after = await here(page);
    return after.name !== before.name ? after : null;
  }, `按 ${key} 之后焦点没有动（停在 ${before.name}）`);
}

/** 矩阵里所有能走到的格子的位置，按文档顺序 */
const slots = (page: Page) =>
  page.evaluate(() =>
    [
      ...document.querySelectorAll<HTMLElement>(
        "[role=group] [data-slot-control]:not(:disabled)",
      ),
    ].map((element) => {
      const rect = element.getBoundingClientRect();
      return {
        // 读屏的那一句以名称开头；看得见的数量、角标不算
        name:
          element.querySelector(".sr-only")?.textContent?.split("，")[0] ?? "",
        left: Math.round(rect.left),
        top: Math.round(rect.top),
      };
    }),
  );

test("整个矩阵只占一个 Tab 停靠点，停在选中的那一格", async () => {
  const { page } = storybook;
  await page.story(STORY);

  await page.key("Tab");
  const first = await page.waitFor(async () => {
    const focus = await here(page);
    return focus.inGrid ? focus : null;
  }, "Tab 应该进到矩阵里");
  assert.equal(first.name, "合金锭", "停靠点应该是选中的那一格");

  await page.key("Tab");
  await page.waitFor(
    async () => !(await here(page)).inGrid,
    "再按一次 Tab 应该离开矩阵，而不是去下一格",
  );

  await page.key("Tab", { shift: true });
  await page.waitFor(
    async () => (await here(page)).name === "合金锭",
    "Shift+Tab 回来应该还是那一格",
  );
});

test("方向键：左右在同一行，上下落在同一列；Home / End 到行首行尾", async () => {
  const { page } = storybook;
  await page.story(STORY);
  await page.key("Tab");
  const start = await page.waitFor(async () => {
    const focus = await here(page);
    return focus.inGrid ? focus : null;
  }, "Tab 应该进到矩阵里");

  const down = await move(page, "ArrowDown");
  assert.equal(down.left, start.left, "↓ 应该落在同一列");
  assert.ok(down.top > start.top, "↓ 应该到下一行");

  const right = await move(page, "ArrowRight");
  assert.equal(right.top, down.top, "→ 应该留在同一行");
  assert.ok(right.left > down.left, "→ 应该到右边一格");

  const up = await move(page, "ArrowUp");
  assert.equal(up.left, right.left, "↑ 应该落在同一列");
  assert.ok(up.top < right.top, "↑ 应该到上一行");

  const all = await slots(page);
  const row = all.filter((slot) => slot.top === up.top);

  await page.key("End");
  await page.waitFor(
    async () => (await here(page)).name === row.at(-1)!.name,
    "End 应该到这一行的最后一格",
  );
  await page.key("Home");
  await page.waitFor(
    async () => (await here(page)).name === row[0]!.name,
    "Home 应该到这一行的第一格",
  );

  // 行首再按 ←：不折到上一行
  await page.key("ArrowLeft");
  await page.pause(150);
  assert.equal((await here(page)).name, row[0]!.name, "行首按 ← 不应该折行");
});

test("Ctrl+Home / Ctrl+End 到第一格和最后一格；禁用和静态的格子走不到", async () => {
  const { page } = storybook;
  await page.story(STORY);
  await page.key("Tab");
  await page.waitFor(
    async () => (await here(page)).inGrid,
    "Tab 应该进到矩阵里",
  );

  const all = await slots(page);
  assert.ok(
    !all.some((slot) => slot.name === "过期试剂"),
    "禁用的格子不应该在能走到的格子里",
  );

  await page.key("End", { ctrl: true });
  await page.waitFor(
    async () => (await here(page)).name === all.at(-1)!.name,
    "Ctrl+End 应该到最后一个能用的格子",
  );
  await page.key("Home", { ctrl: true });
  await page.waitFor(
    async () => (await here(page)).name === all[0]!.name,
    "Ctrl+Home 应该到第一格",
  );
});

test("方向键走过去的格子有焦点环，回车才选中", async () => {
  const { page } = storybook;
  await page.story(STORY);
  await page.key("Tab");
  await page.waitFor(
    async () => (await here(page)).inGrid,
    "Tab 应该进到矩阵里",
  );
  const moved = await move(page, "ArrowRight");

  await page.waitFor(
    () =>
      page.evaluate(() => {
        const style = getComputedStyle(document.activeElement!);
        return style.outlineStyle === "solid" && style.outlineWidth === "2px";
      }),
    "方向键移过去的格子应该有焦点环",
  );
  const pressed = () =>
    page.evaluate(() => document.activeElement!.getAttribute("aria-pressed"));
  assert.equal(await pressed(), "false", "走过去不等于选中");
  await page.key("Enter");
  await page.waitFor(
    async () => (await pressed()) === "true",
    `回车应该选中${moved.name}`,
  );
});

test("320px 宽：一行的格子变少了，↓ 仍然落在同一列", async () => {
  const { page } = storybook;
  await page.setSize(320, 800);
  try {
    await page.story(STORY);
    await page.key("Tab");
    const start = await page.waitFor(async () => {
      const focus = await here(page);
      return focus.inGrid ? focus : null;
    }, "Tab 应该进到矩阵里");
    const down = await move(page, "ArrowDown");
    assert.equal(down.left, start.left);
    assert.ok(down.top > start.top);
  } finally {
    await page.setSize(1200, 800);
  }
});
