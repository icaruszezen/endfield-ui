// 滚动区：系统滚动条藏了、滑块跟着走、能拖能点、键盘能滚；只有溢出才有滚动条、才让位
import assert from "node:assert/strict";
import { test } from "node:test";
import { useStorybook, type Page } from "./lib/harness.ts";

const storybook = useStorybook();

const ROOT = "#storybook-root [data-scroll-area]";

type Box = { top: number; bottom: number; left: number; right: number };
type Bar = Box & {
  orientation: string | null;
  thumb: Box;
  /** 滑块上画出来的那一条的颜色 */
  color: string;
};

/** 一个滚动区现在的样子。`index` 是页面上的第几个 */
const measure = (page: Page, index = 0) =>
  page.evaluate(
    ({ css, nth }) => {
      const root = document.querySelectorAll<HTMLElement>(css)[nth]!;
      const viewport = root.firstElementChild as HTMLElement;
      const box = (element: Element) => {
        const rect = element.getBoundingClientRect();
        return {
          top: rect.top,
          bottom: rect.bottom,
          left: rect.left,
          right: rect.right,
        };
      };
      const style = getComputedStyle(viewport);
      return {
        root: box(root),
        viewport: box(viewport),
        scrollTop: viewport.scrollTop,
        scrollLeft: viewport.scrollLeft,
        maxTop: viewport.scrollHeight - viewport.clientHeight,
        maxLeft: viewport.scrollWidth - viewport.clientWidth,
        clientHeight: viewport.clientHeight,
        scrollHeight: viewport.scrollHeight,
        // 系统滚动条占掉的宽度和高度：藏起来了就是 0
        nativeBar: [
          viewport.offsetWidth - viewport.clientWidth,
          viewport.offsetHeight - viewport.clientHeight,
        ],
        margin: [style.marginRight, style.marginBottom],
        overflow: [style.overflowX, style.overflowY],
        role: viewport.getAttribute("role"),
        name: viewport.getAttribute("aria-label"),
        tabIndex: viewport.tabIndex,
        bars: [
          ...root.querySelectorAll<HTMLElement>(
            ":scope > [aria-hidden][data-orientation]",
          ),
        ].map((bar) => ({
          ...box(bar),
          orientation: bar.getAttribute("data-orientation"),
          thumb: box(bar.firstElementChild!),
          color: getComputedStyle(bar.firstElementChild!, "::before")
            .backgroundColor,
        })),
      };
    },
    { css: ROOT, nth: index },
  );

const scrollTo = (page: Page, position: { top?: number; left?: number }) =>
  page.evaluate(
    ({ css, top, left }) => {
      const viewport = document.querySelector(css)!.firstElementChild!;
      if (top !== undefined) viewport.scrollTop = top;
      if (left !== undefined) viewport.scrollLeft = left;
    },
    { css: ROOT, ...position },
  );

const bar = async (page: Page, orientation: string, index = 0) => {
  const found = (await measure(page, index)).bars.find(
    (item: Bar) => item.orientation === orientation,
  );
  assert.ok(found, `应该有一条 ${orientation} 的滚动条`);
  return found;
};

const center = (box: Box) => ({
  x: (box.left + box.right) / 2,
  y: (box.top + box.bottom) / 2,
});

const token = (page: Page, value: string) =>
  page.evaluate((color) => {
    const probe = document.createElement("i");
    probe.style.backgroundColor = color;
    document.body.append(probe);
    const computed = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return computed;
  }, value);

test("系统滚动条藏了；滑块的长度按比例，位置跟着滚动走", async () => {
  const { page } = storybook;
  await page.story("控件-scrollarea-滚动区--playground");
  await page.waitFor(
    async () => (await measure(page)).bars.length === 1,
    "内容比窗口长，应该有一条滚动条",
  );

  const start = await measure(page);
  assert.deepEqual(start.nativeBar, [0, 0], "系统滚动条应该藏起来");
  assert.ok(start.maxTop > 100, "这个 story 里应该有足够的距离可滚");

  const track = start.bars[0]!;
  assert.equal(track.orientation, "vertical");
  assert.equal(track.right - track.left, 12, "滚动条是 12px 宽的一条");
  const trackLength = track.bottom - track.top;
  const expected = (trackLength * start.clientHeight) / start.scrollHeight;
  assert.ok(
    Math.abs(track.thumb.bottom - track.thumb.top - expected) < 2,
    `滑块的长度应该是看得见的部分占全部的比例（想要约 ${expected.toFixed(1)}px）`,
  );
  assert.ok(Math.abs(track.thumb.top - track.top) < 1, "没滚的时候滑块在顶上");

  await scrollTo(page, { top: start.maxTop });
  await page.waitFor(async () => {
    const now = await bar(page, "vertical");
    return Math.abs(now.thumb.bottom - now.bottom) < 1;
  }, "滚到底，滑块应该到轨的最下面");

  await scrollTo(page, { top: start.maxTop / 2 });
  await page.waitFor(async () => {
    const now = await bar(page, "vertical");
    const middle = (now.thumb.top + now.thumb.bottom) / 2;
    return Math.abs(middle - (now.top + now.bottom) / 2) < 2;
  }, "滚到一半，滑块应该在轨的正中");
});

test("拖滑块会滚；点轨道跳过去", async () => {
  const { page } = storybook;
  await page.story("控件-scrollarea-滚动区--playground");
  const track = await bar(page, "vertical");

  const from = center(track.thumb);
  await page.drag(from, { x: from.x, y: from.y + 60 });
  await page.waitFor(
    async () => (await measure(page)).scrollTop > 50,
    "把滑块往下拖 60px，内容应该跟着滚下去",
  );

  // 点轨道靠下的地方：滑块跳到那儿
  await scrollTo(page, { top: 0 });
  await page.waitFor(
    async () => (await measure(page)).scrollTop === 0,
    "先回到顶上",
  );
  await page.click({ x: from.x, y: track.bottom - 4 });
  await page.waitFor(async () => {
    const now = await measure(page);
    return now.scrollTop > now.maxTop * 0.8;
  }, "点轨道的最下面，应该差不多滚到底");
});

test("键盘：Tab 能进来，方向键能滚，焦点环画在里面", async () => {
  const { page } = storybook;
  await page.story("控件-scrollarea-滚动区--playground");
  await page.waitFor(
    async () => (await measure(page)).role === "region",
    "能滚的时候可视区应该是一个区域",
  );
  const start = await measure(page);
  assert.deepEqual([start.name, start.tabIndex], ["值守日志", 0]);

  await page.key("Tab");
  await page.waitFocused("region:值守日志");
  await page.waitFor(
    () =>
      page.evaluate(() => {
        const style = getComputedStyle(document.activeElement!);
        return (
          style.outlineStyle === "solid" &&
          style.outlineWidth === "2px" &&
          style.outlineOffset === "-2px"
        );
      }),
    "键盘聚焦的滚动区应该有一圈画在里面的焦点环",
  );

  for (let press = 0; press < 3; press += 1) await page.key("ArrowDown");
  await page.waitFor(
    async () => (await measure(page)).scrollTop > 0,
    "按方向键应该能滚",
  );
});

test("只有溢出才有滚动条、才让出 12px、才占 Tab；给的是上限时内容短就跟着矮", async () => {
  const { page } = storybook;
  await page.story("控件-scrollarea-滚动区--max-height");
  await page.waitFor(
    async () => (await measure(page, 1)).bars.length === 1,
    "内容长的那个应该有滚动条",
  );
  // 让"内容短的那个"有机会长出滚动条来：它不该长
  await page.pause(300);

  const short = await measure(page, 0);
  const long = await measure(page, 1);

  assert.deepEqual(
    {
      bars: short.bars.length,
      margin: short.margin[0],
      role: short.role,
      tabIndex: short.tabIndex,
    },
    { bars: 0, margin: "0px", role: "presentation", tabIndex: -1 },
    "不溢出的：没有滚动条、不让位、不是区域、不占 Tab",
  );
  assert.deepEqual(
    {
      bars: long.bars.length,
      margin: long.margin[0],
      role: long.role,
      tabIndex: long.tabIndex,
    },
    { bars: 1, margin: "12px", role: "region", tabIndex: 0 },
    "溢出的：有滚动条、让出 12px、是一个能聚焦的区域",
  );

  const height = (box: Box) => box.bottom - box.top;
  // max-h-48 加上下各 1px 的边
  assert.ok(Math.abs(height(long.root) - 192) < 1, "内容长的顶到高度上限");
  assert.ok(
    height(short.root) < height(long.root) - 20,
    "内容短的跟着内容矮，不撑到上限",
  );
  // 滑块不压在内容上：可视区的右缘在滚动条的左缘
  assert.ok(
    long.viewport.right <= long.bars[0]!.left + 0.5,
    "内容应该在滚动条的左边，不被压住",
  );

  // Tab 只停在能滚的那个上
  await page.key("Tab");
  await page.waitFocused("region:本周的日志");
});

test("横向：滚动条在下缘，下面让出 12px，纵向滚不了", async () => {
  const { page } = storybook;
  await page.story("控件-scrollarea-滚动区--horizontal");
  await page.waitFor(
    async () => (await measure(page)).bars.length === 1,
    "一排卡片放不下，应该有一条滚动条",
  );
  const start = await measure(page);
  const track = start.bars[0]!;
  assert.equal(track.orientation, "horizontal");
  assert.equal(track.bottom - track.top, 12, "横向的滚动条是 12px 高的一条");
  assert.ok(Math.abs(track.bottom - start.root.bottom) < 0.5, "贴着下缘");
  assert.equal(start.margin[1], "12px", "下面让出 12px");
  assert.equal(start.overflow[1], "hidden", "只管横向时纵向不能滚");
  assert.ok(start.viewport.bottom <= track.top + 0.5, "内容不被滚动条压住");

  await scrollTo(page, { left: start.maxLeft });
  await page.waitFor(async () => {
    const now = await bar(page, "horizontal");
    return Math.abs(now.thumb.right - now.right) < 1;
  }, "滚到最右，滑块应该到轨的最右边");
});

test("两个方向：两条滚动条，右下角空出一个交角", async () => {
  const { page } = storybook;
  await page.story("控件-scrollarea-滚动区--both");
  await page.waitFor(
    async () => (await measure(page)).bars.length === 2,
    "两个方向都溢出，应该有两条滚动条",
  );
  // 交角的大小是量出来之后才写上去的
  await page.waitFor(async () => {
    const vertical = await bar(page, "vertical");
    const horizontal = await bar(page, "horizontal");
    return (
      vertical.bottom <= horizontal.top + 0.5 &&
      horizontal.right <= vertical.left + 0.5
    );
  }, "两条滚动条不该在右下角叠在一起");

  const found = await measure(page);
  assert.deepEqual(found.margin, ["12px", "12px"], "右边和下面各让出 12px");
  assert.deepEqual(found.overflow, ["scroll", "scroll"]);
});

test("滑块平时是次级墨色，指针移到滚动条上变成墨色（亮暗两套）", async () => {
  const { page } = storybook;
  for (const theme of ["light", "dark"] as const) {
    await page.story("控件-scrollarea-滚动区--playground", theme);
    await page.waitFor(
      async () => (await measure(page)).bars.length === 1,
      "应该有一条滚动条",
    );
    const rest = await token(page, "var(--ef-ink-secondary)");
    const ink = await token(page, "var(--ef-ink)");
    assert.notEqual(rest, ink);

    await page.waitEqual(
      async () => (await bar(page, "vertical")).color,
      rest,
      `${theme}：平时是次级墨色`,
    );
    // 指针放在轨上、滑块之外：整条滚动条都算
    const track = await bar(page, "vertical");
    await page.moveTo({ x: center(track).x, y: track.bottom - 6 });
    await page.waitEqual(
      async () => (await bar(page, "vertical")).color,
      ink,
      `${theme}：指针在滚动条上时变成墨色`,
    );
    await page.moveTo({ x: 5, y: 5 });
  }
});

test("viewportRef 交出去的是真正在滚的元素：回到顶部看的就是它", async () => {
  const { page } = storybook;
  await page.story("控件-scrollarea-滚动区--with-back-to-top");
  const BUTTON = "#storybook-root button";
  // 钮没出现时只是看不见（visibility），位置还在：看它自己标的状态
  const shown = () =>
    page.evaluate(
      (css) => document.querySelector(css)!.hasAttribute("data-visible"),
      BUTTON,
    );
  assert.equal(await shown(), false, "没滚的时候钮不出现");

  await scrollTo(page, { top: 200 });
  await page.waitFor(shown, "滚动区滚下去之后，回到顶部的钮应该出现");
  await page.click(BUTTON);
  await page.waitFor(
    async () => (await measure(page)).scrollTop === 0,
    "点了应该把滚动区滚回顶上",
  );
});
