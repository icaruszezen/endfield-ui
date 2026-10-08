// 下拉选择：键盘开合与选中、面板的位置、点标签、贴底翻转、放在弹窗里
import assert from "node:assert/strict";
import { test } from "node:test";
import { useStorybook, type Page } from "./lib/harness.ts";

const storybook = useStorybook();

const TRIGGER = "[role=combobox]";
const PANEL = "[role=listbox]";

const highlighted = (page: Page) =>
  page.evaluate(
    () =>
      document.querySelector("[data-highlighted]")?.textContent?.trim() ?? null,
  );

const triggerText = (page: Page) =>
  page.evaluate(() =>
    (document.querySelector("[role=combobox]")!.textContent ?? "").trim(),
  );

test("键盘：回车与方向键都能打开，方向键移动，Esc 关闭后焦点回到触发器", async () => {
  const { page } = storybook;
  await page.story("控件-select-下拉选择--playground");

  await page.key("Tab");
  await page.waitFocused("combobox:地区");
  await page.key("Enter");
  await page.waitVisible(PANEL);

  await page.key("ArrowDown");
  const first = await page.waitFor(() => highlighted(page), "没有高亮的选项");
  await page.key("ArrowDown");
  const second = await highlighted(page);
  assert.notEqual(second, first, "方向键应该把高亮移到下一项");

  await page.key("Escape");
  await page.waitGone(PANEL);
  await page.waitFocused("combobox:地区", "关闭后焦点应该回到触发器");

  await page.key("ArrowDown");
  await page.waitVisible(PANEL, "方向键也应该能打开面板");
  await page.key("Escape");
  await page.waitGone(PANEL);
});

test("键盘：回车选中，触发器显示选中项的文字", async () => {
  const { page } = storybook;
  await page.story("控件-select-下拉选择--playground");
  assert.equal(await triggerText(page), "请选择");

  await page.key("Tab");
  await page.key("Enter");
  await page.waitVisible(PANEL);
  await page.key("ArrowDown");
  const choice = await page.waitFor(() => highlighted(page), "没有高亮的选项");
  await page.key("Enter");

  await page.waitGone(PANEL, "选中后面板应该关上");
  assert.equal(await triggerText(page), choice);
  await page.waitFocused("combobox:地区");
});

test("面板落在触发器下方、左对齐、不比它窄；开着的时候页面不滚动；点外面关闭", async () => {
  const { page } = storybook;
  await page.story("控件-select-下拉选择--playground");
  await page.click(TRIGGER);
  await page.waitVisible(PANEL);

  const layout = await page.evaluate(() => {
    const box = document
      .querySelector("[role=combobox]")!
      .parentElement!.getBoundingClientRect();
    const panel = document
      .querySelector("[role=listbox]")!
      .closest("[data-side]")!
      .getBoundingClientRect();
    return {
      below: panel.top >= box.bottom,
      aligned: Math.abs(panel.left - box.left) < 2,
      wideEnough: panel.width >= box.width - 1,
      scrollLocked: [document.documentElement, document.body].some(
        (element) => getComputedStyle(element).overflow === "hidden",
      ),
    };
  });
  assert.deepEqual(layout, {
    below: true,
    aligned: true,
    wideEnough: true,
    scrollLocked: true,
  });

  await page.click({ x: 700, y: 500 });
  await page.waitGone(PANEL);
});

test("放进字段：点标签会打开面板", async () => {
  const { page } = storybook;
  await page.story("控件-select-下拉选择--in-field");
  await page.click("label");
  await page.waitVisible(PANEL);
});

test("贴近视口底部时面板翻到上面，选项在面板里滚动", async () => {
  const { page } = storybook;
  await page.story("控件-select-下拉选择--long-list");
  await page.evaluate(() => {
    const host =
      document.querySelector("[role=combobox]")!.parentElement!.parentElement!;
    host.style.marginTop = `${innerHeight - 140}px`;
  });
  await page.click(TRIGGER);
  await page.waitVisible(PANEL);

  const layout = await page.evaluate(() => {
    const box = document
      .querySelector("[role=combobox]")!
      .parentElement!.getBoundingClientRect();
    const list = document.querySelector("[role=listbox]")!;
    const popup = list.closest("[data-side]")!;
    const panel = popup.getBoundingClientRect();
    return {
      side: popup.getAttribute("data-side"),
      above: panel.bottom <= box.top + 1,
      inViewport: panel.top >= 0,
      scrolls: list.scrollHeight > list.clientHeight,
    };
  });
  assert.deepEqual(layout, {
    side: "top",
    above: true,
    inViewport: true,
    scrolls: true,
  });
});

test("弹窗里的下拉盖在弹窗上面；Esc 先关下拉，再关弹窗", async () => {
  const { page } = storybook;
  await page.story("控件-dialog-弹窗--with-form");
  await page.click("text=重命名");
  await page.waitVisible("[role=dialog]");
  await page.click(TRIGGER);
  await page.waitVisible(PANEL);

  assert.ok(
    await page.evaluate(() => {
      const list = document.querySelector("[role=listbox]")!;
      const rect = list.getBoundingClientRect();
      const top = document.elementFromPoint(
        rect.left + rect.width / 2,
        rect.top + rect.height / 2,
      );
      return list.contains(top);
    }),
    "下拉面板被弹窗盖住了",
  );

  await page.key("Escape");
  await page.waitGone(PANEL);
  assert.ok(await page.visible("[role=dialog]"), "第一次 Esc 只应该关掉下拉");
  await page.waitFocused(/^combobox:/, "关掉下拉后焦点应该回到它的触发器");

  await page.key("Escape");
  await page.waitGone("[role=dialog]");
});
