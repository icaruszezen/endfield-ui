// 文字提示：悬停要等一会儿、相邻的不用再等、键盘聚焦立刻出现、Esc 收起、读屏的关联
import assert from "node:assert/strict";
import { test } from "node:test";
import { useStorybook, type Page } from "./lib/harness.ts";

const storybook = useStorybook();

/** 现在看得见的提示各自的文字 */
function tooltips(page: Page) {
  return page.evaluate(() =>
    // 定位层是 presentation，小三角对读屏隐藏，剩下的就是提示本身
    [...document.querySelectorAll("[data-side][data-open]")]
      .filter(
        (element) =>
          element.getAttribute("role") !== "presentation" &&
          !element.hasAttribute("aria-hidden"),
      )
      .map((element) => (element.textContent ?? "").trim()),
  );
}

async function waitTooltip(page: Page, text: string) {
  const started = Date.now();
  await page.waitFor(
    async () => (await tooltips(page)).includes(text),
    `提示"${text}"没有出现`,
  );
  return Date.now() - started;
}

test("悬停：等一会儿才出现；移到相邻的按钮不用再等；移开就消失", async () => {
  const { page } = storybook;
  await page.story("控件-tooltip-文字提示--toolbar");

  await page.moveTo("text=上一条");
  assert.deepEqual(await tooltips(page), [], "提示不应该一悬停就出现");
  const first = await waitTooltip(page, "上一条");

  await page.moveTo("text=下一条");
  const second = await waitTooltip(page, "下一条");
  assert.ok(
    second < first,
    `相邻的提示应该比第一个出现得快（第一个 ${first}ms，第二个 ${second}ms）`,
  );

  await page.moveTo({ x: 600, y: 600 });
  await page.waitFor(
    async () => (await tooltips(page)).length === 0,
    "指针移开后提示应该消失",
  );
});

test("键盘：聚焦时出现，Esc 收起而焦点不动", async () => {
  const { page } = storybook;
  await page.story("控件-tooltip-文字提示--toolbar");

  await page.key("Tab");
  await page.waitFocused("button:上一条");
  await waitTooltip(page, "上一条");

  await page.key("Escape");
  await page.waitFor(
    async () => (await tooltips(page)).length === 0,
    "Esc 应该收起提示",
  );
  assert.equal(await page.focused(), "button:上一条");
});

test("读屏：内容和 aria-label 不同才关联成补充说明，相同时不重复", async () => {
  const { page } = storybook;

  await page.story("控件-tooltip-文字提示--supplementary");
  const described = await page.evaluate(() => {
    const button = document.querySelector("button[aria-label=锁定]")!;
    const id = button.getAttribute("aria-describedby");
    return id ? (document.getElementById(id)?.textContent ?? "") : null;
  });
  assert.ok(described, "补充说明应该通过 aria-describedby 关联给按钮");

  await page.story("控件-tooltip-文字提示--toolbar");
  assert.equal(
    await page.evaluate(() =>
      document
        .querySelector("button[aria-label=上一条]")!
        .hasAttribute("aria-describedby"),
    ),
    false,
    "提示和 aria-label 一字不差时不应该再关联一遍",
  );
});
