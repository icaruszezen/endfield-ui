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
