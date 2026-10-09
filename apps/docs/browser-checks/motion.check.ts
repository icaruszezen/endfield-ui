// 正常动效下进出场真的有过渡，过渡走完后停在终态、关闭后被卸载；"减少动态效果"下没有过渡
import assert from "node:assert/strict";
import { test } from "node:test";
import { useStorybook, type Page } from "./lib/harness.ts";

const storybook = useStorybook();

/** 这个元素上正在跑的过渡数；元素不在（或藏着）时是 null */
const running = (page: Page, selector: string) =>
  page.evaluate((css) => {
    const element = document.querySelector(css);
    if (!element || element.closest("[hidden]")) return null;
    return element.getAnimations().length;
  }, selector);

const opacity = (page: Page, selector: string) =>
  page.evaluate(
    (css) => Number(getComputedStyle(document.querySelector(css)!).opacity),
    selector,
  );

async function assertAnimatesInAndOut(
  page: Page,
  open: () => Promise<void>,
  selector: string,
  name: string,
) {
  await open();
  await page.waitFor(
    async () => ((await running(page, selector)) ?? 0) > 0,
    `${name}进场没有过渡`,
    2000,
  );
  await page.settled(selector, `${name}的进场过渡没有走完`);
  assert.equal(await opacity(page, selector), 1, `${name}没有停在不透明`);

  await page.key("Escape");
  await page.waitFor(
    async () => (await running(page, selector)) === null,
    `${name}关闭后没有被卸载`,
  );
}

test("弹窗、抽屉、下拉菜单：有进场过渡，关闭后卸载", async () => {
  const { page } = storybook;
  await page.setReducedMotion(false);
  try {
    await page.story("控件-dialog-弹窗--playground");
    await assertAnimatesInAndOut(
      page,
      () => page.click("text=归档"),
      "[role=dialog]",
      "弹窗",
    );

    await page.story("控件-drawer-抽屉--playground");
    await assertAnimatesInAndOut(
      page,
      () => page.click("text=查看详情"),
      "[role=dialog]",
      "抽屉",
    );

    await page.story("控件-dropdownmenu-下拉菜单--playground");
    await assertAnimatesInAndOut(
      page,
      () => page.click("text=更多操作"),
      "[role=menu]",
      "下拉菜单",
    );
  } finally {
    await page.setReducedMotion(true);
  }
});

test("减少动态效果：弹窗直接出现", async () => {
  const { page } = storybook;
  await page.story("控件-dialog-弹窗--playground");
  await page.click("text=归档");
  await page.waitVisible("[role=dialog]");
  const seconds = await page.evaluate(() =>
    Math.max(
      ...getComputedStyle(document.querySelector("[role=dialog]")!)
        .transitionDuration.split(",")
        .map((value) => Number.parseFloat(value)),
    ),
  );
  assert.ok(seconds < 0.001, `过渡时长应该接近零，实际是 ${seconds}s`);
});

test("等动效走完（page.settled）：之后读一次就是终态；循环的动画不会让它挂住", async () => {
  const { page } = storybook;
  await page.setReducedMotion(false);
  try {
    await page.story("控件-dialog-弹窗--playground");
    await page.click("text=归档");
    await page.waitVisible("[role=dialog]");
    await page.settled("[role=dialog]");
    // 不轮询：过渡走完了，读到的就是终点
    assert.equal(await opacity(page, "[role=dialog]"), 1);
    assert.equal(await running(page, "[role=dialog]"), 0);
    await page.key("Escape");
    await page.waitGone("[role=dialog]");

    // 加载指示一直在转。它在页面上，settled 也照样回来
    await page.story("控件-spinner-行内加载指示--playground");
    const spinning = await page.evaluate(
      () =>
        document
          .getAnimations()
          .filter(
            (animation) =>
              animation.effect?.getComputedTiming().iterations === Infinity,
          ).length,
    );
    assert.ok(spinning > 0, "这个 story 里应该有一个循环的动画在跑");
    const started = Date.now();
    await page.settled();
    assert.ok(
      Date.now() - started < 2000,
      "循环的动画不该让 settled 一直等下去",
    );
  } finally {
    await page.setReducedMotion(true);
  }
});
