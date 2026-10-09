// 正常动效下进出场真的有过渡，过渡走完后停在终态、关闭后被卸载；"减少动态效果"下没有过渡。
// 状态的记号（勾、细线、连线、括号、填入的字）也在这里。断言三件事：声明了什么过渡（计算样式）、
// 它真的跑过（浏览器发的 transitionrun / animationstart）、走完之后停在哪——都不靠"正好量到一半"
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

/** 这个元素（或它的伪元素）上声明的过渡：属性名 → 时长（秒）。元素不在时是 null */
const transitions = (page: Page, selector: string, pseudo?: string) =>
  page.evaluate(
    (css, pseudoElement) => {
      const element = document.querySelector(css);
      if (!element) return null;
      const style = getComputedStyle(element, pseudoElement);
      const durations = style.transitionDuration
        .split(",")
        .map((value) => Number.parseFloat(value));
      return Object.fromEntries(
        style.transitionProperty
          .split(",")
          .map((property, index) => [
            property.trim(),
            durations[index % durations.length]!,
          ]),
      );
    },
    selector,
    pseudo ?? null,
  );

/**
 * 从现在起记下这个范围里（含后代和伪元素）跑起来的过渡与动画。
 * 记的是浏览器自己发的事件，过渡再短也漏不掉；写成 `属性名` 或 `动画名`，
 * 伪元素上的带后缀（`scale::before`）。换一页之后要重新开始记
 */
const record = (page: Page, selector: string) =>
  page.evaluate((css) => {
    const seen: string[] = [];
    (window as unknown as { motionLog: string[] }).motionLog = seen;
    const root = document.querySelector(css)!;
    root.addEventListener("transitionrun", (event) => {
      const { propertyName, pseudoElement } = event as TransitionEvent;
      seen.push(`${propertyName}${pseudoElement}`);
    });
    root.addEventListener("animationstart", (event) => {
      const { animationName, pseudoElement } = event as AnimationEvent;
      seen.push(`${animationName}${pseudoElement}`);
    });
  }, selector);

/** 读出记到的，并清空 */
const recorded = (page: Page) =>
  page.evaluate(() =>
    (window as unknown as { motionLog: string[] }).motionLog.splice(0),
  );

/** 关掉"减少动态效果"跑一段；跑完不管成没成都开回去 */
async function withMotion(page: Page, run: () => Promise<void>) {
  await page.setReducedMotion(false);
  try {
    await run();
  } finally {
    await page.setReducedMotion(true);
  }
}

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

test("复选与单选：记号淡入淡出（200ms），走完停在终态", async () => {
  const { page } = storybook;
  // 第一个复选框是没选的；勾紧跟在 <input> 后面
  const ROW = "#storybook-root label:first-of-type";
  const MARK = `${ROW} input + svg`;
  /** 写着这几个字的那一行里，记号的不透明度 */
  const markOf = (text: string) =>
    page.evaluate((label) => {
      const row = [...document.querySelectorAll("#storybook-root label")].find(
        (element) => element.textContent === label,
      )!;
      return Number(getComputedStyle(row.querySelector("input + *")!).opacity);
    }, text);

  await withMotion(page, async () => {
    await page.story("控件-choice-选择控件--checkbox-states");
    assert.deepEqual(await transitions(page, MARK), { opacity: 0.2 });
    assert.equal(await opacity(page, MARK), 0);

    await record(page, MARK);
    await page.click(ROW);
    await page.settled(ROW);
    assert.equal(await opacity(page, MARK), 1, "勾选之后勾应该是不透明的");
    assert.deepEqual(await recorded(page), ["opacity"], "勾应该是过渡出来的");

    await page.click(ROW);
    await page.settled(ROW);
    assert.equal(await opacity(page, MARK), 0, "取消之后勾应该淡出");
    assert.deepEqual(await recorded(page), ["opacity"]);

    // 单选：换一项，新的圆点亮起来，旧的熄掉
    await page.story("控件-choice-选择控件--radio-states");
    assert.deepEqual([await markOf("草图"), await markOf("标准")], [0, 1]);
    await page.click("text=草图");
    await page.settled();
    assert.deepEqual([await markOf("草图"), await markOf("标准")], [1, 0]);
  });

  // 开回"减少动态效果"：还是那个过渡，时长被压到接近零
  const reduced = await transitions(page, "#storybook-root input + span");
  assert.ok(reduced!.opacity! < 0.001, "减少动态效果下记号不该有看得见的过渡");
});
