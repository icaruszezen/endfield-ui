// 数据行带与深色行带：各行对齐到同一组列、容器变窄时收列、收藏按钮的键盘、选中行的反转
import assert from "node:assert/strict";
import { test } from "node:test";
import { useStorybook, type Page } from "./lib/harness.ts";

const storybook = useStorybook();

/** 每一行里看得见的单元格的左右边界 */
const edges = (page: Page, table = 0) =>
  page.evaluate((index) => {
    const rows = [
      ...document
        .querySelectorAll("[role=table]")
        [index]!.querySelectorAll("[role=row]"),
    ];
    return rows.map((row) =>
      [
        ...row.querySelectorAll(
          "[role=columnheader], [role=rowheader], [role=cell]",
        ),
      ]
        .map((cell) => cell.getBoundingClientRect())
        .filter((rect) => rect.width > 0)
        .map((rect) => [Math.round(rect.left), Math.round(rect.right)]),
    );
  }, table);

/** 这个元素的底色有多亮（0–255） */
const brightness = (page: Page, selector: string) =>
  page.evaluate((css) => {
    const [red = 0, green = 0, blue = 0] = (
      getComputedStyle(document.querySelector(css)!).backgroundColor.match(
        /[\d.]+/g,
      ) ?? []
    ).map(Number);
    return (red + green + blue) / 3;
  }, selector);

test("数据行带：列头和每一行对齐到同一组列", async () => {
  const { page } = storybook;
  await page.story("控件-datarow-数据行带--playground");
  const rows = await edges(page);
  assert.equal(rows.length, 4, "应该是一行列头加三行数据");
  assert.equal(rows[0]!.length, 4, "宽的时候四列都在");
  for (const row of rows.slice(1)) {
    assert.deepEqual(row, rows[0], "这一行没有和列头对齐");
  }
});

test("数据行带：容器变窄时先收起走势列，再收起参考值列", async () => {
  const { page } = storybook;
  await page.story("控件-datarow-数据行带--narrow");
  const headers = (table: number) =>
    page.evaluate(
      (index) =>
        [
          ...document
            .querySelectorAll("[role=table]")
            [index]!.querySelectorAll("[role=columnheader]"),
        ]
          .filter((cell) => cell.getBoundingClientRect().width > 0)
          .map((cell) => cell.textContent),
      table,
    );
  assert.deepEqual(await headers(0), ["项目", "当前", "理论"]);
  assert.deepEqual(await headers(1), ["项目", "当前"]);

  // 收掉的列在每一行里也收掉了，剩下的仍然对齐
  for (const table of [0, 1]) {
    const rows = await edges(page, table);
    for (const row of rows.slice(1)) assert.deepEqual(row, rows[0]);
  }

  // 名称很长时截断，数值不被挤出去
  assert.ok(
    await page.evaluate(() => {
      const table = document.querySelectorAll("[role=table]")[2]!;
      const canvas = table.parentElement!.getBoundingClientRect();
      // 走势和参考值两格在这个宽度下收起了，剩下的那一格就是当前值
      const value = [...table.querySelectorAll("[role=cell]")]
        .map((cell) => cell.getBoundingClientRect())
        .find((rect) => rect.width > 0);
      const name = table.querySelector("[role=rowheader] span:last-child")!;
      return (
        !!value &&
        value.right <= canvas.right &&
        name.scrollWidth > name.clientWidth
      );
    }),
    "长名称应该被截断，数值留在画布里",
  );
});

test("数据行带：收藏按钮能用键盘切换，并报出状态", async () => {
  const { page } = storybook;
  await page.story("控件-datarow-数据行带--playground");
  await page.key("Tab");
  await page.waitFocused("button:收藏钢材");

  const pressed = () =>
    page.evaluate(() => document.activeElement?.getAttribute("aria-pressed"));
  assert.equal(await pressed(), "true");
  await page.key("Space");
  await page.waitFor(
    async () => (await pressed()) === "false",
    "空格应该取消收藏",
  );
  await page.key("Enter");
  await page.waitFor(
    async () => (await pressed()) === "true",
    "回车应该重新收藏",
  );

  // 点击区比看得见的圆大
  assert.ok(
    await page.evaluate(() => {
      const button = document.activeElement!;
      const dot = button.firstElementChild!.getBoundingClientRect();
      const hit = document.elementFromPoint(dot.left - 8, dot.top - 8);
      return hit === button || button.contains(hit);
    }),
    "收藏按钮的点击区应该比 16px 的圆大",
  );
});

test("数据行带：两个主题下行带都是深色的，暗色页面上有边线和画布分开", async () => {
  const { page } = storybook;
  for (const theme of ["light", "dark"] as const) {
    await page.story("控件-datarow-数据行带--playground", theme);
    assert.ok(
      (await brightness(page, "[role=row][data-theme=dark]")) < 60,
      `${theme}：行带应该是深色的`,
    );
  }
  assert.notEqual(
    await page.evaluate(() => {
      const style = getComputedStyle(
        document.querySelector("[role=row][data-theme=dark]")!,
      );
      return style.borderTopColor === style.backgroundColor;
    }),
    true,
    "行带的边线和底色不应该是同一个颜色",
  );
});

test("列表的深色行带：点一行，它反转成白底，原来那行变回深色", async () => {
  const { page } = storybook;
  await page.story("控件-list-列表行--band");

  const themes = () =>
    page.evaluate(() =>
      // Storybook 自己藏着的几块提示里也有 <li>，所以限定在画布里
      [...document.querySelectorAll("#storybook-root li")].map(
        (row) => (row as HTMLElement).dataset.theme,
      ),
    );
  assert.deepEqual(await themes(), ["dark", "light", "dark", "dark"]);
  assert.ok((await brightness(page, "li[data-theme=light] button")) > 240);
  assert.ok((await brightness(page, "li[data-theme=dark] button")) < 60);

  await page.click("#storybook-root li:nth-of-type(4) button");
  await page.waitFor(
    async () =>
      (await themes()).join() === ["dark", "dark", "dark", "light"].join(),
    "点了第四行之后它应该是选中的那一行",
  );
  assert.deepEqual(
    await page.text("#storybook-root li button[aria-pressed=true]"),
    [
      await page.evaluate(
        () =>
          document.querySelector("#storybook-root li:nth-of-type(4) button")!
            .textContent,
      ),
    ],
  );
});
