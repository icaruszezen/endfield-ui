// 滑块：键盘、拖动、点轨道、范围滑块推不过去、到头不伸出去、刻度对得上滑块
import assert from "node:assert/strict";
import { test } from "node:test";
import { useStorybook, type Page } from "./lib/harness.ts";

const storybook = useStorybook();

const INPUT = "#storybook-root input[type=range]";

const values = (page: Page) =>
  page.evaluate(() =>
    [
      ...document.querySelectorAll<HTMLInputElement>(
        "#storybook-root input[type=range]",
      ),
    ].map((input) => Number(input.value)),
  );

/** 轨道和各个滑块的位置 */
const geometry = (page: Page) =>
  page.evaluate(() => {
    const root = document.querySelector("#storybook-root [data-size]")!;
    // 结构是：根 > 一层包着轨道和刻度的 div > 控制区 > 轨道
    const control = root.querySelector(":scope > div > div")!;
    const track = control.firstElementChild!;
    const box = (element: Element) => {
      const rect = element.getBoundingClientRect();
      return {
        left: rect.left,
        right: rect.right,
        width: rect.width,
        center: rect.left + rect.width / 2,
        middle: rect.top + rect.height / 2,
      };
    };
    return {
      control: box(control),
      track: box(track),
      thumbs: [...track.querySelectorAll("[data-index]")].map(box),
    };
  });

test("键盘：Tab 聚焦，方向键一步，PageUp 一大步，Home / End 到两端；数值跟着变", async () => {
  const { page } = storybook;
  await page.story("控件-slider-滑块--playground");
  const shown = async () => (await page.text("#storybook-root output"))[0];
  assert.deepEqual(await values(page), [40]);

  await page.key("Tab");
  await page.waitFocused("input:音量");
  await page.key("ArrowRight");
  await page.waitFor(async () => (await values(page))[0] === 41, "→ 加一步");
  await page.key("ArrowLeft");
  await page.key("ArrowLeft");
  await page.waitFor(async () => (await values(page))[0] === 39, "← 减一步");
  await page.key("PageUp");
  await page.waitFor(
    async () => (await values(page))[0] === 49,
    "PageUp 加一大步",
  );
  assert.equal(await shown(), "49");
  await page.key("End");
  await page.waitFor(async () => (await values(page))[0] === 100, "End 到头");
  await page.key("Home");
  await page.waitFor(async () => (await values(page))[0] === 0, "Home 到底");
  assert.equal(await shown(), "0");
});

test("键盘聚焦时滑块上有焦点环", async () => {
  const { page } = storybook;
  for (const theme of ["light", "dark"] as const) {
    await page.story("控件-slider-滑块--playground", theme);
    await page.key("Tab");
    const ring = await page.waitFor(async () => {
      const found = await page.evaluate(() => {
        const thumb = document.querySelector(
          "#storybook-root [data-index]",
        ) as HTMLElement;
        const style = getComputedStyle(thumb);
        return {
          style: style.outlineStyle,
          width: style.outlineWidth,
          color: style.outlineColor,
          fill: style.backgroundColor,
        };
      });
      return found.style === "solid" && found.width === "2px" ? found : null;
    }, `${theme}：滑块应该有 2px 的焦点环`);
    assert.notEqual(ring.color, "rgba(0, 0, 0, 0)", `${theme}：焦点环是透明的`);
  }
});

test("到两端时滑块不伸到控件外面；走过的一段跟到滑块的中心", async () => {
  const { page } = storybook;
  await page.story("控件-slider-滑块--playground");
  await page.key("Tab");

  // 位置是过渡过去的（"减少动态效果"下也有一个极短的过渡），所以量位置要等它到位
  await page.key("Home");
  const atMin = await page.waitFor(async () => {
    const found = await geometry(page);
    return Math.abs(found.thumbs[0]!.center - found.track.left) < 1
      ? found
      : null;
  }, "在下限时滑块的中心应该在轨道的左端");
  assert.ok(
    atMin.thumbs[0]!.left >= atMin.control.left - 0.5,
    "在下限时滑块不应该伸出左边",
  );

  await page.key("End");
  const atMax = await page.waitFor(async () => {
    const found = await geometry(page);
    return Math.abs(found.thumbs[0]!.center - found.track.right) < 1
      ? found
      : null;
  }, "在上限时滑块的中心应该在轨道的右端");
  assert.ok(
    atMax.thumbs[0]!.right <= atMax.control.right + 0.5,
    "在上限时滑块不应该伸出右边",
  );
});

test("拖动：把滑块拖到轨道的四分之三处，值跟过去", async () => {
  const { page } = storybook;
  await page.story("控件-slider-滑块--playground");
  const before = await geometry(page);
  const thumb = before.thumbs[0]!;
  const target = before.track.left + before.track.width * 0.75;

  await page.drag(
    { x: thumb.center, y: thumb.middle },
    { x: target, y: thumb.middle },
  );
  await page.waitFor(
    async () => Math.abs((await values(page))[0]! - 75) <= 1,
    "拖到四分之三处，值应该在 75 上下",
  );
  await page.waitFor(
    async () =>
      Math.abs((await geometry(page)).thumbs[0]!.center - target) <= 3,
    "滑块应该停在松手的地方",
  );
});

test("点轨道：滑块跳过去", async () => {
  const { page } = storybook;
  await page.story("控件-slider-滑块--playground");
  const { track } = await geometry(page);
  await page.click({
    x: track.left + track.width * 0.2,
    y: (await geometry(page)).thumbs[0]!.middle,
  });
  await page.waitFor(
    async () => Math.abs((await values(page))[0]! - 20) <= 1,
    "点轨道五分之一处，值应该在 20 上下",
  );
});

test("范围滑块：两个滑块各有名称，互相推不过去；数值写成一段", async () => {
  const { page } = storybook;
  await page.story("控件-slider-滑块--range");
  assert.deepEqual(await values(page), [20, 60]);
  assert.deepEqual(
    await page.evaluate(() =>
      [...document.querySelectorAll("#storybook-root input[type=range]")].map(
        (input) => input.getAttribute("aria-label"),
      ),
    ),
    ["最小值", "最大值"],
  );

  // 下限一路往右推：停在离上限一步的地方
  await page.key("Tab");
  await page.waitFocused("input:最小值");
  for (let i = 0; i < 12; i++) await page.key("ArrowRight");
  await page.waitFor(
    async () => (await values(page)).join() === "55,60",
    "下限应该停在 55：两个滑块至少隔一步（5 吨）",
  );
  assert.equal((await page.text("#storybook-root output"))[0], "55 – 60");

  await page.key("Tab");
  await page.waitFocused("input:最大值");
  await page.key("ArrowLeft");
  await page.pause(150);
  assert.deepEqual(await values(page), [55, 60], "上限也推不过下限");
});

test("刻度：标注的短线对着滑块的中心；两端的标注不伸到控件外面", async () => {
  const { page } = storybook;
  await page.story("控件-slider-滑块--marks");
  const found = await page.evaluate(() => {
    const root = document.querySelector("#storybook-root [data-size]")!;
    const box = root.getBoundingClientRect();
    const thumb = root.querySelector("[data-index]")!.getBoundingClientRect();
    const marks = [
      ...root.querySelectorAll<HTMLElement>("[aria-hidden=true] > span"),
    ].map((mark) => {
      const rect = mark.getBoundingClientRect();
      // 短线是 ::before，在这一格里的位置由对齐方式决定
      const align = getComputedStyle(mark).alignItems;
      const tick =
        align === "flex-start"
          ? rect.left
          : align === "flex-end"
            ? rect.right
            : rect.left + rect.width / 2;
      return {
        text: mark.textContent,
        tick,
        left: rect.left,
        right: rect.right,
      };
    });
    return {
      thumbCenter: thumb.left + thumb.width / 2,
      rootLeft: box.left,
      rootRight: box.right,
      marks,
    };
  });
  const current = found.marks.find((mark) => mark.text === "30 分")!;
  assert.ok(
    Math.abs(current.tick - found.thumbCenter) < 1.5,
    `值是 30 时，"30 分"的短线应该对着滑块的中心：${current.tick} / ${found.thumbCenter}`,
  );
  assert.ok(
    found.marks.every(
      (mark) =>
        mark.left >= found.rootLeft - 0.5 &&
        mark.right <= found.rootRight + 0.5,
    ),
    "标注不应该伸到控件外面",
  );
});

test("禁用：焦点到不了，点轨道也不动", async () => {
  const { page } = storybook;
  await page.story("控件-slider-滑块--states");
  const before = await values(page);
  // 第三个是禁用的
  const disabled = await page.evaluate(() => {
    const input = document.querySelectorAll<HTMLInputElement>(
      "#storybook-root input[type=range]",
    )[2]!;
    const rect = input
      .closest("[data-size]")!
      .querySelector(":scope > div > div")!
      .getBoundingClientRect();
    return {
      disabled: input.disabled,
      x: rect.left + rect.width * 0.9,
      y: rect.top + rect.height / 2,
    };
  });
  assert.ok(disabled.disabled);
  await page.click({ x: disabled.x, y: disabled.y });
  await page.pause(150);
  assert.deepEqual(await values(page), before);
});

test("菱形方案：滑块是转了 45° 的方块", async () => {
  const { page } = storybook;
  await page.story("控件-slider-滑块--diamond");
  const thumb = await page.evaluate(() => {
    const style = getComputedStyle(
      document.querySelector("#storybook-root [data-index]")!,
    );
    return { rotate: style.rotate, width: style.width, height: style.height };
  });
  assert.deepEqual(thumb, { rotate: "45deg", width: "14px", height: "14px" });
  assert.ok(await page.visible(INPUT));
});
