// 反转主题：标题带、表头带、完成横幅换写法之后颜色不变；里面的控件按带子的底色取值
import assert from "node:assert/strict";
import { test } from "node:test";
import { useStorybook, type Page } from "./lib/harness.ts";

const storybook = useStorybook({ width: 1280, height: 800 });

/** 这个主题下页面的几个令牌实际是什么颜色 */
const pageTokens = (page: Page) =>
  page.evaluate(() => {
    // 每个令牌用一个新的探针：在同一个元素上改颜色会走过渡，立刻读到的是上一个值
    const read = (name: string) => {
      const probe = document.createElement("i");
      probe.style.color = `var(--ef-${name})`;
      document.querySelector("#storybook-root")!.append(probe);
      const color = getComputedStyle(probe).color;
      probe.remove();
      return color;
    };
    return {
      surface: read("surface"),
      surfaceInverse: read("surface-inverse"),
      inkInverse: read("ink-inverse"),
      focus: read("focus"),
    };
  });

const HEADER = "#storybook-root [data-theme=inverse]";

test("面板标题带：底和字还是页面的反转色，一点没变", async () => {
  const { page } = storybook;
  for (const theme of ["light", "dark"] as const) {
    await page.story("控件-panel-面板--band", theme);
    const tokens = await pageTokens(page);
    const band = await page.evaluate((css) => {
      const style = getComputedStyle(document.querySelector(css)!);
      return { fill: style.backgroundColor, ink: style.color };
    }, HEADER);
    assert.equal(band.fill, tokens.surfaceInverse, `${theme}：底`);
    assert.equal(band.ink, tokens.inkInverse, `${theme}：字`);
  }
  // 亮色页面上就是实测的那两个值
  await page.story("控件-panel-面板--band", "light");
  assert.deepEqual(await pageTokens(page), {
    surface: "rgb(255, 255, 255)",
    surfaceInverse: "rgb(25, 25, 25)",
    inkInverse: "rgb(255, 255, 255)",
    focus: "rgb(25, 25, 25)",
  });
});

test("标题带里的按钮：焦点环按带子取色，不和底融在一起", async () => {
  const { page } = storybook;
  for (const theme of ["light", "dark"] as const) {
    await page.story("控件-panel-面板--band-controls", theme);
    const tokens = await pageTokens(page);
    await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>("#storybook-root button")]
        .find((button) => button.textContent === "导出")!
        .focus(),
    );
    // 键盘焦点才画环：用 Tab 走一步再走回来
    await page.key("Tab");
    await page.key("Tab", { shift: true });
    await page.waitFocused("button:导出");
    // 轮廓的颜色是过渡过去的：等它到位再读
    await page.frames();
    const ring = await page.waitFor(async () => {
      const found = await page.evaluate(() => {
        const style = getComputedStyle(document.activeElement!);
        return { style: style.outlineStyle, color: style.outlineColor };
      });
      return found.style === "solid" ? found : null;
    }, `${theme}：按钮应该有焦点环`);
    assert.notEqual(
      ring.color,
      tokens.surfaceInverse,
      `${theme}：焦点环和标题带同色`,
    );
    // 页面的焦点色正是带子的颜色（亮色下都是墨色）——所以才要换主题
    if (theme === "light") assert.equal(tokens.focus, tokens.surfaceInverse);
  }
});

test("标题带里已选的复选框：方格和带子不是一个颜色", async () => {
  const { page } = storybook;
  for (const theme of ["light", "dark"] as const) {
    await page.story("控件-panel-面板--band-controls", theme);
    const tokens = await pageTokens(page);
    const look = () =>
      page.evaluate(() => {
        const input = document.querySelector<HTMLInputElement>(
          "#storybook-root [data-theme=inverse] input[type=checkbox]",
        )!;
        return {
          checked: input.checked,
          fill: getComputedStyle(input).backgroundColor,
        };
      });
    // 反转块里的反转块就是页面的颜色。方格的颜色是过渡过去的
    // （预览外壳挂载后才把主题写到 <html> 上），所以等它到位
    await page.waitFor(
      async () => (await look()).fill === tokens.surface,
      `${theme}：已选的方格应该是页面的底色 ${tokens.surface}`,
    );
    const box = await look();
    assert.ok(box.checked);
    assert.notEqual(
      box.fill,
      tokens.surfaceInverse,
      `${theme}：方格和带子同色`,
    );
  }
});

test("表头带里的全选：选中、半选的方格都看得见", async () => {
  const { page } = storybook;
  for (const theme of ["light", "dark"] as const) {
    await page.story("控件-table-表格--selectable", theme);
    const tokens = await pageTokens(page);
    const look = () =>
      page.evaluate(() => {
        const input = document.querySelector<HTMLInputElement>(
          "#storybook-root thead input",
        )!;
        return {
          theme: input.closest("[data-theme]")!.getAttribute("data-theme"),
          band: getComputedStyle(input.closest("th")!).backgroundColor,
          fill: getComputedStyle(input).backgroundColor,
        };
      });
    // 一开始选了一行：半选。方格的颜色是过渡过去的，等它到位再比
    // （已选和半选的方格是"反转块里的反转块"，也就是页面的底色）
    await page.waitFor(
      async () => (await look()).fill === tokens.surface,
      `${theme}：半选的方格应该是页面的底色 ${tokens.surface}`,
    );
    const mixed = await look();
    assert.equal(mixed.theme, "inverse");
    assert.equal(mixed.band, tokens.surfaceInverse, `${theme}：表头的底不变`);
    assert.notEqual(mixed.fill, mixed.band, `${theme}：半选的方格和带子同色`);

    await page.click("#storybook-root thead input");
    await page.waitFor(
      () =>
        page.evaluate(
          () =>
            document.querySelector<HTMLInputElement>(
              "#storybook-root thead input",
            )!.checked,
        ),
      "点全选应该全部选中",
    );
    await page.waitFor(
      async () => (await look()).fill === tokens.surface,
      `${theme}：选中的方格应该是页面的底色 ${tokens.surface}`,
    );
    const all = await look();
    assert.notEqual(all.fill, all.band, `${theme}：选中的方格和带子同色`);
  }
});

test("并排的亮、暗两个容器里，标题带各自反的是自己所在的主题", async () => {
  const { page } = storybook;
  await page.story("控件-panel-面板--band", "both");
  const bands = await page.evaluate(() =>
    [...document.querySelectorAll("#storybook-root [data-theme=inverse]")].map(
      (band) => ({
        around: band
          .parentElement!.closest("[data-theme]")!
          .getAttribute("data-theme"),
        fill: getComputedStyle(band).backgroundColor,
        scheme: getComputedStyle(band).colorScheme,
      }),
    ),
  );
  assert.deepEqual(bands, [
    { around: "light", fill: "rgb(25, 25, 25)", scheme: "dark" },
    { around: "dark", fill: "rgb(250, 250, 250)", scheme: "light" },
  ]);
});

test("标题带里打开的菜单：面板是带子实际的那个主题，不是 inverse", async () => {
  const { page } = storybook;
  for (const [theme, expected] of [
    ["light", "dark"],
    ["dark", "light"],
  ] as const) {
    await page.story("控件-panel-面板--band-controls", theme);
    await page.click("#storybook-root button[aria-label=更多操作]");
    await page.waitVisible("[role=menu]");
    const scope = await page.evaluate(
      () =>
        document
          .querySelector("[role=menu]")!
          .closest<HTMLElement>("[data-theme]")!.dataset.theme,
    );
    assert.equal(scope, expected, `${theme} 页面上，标题带里打开的菜单`);
    await page.key("Escape");
    await page.waitGone("[role=menu]");
  }
});

test("完成横幅：底不变，里面的行动按钮焦点环看得见", async () => {
  const { page } = storybook;
  for (const theme of ["light", "dark"] as const) {
    await page.story("控件-completionbanner-完成横幅--with-action", theme);
    const tokens = await pageTokens(page);
    const banner = await page.evaluate(() => {
      const element = document.querySelector("#storybook-root [role=status]")!;
      return {
        theme: element.getAttribute("data-theme"),
        fill: getComputedStyle(element).backgroundColor,
      };
    });
    assert.deepEqual(banner, { theme: "inverse", fill: tokens.surfaceInverse });

    await page.key("Tab");
    await page.waitFocused("button:领取奖励");
    // 轮廓的颜色是过渡过去的：等它到位再读
    await page.frames();
    const ring = await page.waitFor(async () => {
      const found = await page.evaluate(() => {
        const style = getComputedStyle(document.activeElement!);
        return { style: style.outlineStyle, color: style.outlineColor };
      });
      return found.style === "solid" ? found : null;
    }, `${theme}：按钮应该有焦点环`);
    assert.notEqual(ring.color, banner.fill, `${theme}：焦点环和横幅同色`);
  }
});
