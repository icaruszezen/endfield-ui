// 气泡卡片：焦点移入但不锁住、不打断页面、Esc 与点外面关闭、里面的表单
import assert from "node:assert/strict";
import { test } from "node:test";
import { useStorybook, type Page } from "./lib/harness.ts";

const storybook = useStorybook();

const PANEL = "[role=dialog]";

const focusInPanel = (page: Page) =>
  page.evaluate(() => !!document.activeElement?.closest("[role=dialog]"));

test("键盘打开后焦点进到面板里；Esc 关闭后回到触发按钮", async () => {
  const { page } = storybook;
  await page.story("控件-popover-气泡卡片--playground");

  await page.key("Tab");
  await page.waitFocused("button:显示设置");
  await page.key("Enter");
  await page.waitVisible(PANEL);
  await page.waitFor(() => focusInPanel(page), "打开后焦点应该进到面板里");

  const name = await page.evaluate(() => {
    const panel = document.querySelector("[role=dialog]")!;
    return document.getElementById(panel.getAttribute("aria-labelledby") ?? "")
      ?.textContent;
  });
  assert.equal(name, "显示", "标题应该是面板的可访问名称");

  await page.key("Escape");
  await page.waitGone(PANEL);
  await page.waitFocused("button:显示设置", "关闭后焦点应该回到触发按钮");
});

test("不是模态：开着的时候页面照常可以滚、可以点；点外面关闭", async () => {
  const { page } = storybook;
  await page.story("控件-popover-气泡卡片--playground");
  await page.click("text=显示设置");
  await page.waitVisible(PANEL);

  const blocked = await page.evaluate(() => ({
    scrollLocked: [document.documentElement, document.body].some(
      (element) => getComputedStyle(element).overflow === "hidden",
    ),
    inert: !!document.querySelector("#storybook-root [inert]"),
  }));
  assert.deepEqual(blocked, { scrollLocked: false, inert: false });

  await page.click({ x: 800, y: 600 });
  await page.waitGone(PANEL);
});

test("面板里的开关能用键盘切换，面板不关", async () => {
  const { page } = storybook;
  await page.story("控件-popover-气泡卡片--playground");
  await page.key("Tab");
  await page.key("Enter");
  await page.waitVisible(PANEL);
  await page.waitFor(() => focusInPanel(page), "焦点没有进到面板里");

  const checked = () =>
    page.evaluate(
      () =>
        (document.activeElement as HTMLInputElement | null)?.checked ?? null,
    );
  const before = await checked();
  assert.notEqual(before, null, "焦点应该落在第一个开关上");
  await page.key("Space");
  assert.equal(await checked(), !before);
  assert.ok(await page.visible(PANEL));
});

test("面板里的表单：回车提交后面板关上，页面跟着更新", async () => {
  const { page } = storybook;
  await page.story("控件-popover-气泡卡片--quick-edit");
  await page.click("text=改名");
  await page.waitVisible(PANEL);
  await page.waitFor(
    () => page.evaluate(() => document.activeElement?.tagName === "INPUT"),
    "焦点应该落在输入框上",
  );

  await page.type("x");
  await page.key("Enter");
  await page.waitGone(PANEL);
  await page.waitFor(
    async () =>
      (await page.text("#storybook-root span")).includes("北岭三号站x"),
    "保存后页面上的名字应该变",
  );
});

test("贴近右边缘、右对齐时面板不出视口", async () => {
  const { page } = storybook;
  await page.story("控件-popover-气泡卡片--placement");
  await page.click("text=显示设置");
  await page.waitVisible(PANEL);
  assert.ok(
    await page.evaluate(() => {
      const rect = document
        .querySelector("[role=dialog]")!
        .getBoundingClientRect();
      return rect.left >= 0 && rect.right <= innerWidth;
    }),
    "面板超出了视口",
  );
});
