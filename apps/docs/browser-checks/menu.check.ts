// 下拉菜单：键盘开合与移动、按字母跳转、指针高亮、单选组、贴边不出视口
import assert from "node:assert/strict";
import { test } from "node:test";
import { useStorybook, type Page } from "./lib/harness.ts";

const storybook = useStorybook();

const MENU = "[role=menu]";
const TRIGGER = "button[aria-haspopup]";

/** 焦点直接放到触发按钮上再回车：键盘打开的菜单，焦点会落在第一项 */
async function openWithKeyboard(page: Page) {
  await page.evaluate(() =>
    document.querySelector<HTMLElement>("button[aria-haspopup]")!.focus(),
  );
  await page.key("Enter");
  await page.waitVisible(MENU);
}

test("键盘：回车打开，方向键循环（禁用项也走得到），Home / End，Esc 关闭后焦点回到触发按钮", async () => {
  const { page } = storybook;
  await page.story("控件-dropdownmenu-下拉菜单--playground");

  await page.key("Tab");
  await page.waitFocused("button:更多操作");
  await page.key("Enter");
  await page.waitVisible(MENU);
  await page.waitFocused("menuitem:复制一份", "打开后焦点应该在第一项");

  const walk: string[] = [];
  for (let i = 0; i < 5; i++) {
    await page.key("ArrowDown");
    walk.push(await page.focused());
  }
  assert.deepEqual(walk, [
    // 行尾的快捷键也算在文字里
    "menuitem:锁定L",
    // 禁用项读屏要能读到，所以键盘走得到
    "menuitem:移动到…",
    "menuitem:查看详情",
    "menuitem:销毁",
    "menuitem:复制一份",
  ]);

  await page.key("End");
  assert.equal(await page.focused(), "menuitem:销毁");
  await page.key("Home");
  assert.equal(await page.focused(), "menuitem:复制一份");

  await page.key("Escape");
  await page.waitGone(MENU);
  await page.waitFocused("button:更多操作", "关闭后焦点应该回到触发按钮");
});

test("按字母跳到以它开头的项", async () => {
  const { page } = storybook;
  await page.story("控件-dropdownmenu-下拉菜单--language");
  await openWithKeyboard(page);
  await page.key("e");
  await page.waitFocused("menuitemradio:English");
});

test("指针经过的项被高亮；点外面关闭", async () => {
  const { page } = storybook;
  await page.story("控件-dropdownmenu-下拉菜单--playground");
  await page.click("text=更多操作");
  await page.waitVisible(MENU);

  // 菜单里唯一的链接项
  await page.moveTo("a[role=menuitem]");
  await page.waitFor(
    () =>
      page.evaluate(
        () =>
          document.querySelector("[data-highlighted]")?.textContent ===
          "查看详情",
      ),
    "指针经过的项没有被高亮",
  );

  await page.click({ x: 700, y: 500 });
  await page.waitGone(MENU);
});

test("单选组：选了之后菜单关上，再打开时它是当前项", async () => {
  const { page } = storybook;
  await page.story("控件-dropdownmenu-下拉菜单--sorting");
  await openWithKeyboard(page);
  await page.waitFocused("menuitemradio:按数量");
  await page.key("ArrowDown");
  await page.key("Enter");
  await page.waitGone(MENU, "选了之后菜单应该关上");
  await page.waitFor(
    async () => (await page.text(TRIGGER))[0]?.includes("按稀有度"),
    "触发按钮上应该写着新选的排序方式",
  );

  await openWithKeyboard(page);
  assert.deepEqual(await page.text("[role=menuitemradio][aria-checked=true]"), [
    "按稀有度",
  ]);
});

test("触发按钮贴近右边缘时，面板不出视口", async () => {
  const { page } = storybook;
  await page.story("控件-dropdownmenu-下拉菜单--playground");
  await page.evaluate(() => {
    document.querySelector<HTMLElement>(
      "button[aria-haspopup]",
    )!.style.marginLeft = `${innerWidth - 110}px`;
  });
  await page.click(TRIGGER);
  await page.waitVisible(MENU);
  assert.ok(
    await page.evaluate(() => {
      const rect = document
        .querySelector("[role=menu]")!
        .getBoundingClientRect();
      return rect.left >= 0 && rect.right <= innerWidth;
    }),
    "面板超出了视口",
  );
});

const menus = (page: Page) =>
  page.evaluate(
    () =>
      [...document.querySelectorAll("[role=menu]")].filter(
        (menu) => menu.getBoundingClientRect().height > 0,
      ).length,
  );

test("复选项：空格切换，菜单不关", async () => {
  const { page } = storybook;
  await page.story("控件-dropdownmenu-下拉菜单--view-options");
  await openWithKeyboard(page);
  await page.waitFocused("menuitemcheckbox:缩略图");

  const checked = () =>
    page.evaluate(() => document.activeElement?.getAttribute("aria-checked"));
  assert.equal(await checked(), "true");
  await page.key("Space");
  await page.waitFor(
    async () => (await checked()) === "false",
    "空格应该把勾去掉",
  );
  assert.ok(await page.visible(MENU), "勾选之后菜单不应该关");
});

test("子菜单：方向键右打开并进到第一项，左收起并回到这一行", async () => {
  const { page } = storybook;
  await page.story("控件-dropdownmenu-下拉菜单--view-options");
  await openWithKeyboard(page);
  // 缩略图 → 紧凑行距 → 按类别分组（禁用）→ 导出为
  for (let i = 0; i < 3; i++) await page.key("ArrowDown");
  await page.waitFocused("menuitem:导出为");
  assert.equal(await menus(page), 1);

  await page.key("ArrowRight");
  await page.waitFor(async () => (await menus(page)) === 2, "子菜单没有打开");
  await page.waitFocused("menuitem:表格（CSV）", "焦点应该进到子菜单的第一项");

  // 子面板进场时从这一行那一侧挪过来 4px：等它落稳再量
  await page.settled();
  const layout = await page.evaluate(() => {
    const [main, sub] = [...document.querySelectorAll("[role=menu]")].map(
      (menu) => menu.getBoundingClientRect(),
    );
    const row = [...document.querySelectorAll("[role=menuitem]")]
      .find((item) => item.textContent === "导出为")!
      .getBoundingClientRect();
    const first = document.activeElement!.getBoundingClientRect();
    return {
      beside: sub!.left >= main!.right - 1,
      rowsAligned: Math.abs(first.top - row.top) < 1.5,
    };
  });
  assert.deepEqual(layout, { beside: true, rowsAligned: true });

  await page.key("ArrowLeft");
  await page.waitFor(async () => (await menus(page)) === 1, "子菜单没有收起");
  await page.waitFocused("menuitem:导出为");

  await page.key("Escape");
  await page.waitGone(MENU);
});

test("子菜单：指针停在这一行上就打开；右边放不下时翻到左边", async () => {
  const { page } = storybook;
  await page.story("控件-dropdownmenu-下拉菜单--view-options");
  await page.evaluate(() => {
    document.querySelector<HTMLElement>(
      "button[aria-haspopup]",
    )!.style.marginLeft = `${innerWidth - 260}px`;
  });
  await page.click(TRIGGER);
  await page.waitVisible(MENU);
  await page.moveTo("[role=menuitem][aria-haspopup]");
  await page.waitFor(async () => (await menus(page)) === 2, "子菜单没有打开");

  assert.ok(
    await page.evaluate(() =>
      [...document.querySelectorAll("[role=menu]")].every((menu) => {
        const rect = menu.getBoundingClientRect();
        return rect.left >= 0 && rect.right <= innerWidth;
      }),
    ),
    "子菜单超出了视口",
  );
});
