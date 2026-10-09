// 页头：各格的位置、窄了行动区折下去、返回方块的状态、吸顶
import assert from "node:assert/strict";
import { test } from "node:test";
import { useStorybook, type Page } from "./lib/harness.ts";

const storybook = useStorybook();

const HEADER = "#storybook-root header";
const BACK = "#storybook-root [data-page-header-back]";

/** 页头里几样东西的位置（都相对视口） */
const layout = (page: Page) =>
  page.evaluate((css) => {
    const header = document.querySelector<HTMLElement>(css)!;
    const box = (element: Element | null) => {
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      return {
        top: rect.top,
        bottom: rect.bottom,
        left: rect.left,
        right: rect.right,
        width: rect.width,
        height: rect.height,
      };
    };
    const heading = header.querySelector("h1")!;
    return {
      header: box(header)!,
      heading: box(heading)!,
      back: box(header.querySelector("[data-page-header-back]")),
      actions: box(header.querySelector("[data-actions]")),
      // 行动区里的第一个按钮：行动区那一格比按钮高，看对齐要看按钮自己
      action: box(header.querySelector("[data-actions] > *")),
      fontSize: parseFloat(getComputedStyle(heading).fontSize),
    };
  }, HEADER);

/** 一个令牌现在算出来的颜色 */
const token = (page: Page, value: string) =>
  page.evaluate((color) => {
    const probe = document.createElement("i");
    probe.style.backgroundColor = color;
    document.body.append(probe);
    const computed = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return computed;
  }, value);

const background = (page: Page, selector: string) =>
  page.evaluate(
    (css) => getComputedStyle(document.querySelector(css)!).backgroundColor,
    selector,
  );

test("宽的时候：返回方块 40px 见方，和标题的第一行、右边的行动区在同一行", async () => {
  const { page } = storybook;
  await page.story("控件-pageheader-页头--with-back");
  const found = await layout(page);

  assert.deepEqual(
    [found.back!.width, found.back!.height],
    [40, 40],
    "返回方块是 40px 见方",
  );
  // 这个 story 的标题只有一行：标题的盒子就是它的第一行
  const middle = (box: { top: number; bottom: number }) =>
    (box.top + box.bottom) / 2;
  assert.ok(
    Math.abs(middle(found.back!) - middle(found.heading)) < 0.5,
    "返回方块对着标题那一行的正中",
  );
  assert.ok(
    found.heading.left - found.back!.right >= 15,
    "返回方块和标题之间留 16px",
  );
  assert.ok(
    Math.abs(middle(found.action!) - middle(found.heading)) < 0.5,
    "行动区的按钮也对着标题那一行的正中",
  );
  assert.ok(
    Math.abs(found.actions!.right - found.header.right) < 0.5,
    "行动区靠右",
  );
});

test("窄了：行动区整块折到标题下面、靠左，标题小一档", async () => {
  const { page } = storybook;
  await page.story("控件-pageheader-页头--with-back");
  const wide = await layout(page);

  // 232px 宽的容器：标题那一组要留 256px，行动区怎么都挤不进同一行（和字体无关）
  await page.story("控件-pageheader-页头--narrow");
  const narrow = await layout(page);
  assert.ok(
    narrow.actions!.top >= narrow.heading.bottom,
    "行动区应该在标题下面",
  );
  assert.ok(
    Math.abs(narrow.actions!.left - narrow.header.left) < 0.5,
    "折下来的行动区靠左",
  );
  assert.ok(
    narrow.actions!.right <= narrow.header.right + 0.5,
    "行动区不伸出页头",
  );
  assert.ok(
    narrow.fontSize < wide.fontSize,
    `窄的时候标题应该小一档（宽 ${wide.fontSize}px，窄 ${narrow.fontSize}px）`,
  );
});

test("返回方块：悬停换一档底色；两个主题下是同一块深灰", async () => {
  const { page } = storybook;
  await page.story("控件-pageheader-页头--back", "light");
  const control = await token(page, "var(--color-control)");
  const hover = await token(page, "var(--color-neutral-600)");
  assert.notEqual(control, hover);

  await page.waitEqual(() => background(page, BACK), control, "平时是深灰");
  await page.moveTo(BACK);
  await page.waitEqual(() => background(page, BACK), hover, "悬停亮一档");
  await page.moveTo({ x: 5, y: 5 });

  await page.story("控件-pageheader-页头--back", "dark");
  await page.waitEqual(
    () => background(page, BACK),
    control,
    "暗色主题下返回方块还是那块深灰，不跟着翻",
  );
});

test("返回方块：键盘聚焦有焦点环，回车触发；链接形态点了就跳", async () => {
  const { page } = storybook;
  await page.story("控件-pageheader-页头--back");

  await page.key("Tab");
  await page.waitFocused("button:返回");
  await page.waitFor(
    () =>
      page.evaluate(() => {
        const style = getComputedStyle(document.activeElement!);
        return style.outlineStyle === "solid" && style.outlineWidth === "2px";
      }),
    "键盘聚焦的返回方块应该有 2px 的焦点环",
  );

  // 第二个是链接：名称是自己给的，点了地址变
  await page.key("Tab");
  await page.waitFocused("a:返回档案");
  await page.key("Enter");
  await page.waitFor(
    () => page.evaluate(() => location.hash === "#archive"),
    "链接形态的返回应该跳到它的地址",
  );

  // 禁用的那个 Tab 走不到：第三个之后直接是带字的 back 按钮
  await page.key("Tab");
  await page.waitFocused("a:返回档案");
  await page.key("Tab");
  await page.waitFocused("a:档案");
});

test("吸顶：正文滚走之后页头还贴着容器的上沿，底是实的", async () => {
  const { page } = storybook;
  for (const theme of ["light", "dark"] as const) {
    await page.story("控件-pageheader-页头--sticky", theme);
    const surface = () => token(page, "var(--ef-surface)");

    await page.evaluate(() => {
      document.querySelector<HTMLElement>(
        "#storybook-root [data-scroller]",
      )!.scrollTop = 200;
    });
    await page.waitFor(
      () =>
        page.evaluate((css) => {
          const scroller = document.querySelector<HTMLElement>(
            "#storybook-root [data-scroller]",
          )!;
          const header = document.querySelector<HTMLElement>(css)!;
          const top =
            header.getBoundingClientRect().top -
            scroller.getBoundingClientRect().top -
            scroller.clientTop;
          return scroller.scrollTop === 200 && Math.abs(top) < 0.5;
        }, HEADER),
      `${theme}：滚了 200px 之后页头应该还贴着容器的上沿`,
    );
    await page.waitEqual(
      () => background(page, HEADER),
      await surface(),
      `${theme}：吸顶的页头要有实底，正文不能从它后面透出来`,
    );

    // 页头压在正文上面：它中间那一点点到的是页头里的东西，不是滚上来的段落
    const onTop = await page.evaluate((css) => {
      const header = document.querySelector<HTMLElement>(css)!;
      const rect = header.getBoundingClientRect();
      const hit = document.elementFromPoint(
        rect.left + rect.width / 2,
        rect.top + rect.height / 2,
      );
      return hit !== null && header.contains(hit);
    }, HEADER);
    assert.equal(onTop, true, `${theme}：页头应该压在正文上面`);
  }
});
