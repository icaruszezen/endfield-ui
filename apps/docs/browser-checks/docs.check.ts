// 文档页会把一个组件的全部 story 同时渲染出来：里面不能有开着的浮层，也不能报错
import assert from "node:assert/strict";
import { test } from "node:test";
import { useStorybook } from "./lib/harness.ts";

const storybook = useStorybook({ width: 1280, height: 900 });

const pages = [
  "控件-dialog-弹窗--docs",
  "控件-drawer-抽屉--docs",
  "控件-toast-轻提示--docs",
  "控件-select-下拉选择--docs",
  "控件-combobox-组合框--docs",
  "控件-itemslot-物品格--docs",
  "控件-table-表格--docs",
  "控件-toolbar-工具栏--docs",
  "控件-siderail-侧轨--docs",
  "控件-topbar-顶栏与全屏菜单--docs",
  "控件-navaction-主行动块--docs",
  "控件-dropdownmenu-下拉菜单--docs",
  "控件-contextmenu-右键菜单--docs",
  "控件-accordion-折叠面板--docs",
  "控件-slider-滑块--docs",
  "控件-avatar-头像与头像切换--docs",
  "控件-carousel-媒体轮播--docs",
  "控件-calendar-月历--docs",
  "控件-datepicker-日期选择--docs",
  "控件-daterangepicker-日期范围--docs",
  "控件-schedule-排期--docs",
  "控件-playbutton-播放钮--docs",
  "控件-mediacard-媒体卡--docs",
  "控件-backtotop-回到顶部--docs",
  "控件-segmentedcontrol-分段选择--docs",
  "控件-steps-步骤条--docs",
  "控件-panel-面板--docs",
  "控件-tooltip-文字提示--docs",
  "控件-popover-气泡卡片--docs",
  "控件-flyoutbar-展开条--docs",
  "控件-datarow-数据行带--docs",
  "控件-sparkline-小型面积图--docs",
  "控件-list-列表行--docs",
  "母题-texture-底纹--docs",
];

for (const id of pages) {
  test(`文档页：${id}`, async () => {
    const { page } = storybook;
    await page.docs(id);

    const found = await page.evaluate(() => ({
      stories: document.querySelectorAll(".docs-story").length,
      dialogs: document.querySelectorAll("[role=dialog], [role=alertdialog]")
        .length,
      panels: [
        ...document.querySelectorAll("[role=listbox], [role=menu]"),
      ].filter((element) => !element.closest("[hidden]")).length,
    }));
    assert.ok(found.stories > 0, "文档页里没有 story");
    assert.equal(found.dialogs, 0, "文档页里有开着的弹窗、抽屉或轻提示");
    assert.equal(found.panels, 0, "文档页里有开着的下拉面板");
    assert.deepEqual(page.errors, [], "页面报了错");
  });
}
