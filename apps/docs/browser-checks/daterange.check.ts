// 日期范围：点两下选一段、预览带、键盘、跨过不可选的日子、面板的开合与焦点、两个表单字段、窄屏
import assert from "node:assert/strict";
import { test } from "node:test";
import { useStorybook, type Page } from "./lib/harness.ts";

const storybook = useStorybook();

const PANEL = "[role=dialog]";
const TRIGGER = "#storybook-root button[aria-haspopup]";

const day = (date: string, scope = "#storybook-root") =>
  `${scope} [data-date="${date}"]`;

/** 现在画出来的那一段：两端、带 aria-selected 的格子、预览带里的格子 */
const range = (page: Page) =>
  page.evaluate(() => {
    const dates = (selector: string) =>
      [...document.querySelectorAll(selector)].map((node) =>
        (node.matches("[data-date]")
          ? node
          : node.querySelector("[data-date]")!
        ).getAttribute("data-date"),
      );
    return {
      start: dates("[data-range-start]")[0] ?? null,
      end: dates("[data-range-end]")[0] ?? null,
      selected: dates("[role=gridcell][aria-selected=true]"),
      preview: dates("[data-preview]"),
    };
  });

const focusedDate = (page: Page) =>
  page.evaluate(
    () => document.activeElement?.getAttribute("data-date") ?? null,
  );

const shown = async (page: Page) => (await page.text(TRIGGER))[0] ?? "";

test("月历选一段：点两下选完，两端和中间都带 aria-selected", async () => {
  const { page } = storybook;
  await page.story("控件-calendar-月历--pick-range");
  const before = await range(page);
  assert.equal(before.start, "2026-10-07");
  assert.equal(before.end, "2026-10-15");
  assert.equal(before.selected.length, 9);

  // 第一下：原来那一段让开，只剩起始日
  await page.click(day("2026-10-20"));
  await page.waitFor(async () => {
    const now = await range(page);
    return now.start === "2026-10-20" && now.selected.length === 1;
  }, "点第一下：只剩刚定的起始日");
  assert.equal(
    (await page.text("#storybook-root [role=status]"))[0],
    "// 2026-10-07 → 2026-10-15",
    "第一下不应该改值",
  );

  await page.click(day("2026-10-23"));
  await page.waitFor(
    async () =>
      (await page.text("#storybook-root [role=status]"))[0] ===
      "// 2026-10-20 → 2026-10-23",
    "点第二下：值换成新的一段",
  );
  assert.deepEqual((await range(page)).selected, [
    "2026-10-20",
    "2026-10-21",
    "2026-10-22",
    "2026-10-23",
  ]);
});

test("月历选一段：后点的那天更早会排成先后；同一天点两下是一天的一段", async () => {
  const { page } = storybook;
  await page.story("控件-calendar-月历--pick-range");
  const status = async () =>
    (await page.text("#storybook-root [role=status]"))[0];

  await page.click(day("2026-10-23"));
  await page.click(day("2026-10-19"));
  await page.waitFor(
    async () => (await status()) === "// 2026-10-19 → 2026-10-23",
    "先点 23 再点 19：应该排成 19 → 23",
  );

  await page.click(day("2026-10-28"));
  await page.click(day("2026-10-28"));
  await page.waitFor(
    async () => (await status()) === "// 2026-10-28 → 2026-10-28",
    "同一天点两下：一天的一段",
  );
  const single = await range(page);
  assert.equal(single.start, "2026-10-28");
  assert.equal(single.end, "2026-10-28");
});

test("月历选一段：两端是实心的块，中间是连着的浅带，和没选的格子分得开（亮暗两套）", async () => {
  const { page } = storybook;
  for (const theme of ["light", "dark"] as const) {
    await page.story("控件-calendar-月历--pick-range", theme);
    await page.frames();
    const look = await page.evaluate(() => {
      const probe = document.createElement("i");
      probe.style.backgroundColor = "var(--ef-surface-inverse)";
      document.body.append(probe);
      const inverse = getComputedStyle(probe).backgroundColor;
      probe.remove();
      const cell = (date: string) =>
        document.querySelector<HTMLElement>(
          `#storybook-root [data-date="${date}"]`,
        )!;
      const fill = (date: string) =>
        getComputedStyle(cell(date)).backgroundColor;
      const a = cell("2026-10-08").getBoundingClientRect();
      const b = cell("2026-10-09").getBoundingClientRect();
      return {
        startIsBlock: fill("2026-10-07") === inverse,
        endIsBlock: fill("2026-10-15") === inverse,
        band: fill("2026-10-08"),
        plain: fill("2026-10-20"),
        // 格子之间没有缝，带子是连着的
        gap: Math.round(b.left - a.right),
        // 今天（9 号）在带子里：短线还在
        todayMark: getComputedStyle(cell("2026-10-09"), "::after").width,
      };
    });
    assert.ok(look.startIsBlock && look.endIsBlock, `${theme}：两端是反转填充`);
    assert.notEqual(look.band, look.plain, `${theme}：中间的带子要看得出来`);
    assert.notEqual(look.band, "rgba(0, 0, 0, 0)", theme);
    assert.equal(look.gap, 0, "带子应该是连着的");
    assert.equal(look.todayMark, "12px", `${theme}：今天的短线还在`);
  }
});

test("月历选一段：起始日定了之后，指针到哪预览带到哪；Esc 取消，回到原来那一段", async () => {
  const { page } = storybook;
  await page.story("控件-calendar-月历--pick-range");
  await page.click(day("2026-10-20"));
  await page.moveTo(day("2026-10-23"));
  await page.waitFor(
    async () =>
      (await range(page)).preview.join() === "2026-10-21,2026-10-22,2026-10-23",
    "指针移到 23 号：21 到 23 是预览带",
  );
  // 往回指
  await page.moveTo(day("2026-10-16"));
  await page.waitFor(
    async () =>
      (await range(page)).preview.join() ===
      "2026-10-16,2026-10-17,2026-10-18,2026-10-19",
    "指针移到 16 号：16 到 19 是预览带",
  );

  await page.key("Escape");
  await page.waitFor(async () => {
    const now = await range(page);
    return (
      now.start === "2026-10-07" &&
      now.end === "2026-10-15" &&
      now.preview.length === 0
    );
  }, "Esc 应该取消这一次，回到原来的 7 → 15");
  assert.equal(
    (await page.text("#storybook-root [role=status]"))[0],
    "// 2026-10-07 → 2026-10-15",
  );
});

test("月历选一段：键盘回车定起始日，方向键走，预览跟着键盘，回车定结束日", async () => {
  const { page } = storybook;
  await page.story("控件-calendar-月历--pick-range");
  await page.evaluate(() =>
    document
      .querySelector<HTMLElement>('#storybook-root [data-date="2026-10-07"]')!
      .focus(),
  );
  await page.key("ArrowDown");
  await page.key("ArrowDown");
  await page.waitFor(
    async () => (await focusedDate(page)) === "2026-10-21",
    "↓ 两次到 21 号",
  );
  await page.key("Enter");
  await page.waitFor(
    async () => (await range(page)).start === "2026-10-21",
    "回车定起始日",
  );
  await page.key("ArrowRight");
  await page.key("ArrowRight");
  await page.waitFor(
    async () => (await range(page)).preview.join() === "2026-10-22,2026-10-23",
    "→ 两次：预览带跟着键盘到 23 号",
  );
  await page.key("Space");
  await page.waitFor(
    async () =>
      (await page.text("#storybook-root [role=status]"))[0] ===
      "// 2026-10-21 → 2026-10-23",
    "空格定结束日",
  );
});

test("月历选一段：两端不能落在不可选的日子上，但一段可以跨过去", async () => {
  const { page } = storybook;
  await page.story("控件-calendar-月历--pick-range-weekdays");
  const before = await range(page);
  // 9 号星期五到 13 号星期二，中间夹着周末
  assert.deepEqual(before.selected, [
    "2026-10-09",
    "2026-10-10",
    "2026-10-11",
    "2026-10-12",
    "2026-10-13",
  ]);
  const weekend = await page.evaluate(() => {
    const cell = document.querySelector<HTMLElement>(
      '#storybook-root [data-date="2026-10-10"]',
    )!;
    const style = getComputedStyle(cell);
    return {
      disabled: cell.getAttribute("aria-disabled"),
      struck: style.textDecorationLine,
      inBand: style.backgroundColor !== "rgba(0, 0, 0, 0)",
    };
  });
  assert.deepEqual(weekend, {
    disabled: "true",
    struck: "line-through",
    inBand: true,
  });

  // 周六定不了起始日
  await page.click(day("2026-10-17"));
  await page.pause(200);
  assert.equal((await range(page)).start, "2026-10-09", "周六不应该能当起始日");

  await page.click(day("2026-10-16"));
  await page.waitFor(
    async () => (await range(page)).start === "2026-10-16",
    "周五可以当起始日",
  );
  // 周日定不了结束日
  await page.click(day("2026-10-18"));
  await page.pause(200);
  assert.equal((await range(page)).end, "2026-10-16", "周日不应该能当结束日");
  await page.click(day("2026-10-19"));
  await page.waitFor(
    async () => (await range(page)).end === "2026-10-19",
    "周一可以当结束日",
  );
});

test("日期范围：点开落在外框下方左对齐，焦点在起始日；点第一下面板不关，第二下才关，焦点回触发按钮", async () => {
  const { page } = storybook;
  await page.story("控件-daterangepicker-日期范围--in-form");
  assert.equal(await shown(page), "2026.10.12–至2026.10.16");
  await page.click(TRIGGER);
  await page.waitVisible(PANEL);
  await page.waitFor(
    async () => (await focusedDate(page)) === "2026-10-12",
    "打开后焦点应该在起始日",
  );
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

  await page.click(day("2026-10-20", PANEL));
  await page.waitFor(
    async () => (await range(page)).start === "2026-10-20",
    "点第一下定起始日",
  );
  await page.pause(300);
  assert.ok(await page.visible(PANEL), "只定了起始日，面板不应该关");
  assert.equal(await shown(page), "2026.10.12–至2026.10.16", "值还没变");

  await page.click(day("2026-10-23", PANEL));
  await page.waitGone(PANEL, "结束日选完面板应该关上");
  await page.waitFor(
    async () => (await shown(page)) === "2026.10.20–至2026.10.23",
    "外框里应该是新的一段",
  );
  await page.waitFocused(/^button:.*2026\.10\.20/, "焦点应该回到触发按钮");
});

test("日期范围：键盘选一段；起止两天各一个表单字段", async () => {
  const { page } = storybook;
  await page.story("控件-daterangepicker-日期范围--in-form");
  await page.key("Tab");
  await page.waitFocused(/^button:.*2026\.10\.12/);
  await page.key("Enter");
  await page.waitVisible(PANEL);
  await page.waitFor(
    async () => (await focusedDate(page)) === "2026-10-12",
    "打开后焦点在起始日",
  );
  await page.key("ArrowRight");
  await page.key("Enter");
  await page.waitFor(
    async () => (await range(page)).start === "2026-10-13",
    "→ 回车：13 号是起始日",
  );
  await page.key("ArrowDown");
  await page.waitFor(
    async () => (await focusedDate(page)) === "2026-10-20",
    "↓ 到 20 号",
  );
  await page.key("Enter");
  await page.waitGone(PANEL, "回车定结束日，面板关上");
  await page.waitFocused(/^button:.*2026\.10\.13/, "焦点回到触发按钮");

  await page.click("text=提交");
  await page.waitFor(
    async () =>
      (await page.text("#storybook-root [role=status]"))[0] ===
      "from=2026-10-13&to=2026-10-20",
    "提交的应该是起止两个字段",
  );
});

test("日期范围：只定了起始日就按 Esc，面板关上、值不变；清除回到提示", async () => {
  const { page } = storybook;
  await page.story("控件-daterangepicker-日期范围--in-form");
  await page.click(TRIGGER);
  await page.waitVisible(PANEL);
  await page.click(day("2026-10-27", PANEL));
  await page.waitFor(
    async () => (await range(page)).start === "2026-10-27",
    "定了起始日",
  );
  await page.key("Escape");
  await page.waitGone(PANEL);
  assert.equal(await shown(page), "2026.10.12–至2026.10.16", "Esc 不应该改值");

  // 再打开：画的还是原来那一段，上次没选完的不留着
  await page.click(TRIGGER);
  await page.waitVisible(PANEL);
  assert.equal((await range(page)).start, "2026-10-12");
  const footer = await page.evaluate(() => {
    const panel = document.querySelector("[role=dialog]")!;
    return {
      buttons: [
        ...panel.querySelectorAll(":scope > div:last-child button"),
      ].map((button) => button.textContent),
      hint: panel.querySelector(":scope > div:last-child p")?.textContent,
    };
  });
  assert.deepEqual(footer, {
    buttons: ["清除"],
    hint: "先选起始日，再选结束日",
  });
  await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>("[role=dialog] button")]
      .find((button) => button.textContent === "清除")!
      .click(),
  );
  await page.waitGone(PANEL);
  await page.waitFor(
    async () => (await shown(page)) === "选择起止日期",
    "点清除应该回到提示",
  );
});

test("日期范围：起止是同一天时外框里只写一个日期", async () => {
  const { page } = storybook;
  await page.story("控件-daterangepicker-日期范围--single-day");
  assert.equal(await shown(page), "2026.10.09");
});

test("日期范围 320px 宽：外框里的一段不撑破，面板整个在视口里", async () => {
  const { page } = storybook;
  await page.setSize(320, 760);
  try {
    await page.story("控件-daterangepicker-日期范围--in-form");
    await page.click(TRIGGER);
    await page.waitVisible(PANEL);
    const fit = await page.evaluate(() => {
      const rect = document
        .querySelector("[role=dialog]")!
        .getBoundingClientRect();
      const box = document
        .querySelector("#storybook-root [data-variant]")!
        .getBoundingClientRect();
      return {
        inside: rect.left >= 0 && rect.right <= innerWidth,
        boxInside: box.right <= innerWidth,
        pageScrolls:
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth,
      };
    });
    assert.deepEqual(fit, {
      inside: true,
      boxInside: true,
      pageScrolls: false,
    });
  } finally {
    await page.setSize(1200, 800);
  }
});
