// 悬浮卡：悬停要等一会儿、指针能移进卡片、移开才关；键盘聚焦、局部主题、方向、窄屏
import assert from "node:assert/strict";
import { test } from "node:test";
import { useStorybook, type Page } from "./lib/harness.ts";

const storybook = useStorybook();

const CARD = "[data-hover-card]";

/** 现在开着的卡片各自的文字 */
const cards = (page: Page) =>
  page.evaluate(
    (css) =>
      [...document.querySelectorAll<HTMLElement>(css)]
        .filter((card) => {
          const rect = card.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        })
        .map((card) => card.textContent ?? ""),
    CARD,
  );

const waitCard = async (page: Page, text: string) => {
  const started = Date.now();
  await page.waitFor(async () => {
    const open = await cards(page);
    return open.length === 1 && open[0]!.includes(text);
  }, `"${text}"的卡片没有出现`);
  return Date.now() - started;
};

const waitNoCard = (page: Page, message: string) =>
  page.waitFor(async () => (await cards(page)).length === 0, message);

/** 页面上第几个触发链接的中心点 */
const linkPoint = (page: Page, index: number) =>
  page.evaluate((nth) => {
    const rect = document
      .querySelectorAll("#storybook-root a")
      [nth]!.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  }, index);

const rectOf = (page: Page, selector: string, index = 0) =>
  page.evaluate(
    ({ css, nth }) => {
      const rect = document.querySelectorAll(css)[nth]!.getBoundingClientRect();
      return {
        top: rect.top,
        bottom: rect.bottom,
        left: rect.left,
        right: rect.right,
      };
    },
    { css: selector, nth: index },
  );

test("悬停：不是立刻出现；指针移进卡片里还开着；移开之后才关", async () => {
  const { page } = storybook;
  await page.story("控件-hovercard-悬浮卡--in-text");

  const point = await linkPoint(page, 0);
  // 从悬停的那一刻算起（出现的延迟是 600ms）。以前是悬停 150ms 之后才开始计时、
  // 要求再等 200ms 以上：机器一慢，前面那几步自己就吃掉了余量
  const hovered = Date.now();
  await page.moveTo(point);
  await page.pause(150);
  assert.deepEqual(await cards(page), [], "卡片不应该一悬停就出现");
  await waitCard(page, "六人值守");
  const waited = Date.now() - hovered;
  assert.ok(waited > 400, `应该等上一会儿才出现（只等了 ${waited}ms）`);

  // 卡片离链接有 4px 的缝：一路移过去，中途不该关
  const card = await rectOf(page, CARD);
  await page.moveTo({
    x: (card.left + card.right) / 2,
    y: (card.top + card.bottom) / 2,
  });
  await page.pause(600);
  assert.equal(
    (await cards(page)).length,
    1,
    "指针移进卡片里，过了关闭的延迟它也应该还开着",
  );

  await page.moveTo({ x: 5, y: 5 });
  await waitNoCard(page, "指针离开链接和卡片之后应该关");
});

test("一列链接：卡片出在侧面，不盖住下面的链接；移到另一个，卡片跟着换", async () => {
  const { page } = storybook;
  await page.story("控件-hovercard-悬浮卡--list");

  await page.moveTo(await linkPoint(page, 0));
  await waitCard(page, "六人值守");
  // 下面那几个链接没有被卡片盖住：指针往下移的时候悬停得到它们
  const covered = await page.evaluate((css) => {
    const card = document.querySelector(css)!;
    return [...document.querySelectorAll("#storybook-root a")].filter(
      (link) => {
        const rect = link.getBoundingClientRect();
        const hit = document.elementFromPoint(
          rect.left + rect.width / 2,
          rect.top + rect.height / 2,
        );
        return hit !== null && card.contains(hit);
      },
    ).length;
  }, CARD);
  assert.equal(covered, 0, "卡片不应该盖住这一列里的链接");

  await page.moveTo(await linkPoint(page, 2));
  await waitCard(page, "两人值守");
  await page.moveTo({ x: 5, y: 5 });
  await waitNoCard(page, "移开之后应该关");
});

test("键盘：聚焦到链接时出现，Esc 收起而焦点不动；Tab 不进卡片", async () => {
  const { page } = storybook;
  await page.story("控件-hovercard-悬浮卡--in-text");

  await page.key("Tab");
  await page.waitFocused("a:北区仓储站");
  await waitCard(page, "六人值守");

  await page.key("Escape");
  await waitNoCard(page, "Esc 应该收起卡片");
  await page.waitFocused("a:北区仓储站", "Esc 之后焦点应该还在链接上");

  // 再 Tab：到下一个链接，不是到卡片里
  await page.key("Tab");
  await page.waitFocused("a:三号管廊中继");
  await waitCard(page, "四人值守");
  await page.key("Tab");
  await page.waitFocused("a:第三岩层营地", "Tab 应该走到下一个链接，不进卡片");
});

test("链接还是链接：点了照常过去", async () => {
  const { page } = storybook;
  await page.story("控件-hovercard-悬浮卡--in-text");
  await page.click(await linkPoint(page, 1));
  await page.waitFor(
    () => page.evaluate(() => location.hash === "#N-07"),
    "点链接应该跳到它的地址",
  );
});

test("暗色版块里的链接：卡片挂在 body 下，也是暗色的", async () => {
  const { page } = storybook;
  await page.story("控件-hovercard-悬浮卡--local-theme", "light");
  await page.moveTo(await linkPoint(page, 0));
  await waitCard(page, "三人值守");

  const found = () =>
    page.evaluate((css) => {
      const card = document.querySelector<HTMLElement>(css)!;
      const scope = card.closest<HTMLElement>("[data-theme]");
      // 暗色版块里凸起一档的底
      const probe = document.createElement("i");
      probe.style.backgroundColor = "var(--ef-surface-raised)";
      document
        .querySelector("#storybook-root [data-theme=dark]")!
        .append(probe);
      const raised = getComputedStyle(probe).backgroundColor;
      probe.remove();
      return {
        theme: scope?.dataset.theme,
        underBody: scope?.parentElement === document.body,
        matches: getComputedStyle(card).backgroundColor === raised,
      };
    }, CARD);
  await page.waitEqual(
    found,
    { theme: "dark", underBody: true, matches: true },
    "卡片应该带上触发处的暗色主题",
  );
  await page.moveTo({ x: 5, y: 5 });
});

test("四个方向：卡片在链接的那一侧，离它 4px", async () => {
  const { page } = storybook;
  await page.story("控件-hovercard-悬浮卡--sides");
  const sides = ["top", "bottom", "left", "right"] as const;

  for (const [index, side] of sides.entries()) {
    await page.moveTo(await linkPoint(page, index));
    await waitCard(page, "放不下时会翻到对面");
    const link = await rectOf(page, "#storybook-root a", index);
    // 位置是算出来之后才写上去的：等它到位
    await page.waitFor(async () => {
      const card = await rectOf(page, CARD);
      const gap = {
        top: link.top - card.bottom,
        bottom: card.top - link.bottom,
        left: link.left - card.right,
        right: card.left - link.right,
      }[side];
      return Math.abs(gap - 4) < 1;
    }, `${side}：卡片应该在链接的这一侧，离它 4px`);
    await page.moveTo({ x: 5, y: 5 });
    await waitNoCard(page, `${side}：移开之后应该关`);
  }
});

test("320px 宽：卡片整个在视口里", async () => {
  const { page } = storybook;
  await page.setSize(320, 700);
  try {
    await page.story("控件-hovercard-悬浮卡--narrow");
    await page.moveTo(await linkPoint(page, 0));
    await waitCard(page, "四人值守");
    await page.waitFor(async () => {
      const card = await rectOf(page, CARD);
      return card.left >= 0 && card.right <= 320;
    }, "卡片不应该伸出视口");
  } finally {
    await page.setSize(1280, 860);
  }
});
