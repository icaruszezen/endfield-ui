// 月历与日期选择：键盘网格、只占一个 Tab 停靠点、今天和选中的记号、面板的开合与焦点、表单值、窄屏
import assert from "node:assert/strict";
import { test } from "node:test";
import { useStorybook, type Page } from "./lib/harness.ts";

const storybook = useStorybook();

const PANEL = "[role=dialog]";

const title = (page: Page) =>
  page.evaluate(() => {
    const grid = document.querySelector("[role=grid]")!;
    return (
      document.getElementById(grid.getAttribute("aria-labelledby")!)
        ?.textContent ?? ""
    );
  });

/** 焦点现在在哪一天上；不在月历里是 null */
const focusedDate = (page: Page) =>
  page.evaluate(
    () => document.activeElement?.getAttribute("data-date") ?? null,
  );

const selectedDate = (page: Page) =>
  page.evaluate(
    () =>
      document
        .querySelector("[role=gridcell][aria-selected=true] [data-date]")
        ?.getAttribute("data-date") ?? null,
  );

const waitDate = (page: Page, date: string, message: string) =>
  page.waitFor(async () => (await focusedDate(page)) === date, message);

test("月历：六行七列、格子 40px 见方；整个网格只占一个 Tab 停靠点", async () => {
  const { page } = storybook;
  await page.story("控件-calendar-月历--playground");
  const grid = await page.evaluate(() => {
    const days = [...document.querySelectorAll("#storybook-root [data-date]")];
    const rect = days[0]!.getBoundingClientRect();
    return {
      rows: document.querySelectorAll("#storybook-root tbody tr").length,
      days: days.length,
      size: [Math.round(rect.width), Math.round(rect.height)],
      stops: days.filter((day) => day.getAttribute("tabindex") === "0").length,
    };
  });
  assert.deepEqual(grid, { rows: 6, days: 42, size: [40, 40], stops: 1 });

  // Tab：上个月 → 下个月 → 今天；再按一次就离开月历了
  await page.key("Tab");
  await page.waitFocused("button:上个月");
  await page.key("Tab");
  await page.waitFocused("button:下个月");
  await page.key("Tab");
  await waitDate(page, "2026-10-09", "Tab 进网格应该落在今天");
  await page.key("Tab");
  assert.equal(await focusedDate(page), null, "再按 Tab 应该离开月历");
});

test("月历键盘：方向键走一天 / 一周，Home / End，走出这个月时月历跟着翻", async () => {
  const { page } = storybook;
  await page.story("控件-calendar-月历--playground");
  await page.evaluate(() =>
    document
      .querySelector<HTMLElement>('#storybook-root [data-date="2026-10-09"]')!
      .focus(),
  );
  await page.key("ArrowRight");
  await waitDate(page, "2026-10-10", "→ 走一天");
  await page.key("ArrowDown");
  await waitDate(page, "2026-10-17", "↓ 走一周");
  await page.key("Home");
  await waitDate(page, "2026-10-12", "Home 到这一周的星期一");
  await page.key("End");
  await waitDate(page, "2026-10-18", "End 到这一周的星期日");

  await page.key("ArrowDown");
  await page.key("ArrowDown");
  await waitDate(page, "2026-11-01", "↓ 两次走到下个月");
  assert.equal(await title(page), "2026年11月", "月历应该跟着翻到十一月");

  await page.key("PageDown");
  await waitDate(page, "2026-12-01", "PageDown 换到下个月的同一天");
  await page.key("PageUp", { shift: true });
  await waitDate(page, "2025-12-01", "Shift+PageUp 回到去年");
  assert.equal(await title(page), "2025年12月");
});

test("月历：回车选中焦点所在的那一天；选中和今天的记号在两个主题下都看得见", async () => {
  const { page } = storybook;
  for (const theme of ["light", "dark"] as const) {
    await page.story("控件-calendar-月历--playground", theme);
    await page.evaluate(() =>
      document
        .querySelector<HTMLElement>('#storybook-root [data-date="2026-10-09"]')!
        .focus(),
    );
    await page.key("ArrowRight");
    await waitDate(page, "2026-10-10", "→");
    await page.key("Enter");
    await page.waitFor(
      async () => (await selectedDate(page)) === "2026-10-10",
      "回车应该选中 10 号",
    );
    // 颜色是过渡过去的，等它到位
    await page.frames();
    const look = await page.evaluate(() => {
      const fill = (date: string) =>
        getComputedStyle(document.querySelector(`[data-date="${date}"]`)!)
          .backgroundColor;
      const mark = getComputedStyle(
        document.querySelector('[data-date="2026-10-09"]')!,
        "::after",
      );
      return {
        selected: fill("2026-10-10"),
        plain: fill("2026-10-12"),
        today: { color: mark.backgroundColor, width: mark.width },
      };
    });
    assert.notEqual(look.selected, look.plain, `${theme}：选中的格子应该换底`);
    assert.equal(look.today.width, "12px", `${theme}：今天下面应该有一条短线`);
    assert.notEqual(look.today.color, "rgba(0, 0, 0, 0)", theme);
  }
});

test("月历：范围外的日子点了没用，键盘走到范围外被夹回来，翻月钮到头禁用", async () => {
  const { page } = storybook;
  await page.story("控件-calendar-月历--range");
  assert.equal(await selectedDate(page), "2026-10-12");
  await page.click('#storybook-root [data-date="2026-10-26"]');
  await page.pause(150);
  assert.equal(await selectedDate(page), "2026-10-12", "范围外的日子选不了");

  await page.evaluate(() =>
    document
      .querySelector<HTMLElement>('#storybook-root [data-date="2026-10-12"]')!
      .focus(),
  );
  await page.key("PageDown");
  await waitDate(page, "2026-10-23", "PageDown 走到范围外应该被夹回最后一天");
  assert.equal(await title(page), "2026年10月");
  assert.deepEqual(
    await page.evaluate(() =>
      [
        ...document.querySelectorAll<HTMLButtonElement>(
          "#storybook-root button[aria-label$=月]",
        ),
      ].map((button) => button.disabled),
    ),
    [true, true],
    "前后两个月都在范围外，两个翻月钮都应该禁用",
  );
});

test("日期选择：点开是一块面板，落在外框下方左对齐；焦点在选中的那一天", async () => {
  const { page } = storybook;
  await page.story("控件-datepicker-日期选择--in-form");
  await page.click("#storybook-root button[aria-haspopup]");
  await page.waitVisible(PANEL);
  await waitDate(page, "2026-10-12", "打开后焦点应该在选中的那一天");

  // 面板进场时从外框那一侧挪过来 4px：等它落稳再量
  await page.settled(PANEL);
  const placed = await page.evaluate(() => {
    const box = document
      .querySelector("#storybook-root [data-variant]")!
      .getBoundingClientRect();
    const panel = document
      .querySelector("[role=dialog]")!
      .getBoundingClientRect();
    return {
      below: Math.round(panel.top - box.bottom),
      left: Math.round(panel.left - box.left),
    };
  });
  assert.deepEqual(placed, { below: 4, left: 0 });
});

test("日期选择：键盘选一天，面板关上，焦点回到触发按钮，表单里是 YYYY-MM-DD", async () => {
  const { page } = storybook;
  await page.story("控件-datepicker-日期选择--in-form");
  await page.key("Tab");
  await page.waitFocused(/^button:.*2026\.10\.12/);
  await page.key("Enter");
  await page.waitVisible(PANEL);
  await waitDate(page, "2026-10-12", "打开后焦点应该在选中的那一天");
  await page.key("ArrowDown");
  await page.key("ArrowRight");
  await waitDate(page, "2026-10-20", "↓ → 走到 20 号");
  await page.key("Enter");
  await page.waitGone(PANEL, "选了之后面板应该关上");
  await page.waitFocused(/^button:.*2026\.10\.20/, "焦点应该回到触发按钮");

  await page.click("text=提交");
  await page.waitFor(
    async () =>
      (await page.text("#storybook-root [role=status]"))[0] === "2026-10-20",
    "提交的值应该是 2026-10-20",
  );
});

test("日期选择：Esc 关闭不改值；面板里的今天和清除", async () => {
  const { page } = storybook;
  await page.story("控件-datepicker-日期选择--in-form");
  const shown = async () =>
    (await page.text("#storybook-root button[aria-haspopup]"))[0] ?? "";
  const open = async () => {
    await page.click("#storybook-root button[aria-haspopup]");
    await page.waitVisible(PANEL);
  };

  await open();
  await waitDate(page, "2026-10-12", "焦点进月历");
  await page.key("ArrowRight");
  await page.key("Escape");
  await page.waitGone(PANEL);
  assert.equal(await shown(), "2026.10.12", "Esc 不应该改值");

  await open();
  await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>("[role=dialog] button")]
      .find((button) => button.textContent === "今天")!
      .click(),
  );
  await page.waitGone(PANEL);
  await page.waitFor(
    async () => (await shown()) === "2026.10.09",
    "点今天应该选中今天",
  );

  await open();
  await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>("[role=dialog] button")]
      .find((button) => button.textContent === "清除")!
      .click(),
  );
  await page.waitGone(PANEL);
  await page.waitFor(
    async () => (await shown()) === "选择日期",
    "点清除应该回到提示",
  );
});

test("起止日期：终点的月历里，起点之前的日子不可选；起点挪到终点后面，终点跟过去", async () => {
  const { page } = storybook;
  await page.story("控件-datepicker-日期选择--start-and-end");
  const shown = () => page.text("#storybook-root button[aria-haspopup]");
  assert.deepEqual(await shown(), ["2026.10.12", "2026.10.16"]);

  await page.evaluate(() =>
    document
      .querySelectorAll<HTMLElement>(
        "#storybook-root button[aria-haspopup]",
      )[1]!
      .click(),
  );
  await page.waitVisible(PANEL);
  assert.deepEqual(
    await page.evaluate(() =>
      ["2026-10-11", "2026-10-12"].map((date) =>
        document
          .querySelector(`[role=dialog] [data-date="${date}"]`)!
          .getAttribute("aria-disabled"),
      ),
    ),
    ["true", null],
    "起点之前不可选，起点当天可以",
  );
  await page.key("Escape");
  await page.waitGone(PANEL);

  await page.evaluate(() =>
    document
      .querySelectorAll<HTMLElement>(
        "#storybook-root button[aria-haspopup]",
      )[0]!
      .click(),
  );
  await page.waitVisible(PANEL);
  await page.click(`${PANEL} [data-date="2026-10-22"]`);
  await page.waitGone(PANEL);
  await page.waitFor(
    async () => (await shown()).join() === "2026.10.22,2026.10.22",
    "起点挪到 22 号，终点应该跟到 22 号",
  );
});

test("320px 宽：面板整个在视口里，页面不横向滚动", async () => {
  const { page } = storybook;
  await page.setSize(320, 760);
  try {
    await page.story("控件-datepicker-日期选择--in-field");
    await page.click("#storybook-root button[aria-haspopup]");
    await page.waitVisible(PANEL);
    const fit = await page.evaluate(() => {
      const rect = document
        .querySelector("[role=dialog]")!
        .getBoundingClientRect();
      return {
        inside: rect.left >= 0 && rect.right <= innerWidth,
        pageScrolls:
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth,
      };
    });
    assert.deepEqual(fit, { inside: true, pageScrolls: false });
  } finally {
    await page.setSize(1200, 800);
  }
});
