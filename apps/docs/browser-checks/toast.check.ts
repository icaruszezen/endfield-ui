// 轻提示：出现的位置、新的替换旧的、到时消失、操作按钮、不打断页面、F6 进到提示里
import assert from "node:assert/strict";
import { test } from "node:test";
import { useStorybook, type Page } from "./lib/harness.ts";

const storybook = useStorybook();

/** 现在挂着的轻提示 */
function toasts(page: Page) {
  return page.evaluate(() =>
    [
      ...document.querySelectorAll(
        "[role=region] [role=dialog], [role=region] [role=alertdialog]",
      ),
    ].map((element) => {
      const rect = element.getBoundingClientRect();
      return {
        text: element.querySelector("p")?.textContent ?? "",
        role: element.getAttribute("role"),
        centered:
          Math.abs(rect.left + rect.width / 2 - innerWidth / 2) < 2 &&
          rect.left >= 0,
        nearBottom: innerHeight - rect.bottom < innerHeight / 4,
      };
    }),
  );
}

const waitToast = (page: Page, text: string) =>
  page.waitFor(
    async () => (await toasts(page)).find((toast) => toast.text === text),
    `轻提示"${text}"没有出现`,
  );

const waitNoToast = (page: Page, message: string, timeout?: number) =>
  page.waitFor(async () => (await toasts(page)).length === 0, message, timeout);

const statusLine = (page: Page) =>
  page.evaluate(
    () =>
      [...document.querySelectorAll("#storybook-root p")].find((paragraph) =>
        paragraph.textContent?.startsWith("已销毁"),
      )?.textContent ?? "",
  );

test("出现在视口底部正中；新的一条替换上一条；页面照常可用", async () => {
  const { page } = storybook;
  await page.story("控件-toast-轻提示--playground");

  await page.click("text=一句话");
  const plain = await waitToast(page, "已保存");
  assert.deepEqual(
    { centered: plain.centered, nearBottom: plain.nearBottom },
    { centered: true, nearBottom: true },
  );

  await page.click("text=失败");
  const failed = await waitToast(page, "保存失败，请检查网络后重试");
  // 失败是要紧的消息：读屏会立刻读出来
  assert.equal(failed.role, "alertdialog");
  await page.waitFor(
    async () => (await toasts(page)).length === 1,
    "同时只应该有一条轻提示",
  );

  const blocked = await page.evaluate(() => ({
    scrollLocked: [document.documentElement, document.body].some(
      (element) => getComputedStyle(element).overflow === "hidden",
    ),
    inert: !!document
      .querySelector("#storybook-root button")!
      .closest("[inert], [aria-hidden=true]"),
  }));
  assert.deepEqual(blocked, { scrollLocked: false, inert: false });
});

test("过几秒自己消失", async () => {
  const { page } = storybook;
  await page.story("控件-toast-轻提示--playground");
  await page.click("text=一句话");
  await waitToast(page, "已保存");
  await waitNoToast(page, "默认 3 秒后应该自己消失", 8000);
});

test("带操作的提示：点操作按钮会执行并收起", async () => {
  const { page } = storybook;
  await page.story("控件-toast-轻提示--playground");
  await page.click("text=带操作");
  await waitToast(page, "已销毁 3 件物资");
  assert.equal(await statusLine(page), "已销毁：3 件");

  await page.click("text=撤销");
  await waitNoToast(page, "点了操作按钮后提示应该收起");
  assert.equal(await statusLine(page), "已销毁：0 件");
});

test("不限时的提示一直留着；F6 把焦点带进提示，再 Tab 走到关闭按钮", async () => {
  const { page } = storybook;
  await page.story("控件-toast-轻提示--playground");
  await page.click("text=一直留着");
  await waitToast(page, "连接已断开");

  await page.pause(4000);
  assert.equal((await toasts(page)).length, 1, "不限时的提示不应该自己消失");

  await page.key("F6");
  await page.waitFor(
    () =>
      page.evaluate(() => !!document.activeElement?.closest("[role=region]")),
    "F6 应该把焦点带到通知区域",
  );
  // 从通知区域走到提示本身，再走到它的关闭按钮
  for (let i = 0; i < 2 && (await page.focused()) !== "button:关闭"; i++) {
    await page.key("Tab");
  }
  assert.equal(await page.focused(), "button:关闭");
  await page.key("Enter");
  await waitNoToast(page, "关闭按钮应该收起提示");
});
