// 排期：条目的两端对上起止日那两格、重叠的错行、今天的竖线、窄容器里横向滚动并冻结竖轨、条目作链接
import assert from "node:assert/strict";
import { test } from "node:test";
import { useStorybook, type Page } from "./lib/harness.ts";

const storybook = useStorybook({ width: 1280, height: 800 });

/** 轴上每一天那一格的左右边，和各个条目的位置 */
const layout = (page: Page) =>
  page.evaluate(() => {
    const root = document.querySelector(
      "#storybook-root [data-overflowing], #storybook-root [style*='--schedule-days']",
    )!;
    // 时间轴：竖轨那一格后面的那个网格，一天一个子元素
    const axis = root.querySelector(
      "[aria-hidden=true].relative.flex",
    )!.lastElementChild!;
    const round = (value: number) => Math.round(value * 10) / 10;
    // 日期块比格子宽，所以每一格的位置按"第几格 × 格宽"算，不量子元素
    const box = axis.getBoundingClientRect();
    const count = axis.children.length;
    const width = box.width / count;
    const days = Array.from({ length: count }, (_, index) => ({
      left: round(box.left + index * width),
      right: round(box.left + (index + 1) * width),
    }));
    const items = [...root.querySelectorAll("li")].map((item) => {
      const rect = item.getBoundingClientRect();
      return {
        name: item.querySelector("span.truncate")?.textContent ?? "",
        left: round(rect.left),
        right: round(rect.right),
        top: round(rect.top),
        bottom: round(rect.bottom),
      };
    });
    const today = root.querySelector("[data-today]")?.getBoundingClientRect();
    return { days, items, today: today ? round(today.left) : null };
  });

const near = (a: number, b: number) => Math.abs(a - b) <= 1;

test("条目从起始日那一格的左缘开始，到结束日那一格的右缘为止", async () => {
  const { page } = storybook;
  await page.story("控件-schedule-排期--playground");
  const { days, items } = await layout(page);
  assert.equal(days.length, 31);
  const find = (name: string) => items.find((item) => item.name === name)!;

  // 10.01 – 10.12
  const survey = find("管廊北段测绘");
  assert.ok(near(survey.left, days[0]!.left), "起点应该对上 1 号那一格的左缘");
  assert.ok(
    near(survey.right, days[11]!.right),
    "终点应该对上 12 号那一格的右缘",
  );

  // 10.14 – 10.16：三天，正好三格宽
  const repair = find("例行检修");
  assert.ok(near(repair.left, days[13]!.left));
  assert.ok(near(repair.right, days[15]!.right));

  // 整个月
  const daily = find("每日巡检签到");
  assert.ok(near(daily.left, days[0]!.left));
  assert.ok(near(daily.right, days[30]!.right));
});

test("今天的竖线对着今天那一格的左缘", async () => {
  const { page } = storybook;
  await page.story("控件-schedule-排期--playground");
  const { days, today } = await layout(page);
  assert.ok(today !== null, "应该有今天的竖线");
  assert.ok(near(today, days[8]!.left), "9 号的竖线应该在第 9 格的左缘");
});

test("同一条轨里时间重叠的条目自动错到下一行，谁也不压着谁", async () => {
  const { page } = storybook;
  await page.story("控件-schedule-排期--overlapping");
  const { items } = await layout(page);
  assert.equal(items.length, 5);
  for (const a of items) {
    for (const b of items) {
      if (a === b) continue;
      const overlap =
        a.left < b.right - 1 &&
        b.left < a.right - 1 &&
        a.top < b.bottom - 1 &&
        b.top < a.bottom - 1;
      assert.ok(!overlap, `${a.name} 和 ${b.name} 压在一起了`);
    }
  }
  const rows = new Set(items.map((item) => item.top)).size;
  assert.equal(rows, 3, "这五个条目应该排成三行");
  // 能往前填的往前填：收尾（16 – 18）在第二行，接在中段（8 – 14）后面
  const top = (name: string) => items.find((item) => item.name === name)!.top;
  assert.equal(top("收尾"), top("中段"));
});

test("起止超出范围的条目被裁到范围内；日期锚是第一天和每个月的 1 号", async () => {
  const { page } = storybook;
  await page.story("控件-schedule-排期--across-months");
  const { days, items } = await layout(page);
  const clipped = items.find((item) => item.name === "第三岩层复测")!;
  assert.ok(near(clipped.left, days[0]!.left), "早就开始的条目应该从第一格起");
  assert.deepEqual(await page.text("#storybook-root [data-anchor]"), [
    "10.20",
    "11.01",
  ]);
  assert.match(
    (await page.text("#storybook-root li .sr-only"))[0]!,
    /10月10日至10月24日/,
    "读屏听到的仍然是它真正的起止日期",
  );
});

test("够宽时不溢出，不占 Tab 停靠点；窄容器里是一个能聚焦的区域，页面不滚", async () => {
  const { page } = storybook;
  await page.story("控件-schedule-排期--playground");
  assert.deepEqual(
    await page.evaluate(() => {
      const root = document.querySelector<HTMLElement>(
        "#storybook-root [style*='--schedule-days']",
      )!;
      return [root.getAttribute("role"), root.getAttribute("tabindex")];
    }),
    [null, null],
  );

  await page.story("控件-schedule-排期--narrow");
  const region = await page.waitFor(
    () =>
      page.evaluate(() => {
        const root = document.querySelector<HTMLElement>(
          "#storybook-root [role=region][tabindex='0']",
        );
        return root
          ? {
              name: root.getAttribute("aria-label"),
              scrolls: root.scrollWidth > root.clientWidth + 1,
              pageScrolls:
                document.documentElement.scrollWidth >
                document.documentElement.clientWidth,
            }
          : null;
      }),
    "窄容器里排期应该是一个能聚焦的区域",
  );
  assert.deepEqual(region, {
    name: "十月排期",
    scrolls: true,
    pageScrolls: false,
  });
});

test("横向滚过去之后类目竖轨还在左边，压在滚过去的条目上面", async () => {
  const { page } = storybook;
  await page.story("控件-schedule-排期--narrow");
  await page.waitVisible("#storybook-root [role=region]");
  const found = await page.evaluate(() => {
    const root = document.querySelector<HTMLElement>(
      "#storybook-root [role=region]",
    )!;
    root.scrollLeft = 260;
    const left = root.getBoundingClientRect().left;
    const rails = [...root.querySelectorAll("section > [aria-hidden=true]")];
    const first = rails[0]!.getBoundingClientRect();
    const hit = document.elementFromPoint(
      first.left + first.width / 2,
      first.top + first.height / 2,
    );
    return {
      scrolled: root.scrollLeft,
      pinned: rails.every(
        (rail) => Math.abs(rail.getBoundingClientRect().left - left) < 1,
      ),
      onTop: rails[0] === hit || rails[0]!.contains(hit),
      opaque: rails.every((rail) => {
        const color = getComputedStyle(rail).backgroundColor;
        return color !== "rgba(0, 0, 0, 0)" && color !== "transparent";
      }),
    };
  });
  assert.ok(found.scrolled > 0, "应该能横向滚动");
  assert.ok(found.pinned, "滚过去之后竖轨应该还贴着左边");
  assert.ok(found.onTop, "竖轨应该压在滚过去的条目上面");
  assert.ok(found.opaque, "竖轨的底不能是透明的");
});

test("条目作链接：Tab 走得到，焦点环画在条目上；点条目的任何地方都算点了它", async () => {
  const { page } = storybook;
  await page.story("控件-schedule-排期--links-and-color");
  await page.key("Tab");
  await page.waitFocused("a:管廊北段");
  // 宽度是过渡过去的（从没有轮廓时的默认值 3px 到 2px）：线型一变就读，读到的是起点
  await page.waitFor(async () => {
    const found = await page.evaluate(() => {
      const item = document.activeElement!.closest("li")!;
      const style = getComputedStyle(item);
      return { style: style.outlineStyle, width: style.outlineWidth };
    });
    return found.style === "solid" && found.width === "2px";
  }, "焦点环应该画在整个条目上：2px 的实线");

  // 点条目的右下角（离名称很远）：也是点了这个链接
  const corner = await page.evaluate(() => {
    const rect = document.activeElement!.closest("li")!.getBoundingClientRect();
    return { x: rect.right - 12, y: rect.bottom - 6 };
  });
  await page.click(corner);
  await page.waitFor(
    () => page.evaluate(() => location.hash === "#north"),
    "点条目的角上应该跳到 #north",
  );

  // 竖轨换了颜色
  const rail = await page.evaluate(() =>
    [
      ...document.querySelectorAll(
        "#storybook-root section > [aria-hidden=true]",
      ),
    ].map((element) => getComputedStyle(element).backgroundColor),
  );
  assert.notEqual(rail[0], rail[1], "第一条轨的竖轨应该换了颜色");
});

test("两个主题：系统类条目都是炭灰底；空档露出斜纹", async () => {
  const { page } = storybook;
  const seen: string[] = [];
  for (const theme of ["light", "dark"] as const) {
    await page.story("控件-schedule-排期--playground", theme);
    const look = await page.evaluate(() => {
      const system = document.querySelector(
        "#storybook-root li[data-variant=system]",
      )!;
      const hatch = document.querySelector("#storybook-root .hatch")!;
      return {
        system: getComputedStyle(system).backgroundColor,
        hatch: getComputedStyle(hatch).backgroundImage !== "none",
      };
    });
    assert.ok(look.hatch, `${theme}：空档应该有斜纹`);
    seen.push(look.system);
  }
  assert.equal(seen[0], seen[1], "系统类条目的底在两个主题下应该相同");
});
