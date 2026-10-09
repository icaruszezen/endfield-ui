// 折叠面板：键盘开合、默认只开一个、禁用的一节走得到但打不开、内容区真的占了高度
import assert from "node:assert/strict";
import { test } from "node:test";
import { useStorybook, type Page } from "./lib/harness.ts";

const storybook = useStorybook();

const expanded = (page: Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll("#storybook-root h3 button")].map(
      (button) => button.getAttribute("aria-expanded") === "true",
    ),
  );

/** 第几节的内容区现在有多高；不在页面里算 0 */
const panelHeight = (page: Page, index: number) =>
  page.evaluate((nth) => {
    const button = document.querySelectorAll("#storybook-root h3 button")[nth]!;
    const panel = document.getElementById(
      button.getAttribute("aria-controls") ?? "",
    );
    return panel ? panel.getBoundingClientRect().height : 0;
  }, index);

test("键盘：Tab 走到标题，回车展开、空格收起；按钮指向它的内容区", async () => {
  const { page } = storybook;
  await page.story("控件-accordion-折叠面板--playground");
  assert.deepEqual(await expanded(page), [false, false, false]);

  await page.key("Tab");
  await page.waitFocused("button:批次发出之后还能改派吗");
  await page.key("Enter");
  await page.waitFor(
    async () => (await expanded(page))[0],
    "回车应该展开第一节",
  );
  await page.waitFor(
    async () => (await panelHeight(page, 0)) > 20,
    "展开之后内容区应该占了高度",
  );
  assert.deepEqual(
    await page.text("#storybook-root [role=region]"),
    ["能。在调度台里选中批次，再选新的目的站；已经过了中转站的批次要先召回。"],
    "内容区应该是一个区域，里面是这一节的内容",
  );

  await page.key("Space");
  await page.waitFor(
    async () => !(await expanded(page))[0],
    "空格应该收起第一节",
  );
  await page.waitFor(
    async () => (await panelHeight(page, 0)) === 0,
    "收起之后内容区不占地方",
  );
});

test("默认只开一个：开了下一节，上一节收起来；Tab 在标题之间走", async () => {
  const { page } = storybook;
  await page.story("控件-accordion-折叠面板--default-open");
  assert.deepEqual(await expanded(page), [false, true, false]);

  await page.key("Tab");
  await page.key("Tab");
  await page.waitFocused("button:延误的批次怎么处理");
  await page.key("Tab");
  await page.waitFocused("button:归档之后去哪里找");
  await page.key("Enter");
  await page.waitFor(
    async () => (await expanded(page)).join() === "false,false,true",
    "展开第三节之后第二节应该收起来",
  );
});

test("multiple：几节可以同时开着", async () => {
  const { page } = storybook;
  await page.story("控件-accordion-折叠面板--multiple");
  assert.deepEqual(await expanded(page), [true, false, true]);
  await page.click("text=延误的批次怎么处理");
  await page.waitFor(
    async () => (await expanded(page)).every(Boolean),
    "点第二节之后三节都应该开着",
  );
});

test("禁用的一节：焦点走得到，回车打不开", async () => {
  const { page } = storybook;
  await page.story("控件-accordion-折叠面板--extra");
  await page.evaluate(() =>
    [
      ...document.querySelectorAll<HTMLElement>("#storybook-root h3 button"),
    ][2]!.focus(),
  );
  await page.waitFocused(/^button:东线/);
  await page.key("Enter");
  await page.pause(200);
  assert.deepEqual(await expanded(page), [true, false, false]);
});

test("加号在展开时变成减号：竖的那一笔转平", async () => {
  const { page } = storybook;
  await page.story("控件-accordion-折叠面板--extra");
  // 每个按钮里两笔，第二笔是会转的那一笔
  const turned = () =>
    page.evaluate(() =>
      [...document.querySelectorAll("#storybook-root h3 button")].map(
        (button) => getComputedStyle(button.querySelectorAll("svg")[1]!).rotate,
      ),
    );
  assert.deepEqual(await turned(), ["0deg", "90deg", "90deg"]);
});
