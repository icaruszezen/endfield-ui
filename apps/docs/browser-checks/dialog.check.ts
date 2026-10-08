// 弹窗与抽屉：焦点移入、被锁在里面、关闭后回到触发按钮；各种关闭方式；长内容；窄屏
import assert from "node:assert/strict";
import { test } from "node:test";
import { useStorybook } from "./lib/harness.ts";

const storybook = useStorybook();

const DIALOG = "[role=dialog]";
const ALERT = "[role=alertdialog]";

test("弹窗：键盘打开后焦点进到内容区，并被锁在弹窗里", async () => {
  const { page } = storybook;
  await page.story("控件-dialog-弹窗--playground");

  await page.key("Tab");
  await page.waitFocused("button:归档");
  await page.key("Enter");
  await page.waitVisible(DIALOG);
  // 行动区的约定是"取消在前"：打开后一回车不会直接执行
  await page.waitFocused(
    "button:取消",
    "打开后焦点应该落在行动区的第一个按钮上",
  );

  const name = await page.evaluate(() => {
    const dialog = document.querySelector("[role=dialog]")!;
    return document.getElementById(dialog.getAttribute("aria-labelledby")!)
      ?.textContent;
  });
  assert.ok(name, "弹窗要有可访问名称");

  const visited = new Set<string>();
  for (let i = 0; i < 6; i++) {
    await page.key("Tab");
    visited.add(await page.focused());
    assert.ok(
      await page.evaluate(
        () => !!document.activeElement?.closest("[role=dialog]"),
      ),
      "Tab 把焦点带出了弹窗",
    );
  }
  assert.ok(visited.has("button:关闭"), "Tab 应该走得到关闭图标");
  await page.key("Tab", { shift: true });
  assert.ok(
    await page.evaluate(
      () => !!document.activeElement?.closest("[role=dialog]"),
    ),
    "Shift+Tab 把焦点带出了弹窗",
  );
});

test("弹窗：开着的时候背景不可交互、不可滚动；Esc 关闭后焦点回到触发按钮", async () => {
  const { page } = storybook;
  await page.story("控件-dialog-弹窗--playground");
  await page.key("Tab");
  await page.key("Enter");
  await page.waitVisible(DIALOG);

  const background = await page.evaluate(() => {
    const trigger = [...document.querySelectorAll("button")].find(
      (button) => !button.closest("[role=dialog]"),
    )!;
    return {
      hidden: !!trigger.closest("[inert], [aria-hidden=true]"),
      scrollLocked: [document.documentElement, document.body].some(
        (element) => getComputedStyle(element).overflow === "hidden",
      ),
    };
  });
  assert.deepEqual(background, { hidden: true, scrollLocked: true });

  await page.key("Escape");
  await page.waitGone(DIALOG);
  await page.waitFocused("button:归档", "关闭后焦点应该回到触发按钮");
});

test("弹窗：点遮罩关闭", async () => {
  const { page } = storybook;
  await page.story("控件-dialog-弹窗--playground");
  await page.click("text=归档");
  await page.waitVisible(DIALOG);
  await page.click({ x: 30, y: 400 });
  await page.waitGone(DIALOG);
});

test("确认弹窗：角色是 alertdialog，点遮罩不关，Esc 能关", async () => {
  const { page } = storybook;
  await page.story("控件-dialog-弹窗--danger-confirm");
  await page.click("text=销毁");
  await page.waitVisible(ALERT);
  await page.waitFocused("button:取消");

  await page.click({ x: 30, y: 400 });
  await page.pause(400);
  assert.ok(await page.visible(ALERT), "点遮罩不应该关掉确认弹窗");

  await page.key("Escape");
  await page.waitGone(ALERT);
});

test("弹窗：内容很长时只有正文滚动，弹窗不超出视口", async () => {
  const { page } = storybook;
  await page.story("控件-dialog-弹窗--long-content");
  await page.click("text=查看盘点记录");
  await page.waitVisible(DIALOG);

  const layout = await page.evaluate(() => {
    const dialog = document.querySelector("[role=dialog]")!;
    const scroller = [...dialog.querySelectorAll("div")].find(
      (element) => getComputedStyle(element).overflowY === "auto",
    )!;
    const rect = dialog.getBoundingClientRect();
    return {
      inViewport: rect.top >= 0 && rect.bottom <= innerHeight,
      scrolls: scroller.scrollHeight > scroller.clientHeight,
    };
  });
  assert.deepEqual(layout, { inViewport: true, scrolls: true });
});

test("弹窗：里面有表单时焦点落在第一个字段", async () => {
  const { page } = storybook;
  await page.story("控件-dialog-弹窗--with-form");
  await page.click("text=重命名");
  await page.waitVisible(DIALOG);
  await page.waitFor(
    () => page.evaluate(() => document.activeElement?.tagName === "INPUT"),
    "焦点应该落在输入框上",
  );
});

test("抽屉：贴着右边缘、通高；Esc 关闭后焦点回到触发按钮", async () => {
  const { page } = storybook;
  await page.story("控件-drawer-抽屉--filters");
  await page.click("text=筛选");
  await page.waitVisible(DIALOG);

  // 进场是一段平移，等它停在边缘上
  await page.waitFor(
    () =>
      page.evaluate(() => {
        const rect = document
          .querySelector("[role=dialog]")!
          .getBoundingClientRect();
        return (
          Math.abs(rect.right - innerWidth) < 1 &&
          Math.abs(rect.height - innerHeight) < 1 &&
          rect.width < innerWidth
        );
      }),
    "抽屉应该贴着右边缘、和视口一样高",
  );
  assert.ok(
    await page.evaluate(
      () => !!document.activeElement?.closest("[role=dialog]"),
    ),
    "打开后焦点应该在抽屉里",
  );

  await page.key("Escape");
  await page.waitGone(DIALOG);
  await page.waitFocused(/^button:筛选/, "关闭后焦点应该回到触发按钮");
});

test("窄屏（360px）：抽屉通宽，弹窗不超出视口，页面不横向溢出", async () => {
  const { page } = storybook;
  await page.setSize(360, 700);
  try {
    await page.story("控件-drawer-抽屉--playground");
    await page.click("text=查看详情");
    await page.waitVisible(DIALOG);
    await page.waitFor(
      () =>
        page.evaluate(() => {
          const rect = document
            .querySelector("[role=dialog]")!
            .getBoundingClientRect();
          return (
            Math.abs(rect.left) < 1 && Math.abs(rect.width - innerWidth) < 1
          );
        }),
      "360px 宽时抽屉应该通宽",
    );
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      "页面横向溢出了",
    );

    await page.story("控件-dialog-弹窗--playground");
    await page.click("text=归档");
    await page.waitVisible(DIALOG);
    await page.waitFor(
      () =>
        page.evaluate(() => {
          const rect = document
            .querySelector("[role=dialog]")!
            .getBoundingClientRect();
          return rect.left >= 0 && rect.right <= innerWidth;
        }),
      "360px 宽时弹窗应该整个在视口里",
    );
  } finally {
    await page.setSize(1200, 800);
  }
});
