// 工具栏：整条只占一个 Tab 停靠点、方向键走一圈、开关钮的样子、菜单的触发钮、尺寸
import assert from "node:assert/strict";
import { test } from "node:test";
import { useStorybook, type Page } from "./lib/harness.ts";

const storybook = useStorybook();

const BAR = "#storybook-root [role=toolbar]";

/** 一个令牌算出来的颜色。每个令牌新建一个探针：同一个元素上连着改再读，读到的是过渡的起点 */
const token = (page: Page, name: string) =>
  page.evaluate((variable) => {
    const probe = document.createElement("i");
    probe.style.color = `var(${variable})`;
    document.querySelector("#storybook-root > *")!.append(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
  }, name);

/** 名称是这个的那个钮：底色、字色、图标的颜色、按没按下 */
const look = (page: Page, name: string) =>
  page.evaluate((label) => {
    const button = [
      ...document.querySelectorAll<HTMLElement>(
        "#storybook-root [role=toolbar] button",
      ),
    ].find(
      (node) =>
        (node.getAttribute("aria-label") ?? node.textContent?.trim()) === label,
    )!;
    const style = getComputedStyle(button);
    const icon = button.querySelector("span");
    return {
      background: style.backgroundColor,
      color: style.color,
      icon: icon ? getComputedStyle(icon).color : null,
      pressed: button.getAttribute("aria-pressed"),
    };
  }, name);

/** 现在看得见的提示各自的文字（定位层是 presentation，小三角对读屏隐藏，剩下的是提示本身） */
const tooltips = (page: Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll("[data-side][data-open]")]
      .filter(
        (element) =>
          element.getAttribute("role") !== "presentation" &&
          !element.hasAttribute("aria-hidden"),
      )
      .map((element) => (element.textContent ?? "").trim()),
  );

const status = async (page: Page) =>
  (await page.text("#storybook-root [role=status]"))[0];

test("键盘：Tab 进来只停一次，方向键走一圈绕回来，Home / End 到两头，Tab 出去", async () => {
  const { page } = storybook;
  await page.story("控件-toolbar-工具栏--with-overlays");
  await page.key("Tab");
  await page.waitFocused("button:复制链接", "Tab 应该落在第一个钮上");
  await page.key("ArrowRight");
  await page.waitFocused("button:打印");
  await page.key("ArrowRight");
  await page.waitFocused("button:导出");
  await page.key("ArrowRight");
  await page.waitFocused("button:复制链接", "走到头应该绕回第一个");
  await page.key("ArrowLeft");
  await page.waitFocused("button:导出", "第一个按 ← 应该绕到最后一个");
  await page.key("Home");
  await page.waitFocused("button:复制链接", "Home 应该到第一个");
  await page.key("End");
  await page.waitFocused("button:导出", "End 应该到最后一个");

  // 里面一共三个钮，只有一个在 Tab 序列里
  assert.deepEqual(
    await page.evaluate(
      (css) =>
        [...document.querySelectorAll<HTMLElement>(`${css} button`)].map(
          (button) => button.tabIndex,
        ),
      BAR,
    ),
    [-1, -1, 0],
  );

  await page.key("Tab");
  await page.waitFor(
    () =>
      page.evaluate(
        (css) => !document.activeElement?.closest(css),
        "[role=toolbar]",
      ),
    "Tab 应该直接离开工具栏",
  );
  // 回来落在上次停的那一个上
  await page.key("Tab", { shift: true });
  await page.waitFocused("button:导出", "Shift+Tab 回来应该落在上次停的钮上");
});

test("有焦点的钮上有焦点环，压在旁边的钮上面", async () => {
  const { page } = storybook;
  await page.story("控件-toolbar-工具栏--with-overlays");
  await page.key("Tab");
  await page.key("ArrowRight");
  await page.waitFocused("button:打印");
  await page.waitFor(
    () =>
      page.evaluate(() => {
        const style = getComputedStyle(document.activeElement!);
        return (
          style.outlineStyle === "solid" &&
          style.outlineWidth === "2px" &&
          style.zIndex === "1"
        );
      }),
    "键盘聚焦的钮应该有 2px 的焦点环，并且提到旁边的钮之上",
  );
});

test("开关钮按下：填充反转，字是反转的墨色、图标是黄记号；悬停不把它盖掉（亮暗两套）", async () => {
  const { page } = storybook;
  for (const theme of ["light", "dark"] as const) {
    await page.story("控件-toolbar-工具栏--toggles", theme);
    await page.frames();
    const inverse = await token(page, "--ef-surface-inverse");
    const inkInverse = await token(page, "--ef-ink-inverse");
    const mark = await token(page, "--ef-accent-ink-inverse");
    const secondary = await token(page, "--ef-ink-secondary");
    const bar = await page.evaluate(
      (css) => getComputedStyle(document.querySelector(css)!).backgroundColor,
      BAR,
    );
    assert.notEqual(inverse, bar, `${theme}：按下的底和带子同色`);

    // 有字的：字是反转的墨色
    const text = await look(page, "标准");
    assert.deepEqual(
      [text.pressed, text.background, text.color],
      ["true", inverse, inkInverse],
      `${theme}：按下的"标准"`,
    );
    // 只有图标的：图标是黄记号
    const icon = await look(page, "路线");
    assert.deepEqual(
      [icon.pressed, icon.background, icon.icon],
      ["true", inverse, mark],
      `${theme}：按下的"路线"`,
    );
    // 没按下的：透明底、次级墨色
    const rest = await look(page, "等高线");
    assert.deepEqual(
      [rest.pressed, rest.background, rest.color, rest.icon],
      ["false", "rgba(0, 0, 0, 0)", secondary, secondary],
      `${theme}：没按下的"等高线"`,
    );

    // 悬停在按下的钮上：还是反转填充
    await page.moveTo("text=路线");
    await page.pause(350);
    assert.equal(
      (await look(page, "路线")).background,
      inverse,
      `${theme}：悬停把按下的底色盖掉了`,
    );
    // 悬停在没按下的钮上：出一层底
    await page.moveTo("text=等高线");
    await page.waitFor(
      async () =>
        (await look(page, "等高线")).background !== "rgba(0, 0, 0, 0)",
      `${theme}：悬停在没按下的钮上应该有底色`,
    );
  }
});

test("开关组：单选的按下这个那个弹起，再点一次可以一个都不按；multiple 能同时按下几个", async () => {
  const { page } = storybook;
  await page.story("控件-toolbar-工具栏--toggles");
  assert.equal(await status(page), "// 行高 md　图层 route、beacon　加重线 关");

  await page.click("text=紧凑");
  await page.waitFor(
    async () => (await look(page, "标准")).pressed === "false",
    "按下紧凑，标准应该弹起来",
  );
  assert.equal((await look(page, "紧凑")).pressed, "true");
  await page.click("text=紧凑");
  await page.waitFor(
    async () =>
      (await status(page)) === "// 行高 没选　图层 route、beacon　加重线 关",
    "再点一次应该弹起来，一个都不按",
  );

  // 键盘（焦点已经在刚点过的钮上）：走到"等高线"上按空格，三个图层都按下了
  await page.key("End");
  await page.waitFocused("button:加重线");
  await page.key("ArrowLeft");
  await page.waitFocused("button:等高线");
  await page.key(" ");
  await page.waitFor(
    async () =>
      (await status(page)) ===
      "// 行高 没选　图层 route、beacon、contour　加重线 关",
    "空格应该按下等高线，另外两个不动",
  );
  await page.key("End");
  await page.key("Enter");
  await page.waitFor(
    async () => (await look(page, "加重线")).pressed === "true",
    "回车应该按下单独的开关钮",
  );
});

test("菜单的触发钮：方向键走得到，回车打开，开着时保持按下的样子，Esc 关了焦点回来", async () => {
  const { page } = storybook;
  await page.story("控件-toolbar-工具栏--with-overlays");
  await page.frames();
  const inverse = await token(page, "--ef-surface-inverse");
  await page.key("Tab");
  await page.key("ArrowRight");
  await page.key("ArrowRight");
  await page.waitFocused("button:导出", "方向键应该走得到菜单的触发钮");

  await page.key("Enter");
  await page.waitVisible("[role=menu]");
  await page.waitFocused(/^menuitem:/, "打开后焦点应该进菜单");
  await page.waitFor(
    async () => (await look(page, "导出")).background === inverse,
    "菜单开着的时候触发钮应该是反转填充",
  );

  await page.key("Escape");
  await page.waitGone("[role=menu]");
  await page.waitFocused("button:导出", "关了之后焦点应该回到触发钮");
  await page.waitFor(
    async () => (await look(page, "导出")).background !== inverse,
    "菜单关了，触发钮应该回到平时的样子",
  );
  // 还在工具栏里：接着用方向键
  await page.key("ArrowLeft");
  await page.waitFocused("button:打印", "菜单关了之后方向键应该还管用");

  // 用鼠标点开、选一项
  await page.click("text=导出");
  await page.waitVisible("[role=menu]");
  await page.click("text=导出为文本");
  await page.waitFor(
    async () => (await status(page)) === "// 导出为文本",
    "点菜单项应该触发",
  );
  await page.waitGone("[role=menu]");
});

test("文字提示包着的钮：聚焦时提示出现，它仍然是工具栏里的一项", async () => {
  const { page } = storybook;
  await page.story("控件-toolbar-工具栏--with-overlays");
  await page.key("Tab");
  await page.waitFocused("button:复制链接");
  await page.waitFor(
    async () => (await tooltips(page)).includes("复制这一页的链接"),
    "键盘聚焦时应该出现提示",
  );
  await page.key("Enter");
  await page.waitFor(
    async () => (await status(page)) === "// 复制链接",
    "回车应该触发这个钮",
  );
  await page.key("ArrowRight");
  await page.waitFocused("button:打印");
  await page.waitFor(
    async () => (await tooltips(page)).length === 0,
    "焦点移走之后提示应该消失",
  );
});

test("禁用的钮：方向键走得到，读得出不可用，颜色降一档", async () => {
  const { page } = storybook;
  await page.story("控件-toolbar-工具栏--states");
  await page.frames();
  const disabled = await token(page, "--ef-ink-disabled");
  await page.key("Tab");
  await page.waitFocused("button:打印");
  await page.key("ArrowRight");
  await page.waitFocused("button:导出", "禁用的钮应该仍然走得到");
  const found = await page.evaluate(() => {
    const button = document.activeElement as HTMLButtonElement;
    return {
      ariaDisabled: button.getAttribute("aria-disabled"),
      nativeDisabled: button.disabled,
      color: getComputedStyle(button).color,
      cursor: getComputedStyle(button).cursor,
    };
  });
  assert.deepEqual(found, {
    ariaDisabled: "true",
    nativeDisabled: false,
    color: disabled,
    cursor: "not-allowed",
  });

  // 整条禁用里按下的那个：禁用的底，不是反转填充
  const off = await token(page, "--ef-disabled");
  const pressed = await page.evaluate(() => {
    const bars = document.querySelectorAll("#storybook-root [role=toolbar]");
    const button = bars[2]!.querySelector("button[aria-pressed=true]")!;
    return getComputedStyle(button).backgroundColor;
  });
  assert.equal(pressed, off, "按下又禁用应该是禁用的底色");
});

test("尺寸：带子 32 / 40px 高，钮 28 / 36px；md 的点击区上下补到带子的边", async () => {
  const { page } = storybook;
  await page.story("控件-toolbar-工具栏--sizes");
  const found = await page.evaluate(() => {
    const [small, medium] = [
      ...document.querySelectorAll<HTMLElement>(
        "#storybook-root [role=toolbar]",
      ),
    ];
    const button = (bar: HTMLElement) => bar.querySelector("button")!;
    const rect = button(medium!).getBoundingClientRect();
    const middle = rect.left + rect.width / 2;
    return {
      bars: [small!.offsetHeight, medium!.offsetHeight],
      buttons: [button(small!).offsetHeight, button(medium!).offsetHeight],
      iconOnly: [button(small!).offsetWidth, button(medium!).offsetWidth],
      // 钮上沿之外 1px（带子的内边距里）点下去，点到的还是它
      hitAbove:
        document.elementFromPoint(middle, rect.top - 1) === button(medium!),
      hitBelow:
        document.elementFromPoint(middle, rect.bottom + 1) === button(medium!),
    };
  });
  assert.deepEqual(found, {
    bars: [32, 40],
    buttons: [28, 36],
    iconOnly: [28, 36],
    hitAbove: true,
    hitBelow: true,
  });
});

test("和输入框并排：描边的带子和输入框一样高、上下对齐", async () => {
  const { page } = storybook;
  await page.story("控件-toolbar-工具栏--outline");
  const found = await page.evaluate(() => {
    const bar = document
      .querySelector("#storybook-root [role=toolbar]")!
      .getBoundingClientRect();
    const input = document
      .querySelector("#storybook-root input")!
      .parentElement!.getBoundingClientRect();
    return {
      heights: [bar.height, input.height],
      aligned: Math.abs(bar.bottom - input.bottom) < 0.5,
    };
  });
  assert.deepEqual(found, { heights: [40, 40], aligned: true });
});

test("竖排：钮排成一列，上下方向键在里面走，左右不管", async () => {
  const { page } = storybook;
  await page.story("控件-toolbar-工具栏--vertical");
  const lefts = await page.evaluate(
    (css) => [
      ...new Set(
        [...document.querySelectorAll(`${css} button`)].map((button) =>
          Math.round(button.getBoundingClientRect().left),
        ),
      ),
    ],
    BAR,
  );
  assert.equal(lefts.length, 1, "竖排的钮应该在同一列");

  await page.key("Tab");
  await page.waitFocused("button:放大");
  await page.key("ArrowDown");
  await page.waitFocused("button:缩小");
  await page.key("ArrowRight");
  await page.pause(200);
  assert.equal(await page.focused(), "button:缩小", "竖排时 → 不应该移动焦点");
  await page.key("ArrowDown");
  await page.waitFocused("button:路线", "↓ 应该走进开关组");
  await page.key("End");
  await page.waitFocused("button:等高线");
});

test("链接形态：是真的链接，也在方向键的序列里；禁用的没有地址", async () => {
  const { page } = storybook;
  await page.story("控件-toolbar-工具栏--links");
  await page.key("Tab");
  await page.waitFocused("button:打印");
  await page.key("ArrowRight");
  await page.waitFocused("a:去档案");
  await page.key("ArrowRight");
  await page.waitFocused("a:帮助");
  const found = await page.evaluate(
    (css) =>
      [...document.querySelectorAll<HTMLAnchorElement>(`${css} a`)].map(
        (link) => [
          link.getAttribute("href"),
          link.getAttribute("aria-disabled"),
        ],
      ),
    BAR,
  );
  assert.deepEqual(found, [
    ["#archive", null],
    ["#help", null],
    [null, "true"],
  ]);
});
