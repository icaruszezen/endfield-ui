// 展开条：横向的键盘、贴着触发按钮并排成一条、靠右时向左展开、触发按钮保持按下的样子
import assert from "node:assert/strict";
import { test } from "node:test";
import { useStorybook, type Page } from "./lib/harness.ts";

const storybook = useStorybook();

const BAR = "[role=menu]";
const TRIGGER = "button[aria-haspopup]";

/** 横条和触发按钮的相对位置 */
const layout = (page: Page) =>
  page.evaluate(() => {
    const bar = document.querySelector("[role=menu]")!.getBoundingClientRect();
    const trigger = document
      .querySelector("button[aria-haspopup]")!
      .getBoundingClientRect();
    return {
      side: document.querySelector("[role=menu]")!.getAttribute("data-side"),
      touching:
        Math.abs(bar.left - trigger.right) < 1 ||
        Math.abs(bar.right - trigger.left) < 1,
      sameHeight:
        Math.abs(bar.top - trigger.top) < 1 &&
        Math.abs(bar.height - trigger.height) < 1,
      inViewport: bar.left >= 0 && bar.right <= innerWidth,
    };
  });

test("键盘：回车打开并进到第一项，左右方向键移动，Esc 关闭后回到触发按钮", async () => {
  const { page } = storybook;
  await page.story("控件-flyoutbar-展开条--playground");

  await page.key("Tab");
  await page.waitFocused("button:分享");
  await page.key("Enter");
  await page.waitVisible(BAR);
  await page.waitFocused("menuitem:复制链接");

  await page.key("ArrowRight");
  assert.equal(await page.focused(), "menuitem:显示二维码");
  await page.key("ArrowRight");
  assert.equal(await page.focused(), "menuitem:发邮件");
  await page.key("ArrowLeft");
  assert.equal(await page.focused(), "menuitem:显示二维码");
  // 上下方向键不归它管：横条只有一行
  await page.key("ArrowDown");
  assert.equal(await page.focused(), "menuitem:显示二维码");

  await page.key("Escape");
  await page.waitGone(BAR);
  await page.waitFocused("button:分享", "关闭后焦点应该回到触发按钮");
});

test("横条贴着触发按钮、和它一样高；开着的时候触发按钮保持墨底", async () => {
  const { page } = storybook;
  await page.story("控件-flyoutbar-展开条--playground");
  const idle = await page.evaluate(
    () =>
      getComputedStyle(document.querySelector("button[aria-haspopup]")!)
        .backgroundColor,
  );

  await page.click(TRIGGER);
  await page.waitVisible(BAR);
  assert.deepEqual(await layout(page), {
    side: "right",
    touching: true,
    sameHeight: true,
    inViewport: true,
  });

  // 指针移开，按钮仍然是按下的样子
  await page.moveTo({ x: 700, y: 500 });
  await page.waitFor(
    () =>
      page.evaluate(
        (before) =>
          getComputedStyle(document.querySelector("button[aria-haspopup]")!)
            .backgroundColor !== before,
        idle,
      ),
    "横条开着的时候触发按钮应该保持墨底",
  );

  await page.click({ x: 700, y: 500 });
  await page.waitGone(BAR);
});

test("靠右边缘时向左展开，仍然贴着触发按钮", async () => {
  const { page } = storybook;
  await page.story("控件-flyoutbar-展开条--left-side");
  await page.click(TRIGGER);
  await page.waitVisible(BAR);
  assert.deepEqual(await layout(page), {
    side: "left",
    touching: true,
    sameHeight: true,
    inViewport: true,
  });
});

test("右边放不下时自己翻到左边", async () => {
  const { page } = storybook;
  await page.story("控件-flyoutbar-展开条--playground");
  await page.evaluate(() => {
    document.querySelector<HTMLElement>(
      "button[aria-haspopup]",
    )!.style.marginLeft = `${innerWidth - 100}px`;
  });
  await page.click(TRIGGER);
  await page.waitVisible(BAR);
  assert.deepEqual(await layout(page), {
    side: "left",
    touching: true,
    sameHeight: true,
    inViewport: true,
  });
});

test("点一项：执行并收起", async () => {
  const { page } = storybook;
  await page.story("控件-flyoutbar-展开条--feedback");
  await page.click(TRIGGER);
  await page.waitVisible(BAR);
  await page.click("[role=menuitem]");
  await page.waitGone(BAR);
  assert.deepEqual(await page.text("[role=status]"), ["已复制链接"]);
});
