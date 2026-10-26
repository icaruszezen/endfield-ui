// 按钮族的外形和配色：4px 圆角、图标和文字之间的细竖线、暗色主题下半透明的 control、
// 固定的红色 danger、带点阵的 light。都读计算样式的终态，颜色一律等到目标值再断言：
// 暗色主题是载入之后过渡过去的，悬停也是
import assert from "node:assert/strict";
import { test } from "node:test";
import { useStorybook, type Page } from "./lib/harness.ts";

const storybook = useStorybook();

const ROOT = "#storybook-root";
const button = (variant: string) => `${ROOT} [data-variant=${variant}]`;

/** 第 `nth` 个匹配元素的一项计算样式 */
const style = (
  page: Page,
  selector: string,
  property:
    "backgroundColor" | "backgroundImage" | "color" | "borderTopLeftRadius",
  nth = 0,
) =>
  page.evaluate(
    (css, name, index) => {
      const element = document.querySelectorAll(css)[index];
      return element ? getComputedStyle(element)[name] : null;
    },
    selector,
    property,
    nth,
  );

/** 指针移到元素上，等 :hover 真的生效、颜色过渡走完 */
async function hover(page: Page, selector: string) {
  await page.moveTo(selector);
  await page.waitFor(
    () =>
      page.evaluate(
        (css) => document.querySelector(css)?.matches(":hover") ?? false,
        selector,
      ),
    `指针应该停在 ${selector} 上`,
  );
  await page.settled();
}

test("按钮族：text 和圆形图标钮以外都是 4px 圆角，按钮里没有竖条", async () => {
  const { page } = storybook;
  await page.story("控件-button-按钮--variants");
  for (const variant of ["action", "control", "light", "back", "danger"]) {
    assert.equal(
      await style(page, button(variant), "borderTopLeftRadius"),
      "4px",
      `${variant} 应该是 4px 圆角`,
    );
  }
  assert.equal(
    await style(page, button("text"), "borderTopLeftRadius"),
    "0px",
    "text 变体靠下划线成形，不带圆角",
  );
  assert.equal(
    await page.evaluate(
      (css) => document.querySelectorAll(css).length,
      `${ROOT} .marker-bar`,
    ),
    0,
    "按钮左侧不再有竖条",
  );

  // 图标钮：plain、accent、inverse 是方的，最后一个 floating 是圆的
  await page.story("控件-iconbutton-图标按钮--variants");
  for (const nth of [0, 1, 2]) {
    assert.equal(
      await style(page, `${ROOT} button`, "borderTopLeftRadius", nth),
      "4px",
      `第 ${nth + 1} 个方形图标钮应该是 4px 圆角`,
    );
  }
  const round = await style(page, `${ROOT} button`, "borderTopLeftRadius", 3);
  assert.ok(
    round !== null && parseFloat(round) >= 20,
    `floating 应该还是圆的，读到的圆角是 ${round}`,
  );

  await page.story("控件-navaction-主行动块--layouts");
  const layouts = await page.evaluate(
    (css) =>
      [...document.querySelectorAll(css)].map(
        (element) => getComputedStyle(element).borderTopLeftRadius,
      ),
    `${ROOT} [data-layout]`,
  );
  assert.deepEqual(layouts, ["4px", "4px", "4px"], "主行动块三种摆法都是 4px");

  await page.story("控件-pageheader-页头--with-back");
  assert.equal(
    await style(page, `${ROOT} [data-page-header-back]`, "borderTopLeftRadius"),
    "4px",
    "页头的返回钮和按钮一样是 4px 圆角",
  );
});

test("control：亮色主题是 #383838；暗色主题下是半透明的白，悬停再亮一档、字变白", async () => {
  const { page } = storybook;
  const control = button("control");

  await page.story("控件-button-按钮--variants");
  await page.waitEqual(
    () => style(page, control, "backgroundColor"),
    "rgb(56, 56, 56)",
    "亮色主题下 control 是深灰",
  );

  await page.story("控件-button-按钮--variants", "dark");
  await page.waitEqual(
    () => style(page, control, "backgroundColor"),
    "rgba(255, 255, 255, 0.2)",
    "暗色主题下 control 是白 20%",
  );
  await page.waitEqual(
    () => style(page, control, "color"),
    "rgb(217, 217, 217)",
    "暗色主题下 control 的字比白暗一档",
  );
  await hover(page, control);
  await page.waitEqual(
    () => style(page, control, "backgroundColor"),
    "rgba(255, 255, 255, 0.3)",
    "悬停时白 30%",
  );
  await page.waitEqual(
    () => style(page, control, "color"),
    "rgb(255, 255, 255)",
    "悬停时字变白",
  );
});

test("danger 和 light 两个主题下取值一样：danger 是红底白字；light 是浅灰底叠点阵，悬停变浅、不变黄", async () => {
  const { page } = storybook;
  for (const theme of ["light", "dark"] as const) {
    await page.story("控件-button-按钮--variants", theme);
    await page.waitEqual(
      () =>
        Promise.all([
          style(page, button("danger"), "backgroundColor"),
          style(page, button("danger"), "color"),
        ]),
      ["rgb(222, 9, 9)", "rgb(255, 255, 255)"],
      `${theme}：danger 是红底白字`,
    );

    const light = button("light");
    await page.waitEqual(
      () => style(page, light, "backgroundColor"),
      "rgb(242, 242, 242)",
      `${theme}：light 是浅灰底`,
    );
    const image = await style(page, light, "backgroundImage");
    assert.ok(
      image?.startsWith("radial-gradient("),
      `${theme}：light 上叠着一层点阵，读到的是 ${image}`,
    );
    await hover(page, light);
    await page.waitEqual(
      () => style(page, light, "backgroundColor"),
      "rgb(250, 250, 250)",
      `${theme}：light 悬停时变浅，不变黄`,
    );
  }
});

test("有图标时，图标和文字之间是一条 1px 宽的细竖线，两边各隔一个间距", async () => {
  const { page } = storybook;
  await page.story("控件-button-按钮--with-icons");
  const found = await page.evaluate((css) => {
    const divider = document.querySelector(css)!;
    const icon = divider.previousElementSibling!;
    // 文字是竖线后面的文本节点，量它的范围
    const range = document.createRange();
    range.selectNodeContents(divider.parentElement!);
    range.setStartAfter(divider);
    const rect = divider.getBoundingClientRect();
    return {
      icon: icon.tagName.toLowerCase(),
      width: rect.width,
      height: rect.height,
      before: rect.left - icon.getBoundingClientRect().right,
      after: range.getBoundingClientRect().left - rect.right,
    };
  }, `${ROOT} [data-button-divider]`);

  assert.equal(found.icon, "svg", "竖线前面是图标");
  assert.deepEqual(
    [found.width, found.height],
    [1, 14],
    "默认尺寸的竖线是 1 × 14px",
  );
  assert.ok(
    Math.abs(found.before - 8) < 0.5 && Math.abs(found.after - 8) < 0.5,
    `竖线两边各隔 8px，读到的是 ${found.before} / ${found.after}`,
  );
});
