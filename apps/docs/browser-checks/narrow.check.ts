// 320px 宽：页面不横向溢出，浮层整个在视口里
import assert from "node:assert/strict";
import { test } from "node:test";
import { useStorybook, type Page } from "./lib/harness.ts";

const storybook = useStorybook({ width: 500, height: 900 });

/** 伸到视口右边之外的元素（自己会横向滚动或裁切的容器里的不算） */
function overflowing(page: Page) {
  return page.evaluate(() => {
    const viewport = document.documentElement.clientWidth;
    const clipped = (element: Element) => {
      for (let parent = element.parentElement; parent;) {
        const overflow = getComputedStyle(parent).overflowX;
        if (overflow !== "visible") return true;
        parent = parent.parentElement;
      }
      return false;
    };
    const offenders = [...document.querySelectorAll("#storybook-root *")]
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.right > viewport + 0.5;
      })
      .filter((element) => !clipped(element))
      .slice(0, 3)
      .map(
        (element) =>
          `${element.tagName.toLowerCase()}.${String(element.className).slice(0, 40)}`,
      );
    return {
      pageScrolls: document.documentElement.scrollWidth > viewport,
      offenders,
    };
  });
}

/** 这个元素是不是整个在视口的左右边界之内 */
const inside = (page: Page, selector: string) =>
  page.evaluate((css) => {
    const rect = document.querySelector(css)!.getBoundingClientRect();
    return rect.left >= 0 && rect.right <= innerWidth;
  }, selector);

const stories = [
  "示例-仓库页--page",
  "示例-设置页--page",
  "示例-列表页--page",
  "示例-内容页--page",
  "示例-调度台--page",
  "控件-select-下拉选择--in-field",
  "控件-toast-轻提示--playground",
  "控件-dropdownmenu-下拉菜单--playground",
  "控件-popover-气泡卡片--playground",
  "控件-flyoutbar-展开条--playground",
  "控件-datarow-数据行带--playground",
  "控件-list-列表行--band",
  "控件-select-下拉选择--multiple",
  "控件-combobox-组合框--in-field",
  "控件-combobox-组合框--multiple",
  "控件-itemslot-物品格--grid",
  "控件-table-表格--playground",
  "控件-table-表格--rich-cells",
  "控件-table-表格--sticky-both",
  "控件-contextmenu-右键菜单--rows",
  "控件-combobox-组合框--remote",
  "控件-siderail-侧轨--playground",
  "控件-siderail-侧轨--sub-tree",
  "控件-panel-面板--band-controls",
  "控件-topbar-顶栏与全屏菜单--playground",
  "控件-navaction-主行动块--layouts",
  "控件-accordion-折叠面板--extra",
  "控件-slider-滑块--marks",
  "控件-slider-滑块--range",
  "控件-avatar-头像与头像切换--switcher-horizontal",
  "控件-carousel-媒体轮播--with-links",
  "控件-calendar-月历--playground",
  "控件-schedule-排期--playground",
  "控件-datepicker-日期选择--start-and-end",
  "控件-playbutton-播放钮--on-cover",
  "控件-mediacard-媒体卡--video",
  "控件-backtotop-回到顶部--in-container",
  "控件-backtotop-回到顶部--page",
  "控件-segmentedcontrol-分段选择--in-field",
  "控件-segmentedcontrol-分段选择--narrow",
  "控件-steps-步骤条--playground",
  "控件-steps-步骤条--clickable",
  "控件-brackettitle-方括号标题--sizes",
  "母题-texture-底纹--variants",
];

for (const id of stories) {
  test(`不横向溢出：${id}`, async () => {
    const { page } = storybook;
    await page.setSize(320, 800);
    await page.story(id);
    assert.deepEqual(await overflowing(page), {
      pageScrolls: false,
      offenders: [],
    });
  });
}

test("仓库页：确认弹窗和随后的轻提示都在视口里", async () => {
  const { page } = storybook;
  await page.setSize(320, 800);
  await page.story("示例-仓库页--page");

  await page.click("text=销毁所选");
  await page.waitVisible("[role=alertdialog]");
  assert.ok(await inside(page, "[role=alertdialog]"), "弹窗超出了视口");

  // 焦点在"取消"上，下一个是确认
  await page.key("Tab");
  await page.key("Enter");
  await page.waitVisible("[role=region] [role=dialog]");
  assert.ok(
    await inside(page, "[role=region] [role=dialog]"),
    "轻提示超出了视口",
  );
});

test("设置页：下拉的面板在视口里", async () => {
  const { page } = storybook;
  await page.setSize(320, 800);
  await page.story("示例-设置页--page");
  await page.click("[role=combobox]");
  await page.waitVisible("[role=listbox]");
  assert.ok(await inside(page, "[role=listbox]"), "面板超出了视口");
});

test("气泡卡片：面板在视口里", async () => {
  const { page } = storybook;
  await page.setSize(320, 800);
  await page.story("控件-popover-气泡卡片--playground");
  await page.click("text=显示设置");
  await page.waitVisible("[role=dialog]");
  assert.ok(await inside(page, "[role=dialog]"), "面板超出了视口");
});
