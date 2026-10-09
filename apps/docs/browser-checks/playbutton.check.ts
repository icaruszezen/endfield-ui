// 播放钮：键盘到得了、点击区够大；媒体卡上的记号不抢卡片的点击
import assert from "node:assert/strict";
import { test } from "node:test";
import { useStorybook } from "./lib/harness.ts";

const storybook = useStorybook();

test("播放钮：Tab 到得了，有名称和焦点环，回车触发", async () => {
  const { page } = storybook;
  await page.story("控件-playbutton-播放钮--on-cover");
  await page.key("Tab");
  await page.waitFocused("button:播放：秋季勘探计划 · 预告");
  await page.waitFor(
    () =>
      page.evaluate(() => {
        const style = getComputedStyle(document.activeElement!);
        return style.outlineStyle === "solid" && style.outlineWidth === "2px";
      }),
    "键盘聚焦时应该有焦点环",
  );
  await page.key("Enter");
  await page.waitFor(
    async () =>
      (await page.text("#storybook-root [role=status]"))[0] === "// 点了 1 次",
    "回车应该触发播放",
  );
  await page.click("#storybook-root button");
  await page.waitFor(
    async () =>
      (await page.text("#storybook-root [role=status]"))[0] === "// 点了 2 次",
    "点击应该触发播放",
  );
});

test("播放钮：黄色小方块，圆角 2px；最小一档的点击区补到 40px", async () => {
  const { page } = storybook;
  await page.story("控件-playbutton-播放钮--sizes");
  const found = await page.evaluate(() => {
    const buttons = [
      ...document.querySelectorAll<HTMLElement>("#storybook-root button"),
    ];
    const probe = document.createElement("i");
    probe.style.backgroundColor = "var(--ef-action)";
    document.body.append(probe);
    const action = getComputedStyle(probe).backgroundColor;
    probe.remove();

    const small = buttons[0]!;
    const rect = small.getBoundingClientRect();
    const middle = rect.top + rect.height / 2;
    return {
      sizes: buttons.slice(0, 3).map((button) => button.offsetWidth),
      radius: getComputedStyle(small).borderRadius,
      yellow: getComputedStyle(small).backgroundColor === action,
      // 钮外 6px 的地方点下去，点到的还是它
      hitOutside: document.elementFromPoint(rect.left - 6, middle) === small,
      hitFar: document.elementFromPoint(rect.left - 12, middle) === small,
    };
  });
  assert.deepEqual(found, {
    sizes: [24, 32, 40],
    radius: "2px",
    yellow: true,
    hitOutside: true,
    hitFar: false,
  });
});

test("媒体卡的 video：记号在媒体区左下角内缩 8px，点它走的是卡片的链接", async () => {
  const { page } = storybook;
  await page.story("控件-mediacard-媒体卡--video");
  const found = await page.evaluate(() => {
    const card = document.querySelector("#storybook-root article")!;
    const mark = card.querySelector<HTMLElement>("span[aria-hidden=true]")!;
    const media = mark.parentElement!.getBoundingClientRect();
    const rect = mark.getBoundingClientRect();
    const hit = document.elementFromPoint(
      rect.left + rect.width / 2,
      rect.top + rect.height / 2,
    );
    return {
      left: Math.round(rect.left - media.left),
      bottom: Math.round(media.bottom - rect.bottom),
      size: rect.width,
      // 记号不拦点击：这一点上最上面的是标题里那个铺满整卡的链接
      hitsLink: hit?.closest("a") === card.querySelector("a"),
      links: card.querySelectorAll("a").length,
      buttons: card.querySelectorAll("button").length,
      name: card.querySelector("a")!.textContent,
    };
  });
  assert.deepEqual(found, {
    left: 8,
    bottom: 8,
    size: 32,
    hitsLink: true,
    links: 1,
    buttons: 0,
    name: "视频：秋季勘探计划 · 预告",
  });
});
