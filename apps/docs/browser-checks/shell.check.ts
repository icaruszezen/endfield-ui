// 外壳：侧轨的两种形态、收起时浮出来的栏目名、全屏菜单的焦点与滚动、主行动块
import assert from "node:assert/strict";
import { test } from "node:test";
import { useStorybook, type Page } from "./lib/harness.ts";

const storybook = useStorybook();

const RAIL = "#storybook-root nav[aria-label=主导航]";
const DIALOG = "[role=dialog]";

/** 收起的侧轨里浮出来的那块栏目名（挂在 body 下，对读屏隐藏） */
const flyout = (page: Page) =>
  page.evaluate(() => {
    const popup = [
      ...document.querySelectorAll("body [aria-hidden=true]"),
    ].find(
      (element) =>
        element.matches("[data-side]") ||
        element.parentElement?.matches("[data-side]"),
    );
    if (!popup) return null;
    const rect = popup.getBoundingClientRect();
    if (rect.width === 0) return null;
    return {
      text: (popup.textContent ?? "").trim(),
      left: Math.round(rect.left),
      top: Math.round(rect.top),
      height: Math.round(rect.height),
      background: getComputedStyle(popup).backgroundColor,
    };
  });

const box = (page: Page, selector: string) =>
  page.evaluate((css) => {
    const rect = document.querySelector(css)!.getBoundingClientRect();
    return {
      left: Math.round(rect.left),
      right: Math.round(rect.right),
      top: Math.round(rect.top),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
    };
  }, selector);

test("侧轨：展开 224px，收起 64px，图标的位置不变", async () => {
  const { page } = storybook;
  await page.story("控件-siderail-侧轨--toggle");
  const ICON = `${RAIL} li:nth-child(1) svg`;
  const rail = await box(page, RAIL);
  const icon = await box(page, ICON);
  assert.equal(rail.width, 224);

  await page.click("button[aria-label=收起侧轨]");
  await page.waitFor(
    async () => (await box(page, RAIL)).width === 64,
    "点了收起之后侧轨应该是 64px 宽",
  );
  const collapsedIcon = await box(page, ICON);
  assert.equal(collapsedIcon.left, icon.left, "收起之后图标不应该跑位");
  // 图标在 64px 的窄轨里居中
  const collapsedRail = await box(page, RAIL);
  assert.ok(
    Math.abs(
      collapsedIcon.left +
        collapsedIcon.width / 2 -
        (collapsedRail.left + collapsedRail.width / 2),
    ) <= 1,
    "收起时图标应该在窄轨正中",
  );

  // 文字还在，只是看不见：名称不变
  assert.equal(
    await page.evaluate(
      (css) => document.querySelector(css)!.textContent,
      `${RAIL} li:nth-child(1) a`,
    ),
    "总览",
  );
});

test("收起的侧轨：键盘聚焦到一项，栏目名从它右边展开，和这一项连成一条", async () => {
  const { page } = storybook;
  for (const theme of ["light", "dark"] as const) {
    await page.story("控件-siderail-侧轨--collapsed", theme);
    assert.equal(await flyout(page), null, "没聚焦时不应该有浮出来的栏目名");

    // 第一个 Tab 是标志，第二个是第一个栏目
    await page.key("Tab");
    await page.key("Tab");
    await page.waitFocused("a:总览");
    const label = await page.waitFor(() => flyout(page), "栏目名没有浮出来");
    assert.equal(label.text, "总览");

    const item = await box(page, `${RAIL} li:nth-child(1) a`);
    const rail = await box(page, RAIL);
    assert.ok(
      Math.abs(label.left - rail.right) <= 1,
      `${theme}：栏目名应该贴着侧轨的右缘`,
    );
    assert.equal(label.top, item.top, "栏目名应该和这一项一样高、对齐");
    assert.equal(label.height, item.height);
    // 底色是过渡过去的，头一帧量到的是起点：等它落定
    await page.waitFor(
      async () =>
        (await page.evaluate(
          () => getComputedStyle(document.activeElement!).backgroundColor,
        )) === label.background,
      `${theme}：这一项和浮出来的那块应该是同一个底色`,
    );

    // 焦点移到下一项：换成下一项的名称
    await page.key("Tab");
    await page.waitFor(
      async () => (await flyout(page))?.text === "调度",
      "焦点到了第二项，浮出来的应该是它的名称",
    );
  }
});

test("收起的侧轨：悬停也会浮出栏目名；展开的侧轨不会", async () => {
  const { page } = storybook;
  await page.story("控件-siderail-侧轨--collapsed");
  await page.moveTo(`${RAIL} li:nth-child(3) a`);
  await page.waitFor(
    async () => (await flyout(page))?.text === "档案",
    "悬停第三项应该浮出它的名称",
  );
  await page.moveTo("#storybook-root main");
  await page.waitFor(
    async () => (await flyout(page)) === null,
    "指针移开之后应该收起",
  );

  await page.story("控件-siderail-侧轨--playground");
  await page.moveTo(`${RAIL} li:nth-child(3) a`);
  await page.pause(300);
  assert.equal(await flyout(page), null, "展开的侧轨不应该浮出栏目名");
});

test("侧轨：当前栏目带 aria-current；键盘走得到每一项，焦点环看得见", async () => {
  const { page } = storybook;
  await page.story("控件-siderail-侧轨--playground");
  assert.deepEqual(
    await page.evaluate(
      (css) =>
        [...document.querySelectorAll(`${css} li a`)].map((link) =>
          link.getAttribute("aria-current"),
        ),
      RAIL,
    ),
    [null, "page", null, null, null],
  );

  await page.key("Tab");
  await page.key("Tab");
  await page.waitFocused("a:总览");
  await page.waitFor(
    () =>
      page.evaluate(() => {
        const style = getComputedStyle(document.activeElement!);
        return style.outlineStyle === "solid" && style.outlineWidth === "2px";
      }),
    "聚焦的栏目应该有焦点环",
  );
  await page.key("Tab");
  await page.waitFocused("a:调度");
});

test("主行动块：收起的侧轨里是竖排的，文字没有被裁掉", async () => {
  const { page } = storybook;
  await page.story("控件-siderail-侧轨--collapsed");
  const action = await page.evaluate(() => {
    const element = document.querySelector<HTMLElement>(
      "#storybook-root [data-layout=stacked]",
    )!;
    const text = element.lastElementChild!.getBoundingClientRect();
    const outer = element.getBoundingClientRect();
    return {
      vertical: text.height > text.width,
      inside: text.bottom <= outer.bottom && text.top >= outer.top,
      width: Math.round(outer.width),
    };
  });
  assert.deepEqual(action, { vertical: true, inside: true, width: 48 });
});

test("主行动块：悬停时整块换成另一个底色", async () => {
  const { page } = storybook;
  await page.story("控件-navaction-主行动块--elements");
  const LINK = "#storybook-root a[data-layout]";
  const color = () =>
    page.evaluate(
      (css) => getComputedStyle(document.querySelector(css)!).backgroundColor,
      LINK,
    );
  const resting = await color();
  await page.moveTo(LINK);
  await page.waitFor(
    async () => (await color()) !== resting,
    "悬停时主行动块的底色应该变",
  );
});

test("全屏菜单：点菜单钮打开，盖住整个视口，焦点落在第一个栏目上", async () => {
  const { page } = storybook;
  await page.story("控件-topbar-顶栏与全屏菜单--with-menu");
  const TRIGGER = "button[aria-label=打开菜单]";
  const trigger = await box(page, TRIGGER);

  await page.click(TRIGGER);
  await page.waitVisible(DIALOG);
  await page.waitFocused("a:总览", "打开后焦点应该在第一个栏目上");

  const panel = await page.evaluate(() => {
    const rect = document
      .querySelector("[role=dialog]")!
      .getBoundingClientRect();
    return {
      covers:
        rect.left === 0 &&
        rect.top === 0 &&
        Math.round(rect.width) === innerWidth &&
        Math.round(rect.height) === innerHeight,
      name: document
        .querySelector("[role=dialog]")!
        .getAttribute("aria-labelledby")
        ? document.getElementById(
            document
              .querySelector("[role=dialog]")!
              .getAttribute("aria-labelledby")!,
          )?.textContent
        : null,
    };
  });
  assert.ok(panel.covers, "菜单应该盖住整个视口");
  assert.equal(panel.name, "菜单");

  // 关闭钮和顶栏的菜单钮一样高
  const close = await box(page, `${DIALOG} button[aria-label=关闭菜单]`);
  assert.equal(close.height, trigger.height);
});

test("全屏菜单：焦点被限制在里面，背景不能滚动；Esc 关闭后焦点回到菜单钮", async () => {
  const { page } = storybook;
  await page.story("控件-topbar-顶栏与全屏菜单--with-menu");
  await page.click("button[aria-label=打开菜单]");
  await page.waitVisible(DIALOG);

  // 绕一整圈：焦点始终在菜单里
  for (let i = 0; i < 12; i++) {
    await page.key("Tab");
    assert.ok(
      await page.evaluate(
        () => !!document.activeElement?.closest("[role=dialog]"),
      ),
      `按了 ${i + 1} 次 Tab 之后焦点跑到了菜单外面`,
    );
  }

  assert.ok(
    await page.evaluate(() => {
      const before = scrollY;
      scrollTo(0, before + 200);
      const moved = scrollY !== before;
      scrollTo(0, before);
      return (
        !moved ||
        getComputedStyle(document.documentElement).overflow === "hidden" ||
        getComputedStyle(document.body).overflow === "hidden"
      );
    }),
    "菜单开着的时候背景不应该能滚动",
  );

  await page.key("Escape");
  await page.waitGone(DIALOG);
  await page.waitFocused("button:打开菜单", "关闭后焦点应该回到菜单钮");
});

test("全屏菜单：点一个栏目，菜单关上，它成为当前项", async () => {
  const { page } = storybook;
  await page.story("控件-topbar-顶栏与全屏菜单--with-menu");
  await page.click("button[aria-label=打开菜单]");
  await page.waitVisible(DIALOG);

  await page.click(`${DIALOG} li:nth-child(3) a`);
  await page.waitGone(DIALOG, "点了栏目之后菜单应该关上");
  assert.deepEqual(await page.text("#storybook-root [role=status]"), [
    "当前栏目：档案",
  ]);

  await page.click("button[aria-label=打开菜单]");
  await page.waitVisible(DIALOG);
  assert.deepEqual(await page.text(`${DIALOG} [aria-current=page]`), ["档案"]);
});

test("全屏菜单：当前项不只靠黄色；两个主题下它的焦点环都压得住底色", async () => {
  const { page } = storybook;
  for (const theme of ["light", "dark"] as const) {
    await page.story("控件-topbar-顶栏与全屏菜单--menu-open", theme);
    await page.waitVisible(DIALOG);
    await page.waitFocused("a:总览");
    await page.key("Tab");
    await page.waitFocused("a:调度");

    const current = await page.waitFor(async () => {
      const found = await page.evaluate(() => {
        const element = document.activeElement!;
        const style = getComputedStyle(element);
        return {
          current: element.getAttribute("aria-current"),
          weight: Number(style.fontWeight),
          background: style.backgroundColor,
          ring: style.outlineColor,
          ringStyle: style.outlineStyle,
          bar: getComputedStyle(element, "::before").width,
        };
      });
      return found.ringStyle === "solid" ? found : null;
    }, `${theme}：当前项应该有焦点环`);
    assert.equal(current.current, "page");
    assert.ok(current.weight >= 700, "当前项应该是粗体");
    assert.equal(current.bar, "4px", "当前项左缘应该有一条竖条");
    assert.notEqual(
      current.ring,
      current.background,
      `${theme}：焦点环和当前项的黄底是同一个颜色`,
    );
  }
});

test("320px 宽：顶栏不溢出，菜单里的东西都在视口里", async () => {
  const { page } = storybook;
  await page.setSize(320, 640);
  try {
    await page.story("控件-topbar-顶栏与全屏菜单--menu-open");
    await page.waitVisible(DIALOG);
    const result = await page.evaluate(() => ({
      pageScrolls:
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
      outside: [...document.querySelectorAll("[role=dialog] *")].filter(
        (element) => {
          if (element.closest("[aria-hidden=true]")) return false;
          const rect = element.getBoundingClientRect();
          return (
            rect.width > 0 &&
            (rect.right > innerWidth + 0.5 || rect.left < -0.5)
          );
        },
      ).length,
    }));
    assert.deepEqual(result, { pageScrolls: false, outside: 0 });

    await page.key("Escape");
    await page.waitGone(DIALOG);
    const bar = await page.evaluate(() => {
      const header = document.querySelector("#storybook-root header")!;
      const outer = header.getBoundingClientRect();
      return [...header.querySelectorAll("*")].every(
        (element) => element.getBoundingClientRect().right <= outer.right + 0.5,
      );
    });
    assert.ok(bar, "顶栏里的东西不应该伸到顶栏外面");
  } finally {
    await page.setSize(1200, 800);
  }
});
