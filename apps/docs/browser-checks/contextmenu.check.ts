// 右键菜单：右键在指针处打开、键盘能走能关、区域外面不拦右键、表格行上和"更多"是同一组操作
import assert from "node:assert/strict";
import { test } from "node:test";
import { useStorybook, type Page } from "./lib/harness.ts";

const storybook = useStorybook();

const MENU = "[role=menu]";
const AREA = "#storybook-root .border-dashed";

/** 基元把面板往右下错开几个像素，指针正好落在第一项的左上角里面 */
const NEAR = 8;

const menuBox = (page: Page) =>
  page.evaluate(() => {
    const rect = document.querySelector("[role=menu]")!.getBoundingClientRect();
    return { left: rect.left, top: rect.top };
  });

test("右键：菜单的左上角落在指针处；Esc 关闭", async () => {
  const { page } = storybook;
  await page.story("控件-contextmenu-右键菜单--playground");
  assert.ok(!(await page.visible(MENU)), "没点右键时不应该有菜单");

  const at = await page.point(AREA);
  await page.click(at, { button: "right" });
  await page.waitVisible(MENU, "右键之后应该出现菜单");
  const box = await menuBox(page);
  assert.ok(
    Math.abs(box.left - at.x) <= NEAR && Math.abs(box.top - at.y) <= NEAR,
    `菜单应该贴着指针：指针 ${at.x},${at.y}，菜单 ${box.left},${box.top}`,
  );
  assert.deepEqual(await page.text(`${MENU} [role=menuitem]`), [
    "复制一份",
    "锁定L",
    "移动到…",
    "销毁",
  ]);

  await page.key("Escape");
  await page.waitGone(MENU);
});

test("换个地方再点右键：菜单跟到新的位置", async () => {
  const { page } = storybook;
  await page.story("控件-contextmenu-右键菜单--playground");
  const center = await page.point(AREA);

  await page.click(center, { button: "right" });
  await page.waitVisible(MENU);
  await page.key("Escape");
  await page.waitGone(MENU);

  const corner = { x: center.x - 120, y: center.y - 40 };
  await page.click(corner, { button: "right" });
  await page.waitVisible(MENU);
  const box = await menuBox(page);
  assert.ok(
    Math.abs(box.left - corner.x) <= NEAR &&
      Math.abs(box.top - corner.y) <= NEAR,
    `第二次应该在新的位置：指针 ${corner.x},${corner.y}，菜单 ${box.left},${box.top}`,
  );
});

test("键盘：方向键在选项间移动，回车执行并关掉", async () => {
  const { page } = storybook;
  await page.story("控件-contextmenu-右键菜单--rows");
  await page.click("#storybook-root tbody tr:nth-child(2) td:nth-child(2)", {
    button: "right",
  });
  await page.waitVisible(MENU);
  // 指针打开的菜单，焦点先落在面板上（键盘打开的才直接到第一项）。
  // 面板出现和焦点进去不在同一帧：等焦点到了再按键，否则这一下方向键没人接
  await page.waitFocused(/^menu:/, "右键打开后焦点应该进到菜单里");

  await page.key("ArrowDown");
  await page.waitFocused("menuitem:复制链接");
  await page.key("ArrowDown");
  await page.waitFocused("menuitem:打印单据");
  await page.key("Enter");
  await page.waitGone(MENU, "回车之后菜单应该关上");

  const id = (await page.text("#storybook-root tbody tr:nth-child(2) th"))[0]!;
  await page.waitFor(
    async () =>
      (await page.text("#storybook-root [role=status]"))[0] ===
      `打印了 ${id} 的单据`,
    "应该执行的是第二行的打印",
  );
});

test("右键菜单和行尾的更多是同一组操作", async () => {
  const { page } = storybook;
  await page.story("控件-contextmenu-右键菜单--rows");
  const names = () => page.text(`${MENU} [role^=menuitem]`);

  await page.click("#storybook-root tbody tr:nth-child(1) td:nth-child(2)", {
    button: "right",
  });
  await page.waitVisible(MENU);
  const fromRightClick = await names();
  await page.key("Escape");
  await page.waitGone(MENU);

  await page.click("#storybook-root tbody tr:nth-child(1) button");
  await page.waitVisible(MENU);
  assert.deepEqual(await names(), fromRightClick);
  assert.ok(fromRightClick.length >= 4);
});

test("复选项：点了不关，行跟着变成选中", async () => {
  const { page } = storybook;
  await page.story("控件-contextmenu-右键菜单--rows");
  await page.click("#storybook-root tbody tr:nth-child(3) td:nth-child(2)", {
    button: "right",
  });
  await page.waitVisible(MENU);
  await page.click(`${MENU} [role=menuitemcheckbox]`);
  await page.waitFor(
    () =>
      page.evaluate(
        () =>
          document
            .querySelector("#storybook-root tbody tr:nth-child(3)")!
            .getAttribute("aria-selected") === "true",
      ),
    "勾了置顶，这一行应该变成选中",
  );
  // 等上几帧再看：复选项点了不该关菜单
  await page.pause(200);
  assert.ok(await page.visible(MENU), "勾复选项之后菜单不应该关");
});

test("区域外面点右键：不出菜单", async () => {
  const { page } = storybook;
  await page.story("控件-contextmenu-右键菜单--playground");
  const at = await page.point(AREA);
  await page.click({ x: at.x, y: at.y + 300 }, { button: "right" });
  await page.pause(200);
  assert.ok(!(await page.visible(MENU)), "区域外面不应该出菜单");
});
