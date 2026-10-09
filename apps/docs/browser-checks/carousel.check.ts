// 媒体轮播：翻页后轨道真的滚到了那一张、键盘、不在眼前的幻灯片走不进去、自己滑、窄屏不溢出
import assert from "node:assert/strict";
import { test } from "node:test";
import { useStorybook, type Page } from "./lib/harness.ts";

const storybook = useStorybook();

const ROOT = "#storybook-root [aria-roledescription=轮播]";
const TRACK = `${ROOT} [tabindex="0"]`;

const state = (page: Page) =>
  page.evaluate(() => {
    const root = document.querySelector(
      "#storybook-root [aria-roledescription=轮播]",
    )!;
    const track = root.querySelector<HTMLElement>('[tabindex="0"]')!;
    const slides = [...track.querySelectorAll("[aria-roledescription=幻灯片]")];
    const view = track.getBoundingClientRect();
    return {
      count: root.querySelector("[aria-hidden=true] span")!.textContent,
      title: root.querySelector("[aria-live] p")?.textContent ?? "",
      // 哪一张正好铺满轨道
      showing: slides.findIndex(
        (slide) =>
          Math.abs(slide.getBoundingClientRect().left - view.left) < 1.5,
      ),
      inert: slides.map((slide) => slide.hasAttribute("inert")),
      buttons: [...root.querySelectorAll<HTMLButtonElement>("button")].map(
        (button) => button.disabled,
      ),
    };
  });

test("翻页钮：点下一张，轨道滚到那一张，计数和说明跟着换；到头时禁用", async () => {
  const { page } = storybook;
  await page.story("控件-carousel-媒体轮播--playground");
  const first = await state(page);
  assert.equal(first.count, "1 / 5");
  assert.equal(first.showing, 0);
  assert.deepEqual(first.buttons, [true, false], "在第一张，上一张应该禁用");

  await page.click("text=下一张");
  await page.waitFor(async () => {
    const now = await state(page);
    return now.count === "2 / 5" && now.showing === 1;
  }, "点下一张：计数变成 2 / 5，轨道滚到第二张");
  assert.equal((await state(page)).title, "物资调度");

  for (let i = 0; i < 3; i++) await page.click("text=下一张");
  const end = await page.waitFor(async () => {
    const now = await state(page);
    return now.count === "5 / 5" && now.showing === 4 ? now : null;
  }, "一路点到最后一张");
  assert.deepEqual(end.buttons, [false, true], "在最后一张，下一张应该禁用");
});

test("翻页钮压在媒体的左下角，不跟着轨道滚走", async () => {
  const { page } = storybook;
  await page.story("控件-carousel-媒体轮播--playground");
  const place = () =>
    page.evaluate(() => {
      const root = document.querySelector(
        "#storybook-root [aria-roledescription=轮播]",
      )!;
      const track = root
        .querySelector('[tabindex="0"]')!
        .getBoundingClientRect();
      const button = root.querySelector("button")!.getBoundingClientRect();
      return {
        left: Math.round(button.left - track.left),
        bottom: Math.round(track.bottom - button.bottom),
      };
    });
  const before = await place();
  assert.deepEqual(before, { left: 12, bottom: 12 });
  await page.click("text=下一张");
  await page.waitFor(
    async () => (await state(page)).showing === 1,
    "轨道滚到第二张",
  );
  assert.deepEqual(await place(), before, "轨道滚了，翻页钮应该还在原处");
});

test("键盘：焦点在媒体上，← → 翻页，Home / End 到两头；媒体上有焦点环", async () => {
  const { page } = storybook;
  await page.story("控件-carousel-媒体轮播--playground");
  // 第一张时上一张是禁用的：Tab 先到媒体
  await page.key("Tab");
  const ring = await page.waitFor(async () => {
    const found = await page.evaluate(() => {
      const element = document.activeElement!;
      const style = getComputedStyle(element);
      return {
        track: element.getAttribute("tabindex") === "0",
        style: style.outlineStyle,
      };
    });
    return found.track && found.style === "solid" ? found : null;
  }, "Tab 应该落在媒体上，并且有焦点环");
  assert.ok(ring.track);

  await page.key("ArrowRight");
  await page.waitFor(
    async () => (await state(page)).showing === 1,
    "→ 翻到第二张",
  );
  await page.key("End");
  await page.waitFor(
    async () => (await state(page)).showing === 4,
    "End 翻到最后一张",
  );
  await page.key("ArrowLeft");
  await page.waitFor(
    async () => (await state(page)).count === "4 / 5",
    "← 翻回第四张",
  );
  await page.key("Home");
  await page.waitFor(
    async () => (await state(page)).showing === 0,
    "Home 回到第一张",
  );
});

test("不在眼前的幻灯片是 inert 的：Tab 只走得到当前这一张里的链接", async () => {
  const { page } = storybook;
  await page.story("控件-carousel-媒体轮播--with-links");
  assert.deepEqual((await state(page)).inert, [false, true, true]);

  // 媒体 → 当前这一张里的链接 → 下一张（上一张是禁用的）
  await page.key("Tab");
  await page.key("Tab");
  await page.waitFocused("a:了解线路测绘");
  await page.key("Tab");
  await page.waitFocused("button:下一张", "第二、三张里的链接不应该被走到");

  await page.key("Enter");
  await page.waitFor(
    async () => (await state(page)).inert.join() === "true,false,true",
    "翻到第二张之后，只有第二张不是 inert",
  );
});

test("到头：刚按的翻页钮禁用了，焦点交给媒体，方向键还能翻回去", async () => {
  const { page } = storybook;
  await page.story("控件-carousel-媒体轮播--with-links");
  await page.click("text=下一张");
  await page.click("text=下一张");
  await page.waitFor(
    async () => (await state(page)).showing === 2,
    "点两次到最后一张",
  );
  assert.ok(
    await page.evaluate(
      () => document.activeElement?.getAttribute("tabindex") === "0",
    ),
    "焦点应该交给了媒体",
  );
  await page.key("ArrowLeft");
  await page.waitFor(
    async () => (await state(page)).showing === 1,
    "← 应该还能翻回去",
  );
});

test("用户自己滑：轨道停稳之后计数和说明跟过去", async () => {
  const { page } = storybook;
  await page.story("控件-carousel-媒体轮播--playground");
  await page.evaluate((css) => {
    const track = document.querySelector<HTMLElement>(css)!;
    track.scrollTo({ left: track.clientWidth * 2, behavior: "instant" });
  }, TRACK);
  await page.waitFor(async () => {
    const now = await state(page);
    return now.count === "3 / 5" && now.title === "站点维护";
  }, "滑到第三张，停稳之后应该是 3 / 5");
});

test("首尾相接：最后一张再点下一张回到第一张；短横跟着走", async () => {
  const { page } = storybook;
  await page.story("控件-carousel-媒体轮播--indicator");
  const dash = () =>
    page.evaluate(() =>
      [
        ...document.querySelectorAll(
          "#storybook-root [aria-roledescription=轮播] [role=img] > span",
        ),
      ].findIndex((line) => line.hasAttribute("data-current")),
    );
  assert.deepEqual((await state(page)).buttons, [false, false]);
  await page.click("text=上一张");
  await page.waitFor(async () => {
    const now = await state(page);
    return now.count === "5 / 5" && now.showing === 4;
  }, "第一张点上一张应该绕到最后一张");
  assert.equal(await dash(), 4);
  await page.click("text=下一张");
  await page.waitFor(
    async () => (await state(page)).showing === 0 && (await dash()) === 0,
    "最后一张点下一张应该回到第一张",
  );
});

test("宽度变了：轨道重新对到当前这一张，不停在两张中间", async () => {
  const { page } = storybook;
  await page.story("控件-carousel-媒体轮播--playground");
  await page.click("text=下一张");
  await page.click("text=下一张");
  await page.waitFor(
    async () => (await state(page)).showing === 2,
    "翻到第三张",
  );
  await page.setSize(520, 800);
  try {
    await page.waitFor(async () => {
      const now = await state(page);
      return now.showing === 2 && now.count === "3 / 5";
    }, "变窄之后应该还是整张的第三张");
  } finally {
    await page.setSize(1200, 800);
  }
  assert.ok(await page.visible(ROOT));
});
