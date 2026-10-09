// 表格：排序、行内操作在键盘聚焦时可见、窄屏横向滚动并冻结首列、勾选
import assert from "node:assert/strict";
import { test } from "node:test";
import { useStorybook, type Page } from "./lib/harness.ts";

const storybook = useStorybook();

/** 某一列从上到下的文字 */
const column = (page: Page, index: number) =>
  page.evaluate(
    (nth) =>
      [...document.querySelectorAll("#storybook-root tbody tr")].map(
        (row) => row.children[nth]!.textContent ?? "",
      ),
    index,
  );

const ariaSort = (page: Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll("#storybook-root thead th")].map((header) =>
      header.getAttribute("aria-sort"),
    ),
  );

/** 这个元素看上去是不是透明的（它自己或者祖先的 opacity 是 0） */
const hidden = (page: Page, selector: string) =>
  page.evaluate((css) => {
    for (
      let element = document.querySelector(css);
      element;
      element = element.parentElement
    ) {
      if (getComputedStyle(element).opacity === "0") return true;
    }
    return false;
  }, selector);

test("排序：点列头换方向，aria-sort 只在当前排序的列上，行跟着重排", async () => {
  const { page } = storybook;
  await page.story("控件-table-表格--sortable");
  assert.deepEqual(await ariaSort(page), [
    null,
    null,
    null,
    "descending",
    null,
  ]);
  const numbers = async () => (await column(page, 3)).map(Number);
  const descending = await numbers();
  assert.deepEqual(
    descending,
    [...descending].sort((a, b) => b - a),
    "一开始应该按件数降序",
  );

  await page.click("thead th:nth-child(4) button");
  await page.waitFor(
    async () => (await ariaSort(page))[3] === "ascending",
    "再点一次件数应该换成升序",
  );
  const ascending = await numbers();
  assert.deepEqual(
    ascending,
    [...ascending].sort((a, b) => a - b),
  );

  // 换一列：原来那一列的 aria-sort 拿掉
  await page.click("thead th:nth-child(1) button");
  await page.waitFor(
    async () =>
      (await ariaSort(page)).join() === ["ascending", "", "", "", ""].join(),
    "点批次之后只有批次这一列带 aria-sort",
  );
});

test("排序：键盘能走到列头的按钮，回车换方向；标题带上的焦点环看得见", async () => {
  const { page } = storybook;
  for (const theme of ["light", "dark"] as const) {
    await page.story("控件-table-表格--sortable", theme);
    await page.key("Tab");
    await page.waitFocused("button:批次");

    // 焦点环压在反转的标题带上：颜色不能和带子融在一起
    const ring = await page.waitFor(async () => {
      const found = await page.evaluate(() => {
        const button = document.activeElement!;
        const style = getComputedStyle(button);
        return {
          style: style.outlineStyle,
          width: style.outlineWidth,
          color: style.outlineColor,
          band: getComputedStyle(button.parentElement!).backgroundColor,
        };
      });
      return found.style === "solid" && found.width === "2px" ? found : null;
    }, `${theme}：列头按钮应该有 2px 的焦点环`);
    assert.notEqual(ring.color, ring.band, `${theme}：焦点环和标题带同色`);

    await page.key("Enter");
    await page.waitFor(
      async () => (await ariaSort(page))[0] === "ascending",
      "回车应该按批次升序",
    );
  }
});

test("行内操作：平时藏着，悬停这一行显示，键盘聚焦进去也显示", async () => {
  const { page } = storybook;
  await page.story("控件-table-表格--rich-cells");
  const FIRST = "#storybook-root tbody tr:nth-child(1) td:last-child button";
  const SECOND = "#storybook-root tbody tr:nth-child(2) td:last-child button";
  assert.ok(await hidden(page, FIRST), "没悬停时行内操作应该藏着");

  await page.moveTo("#storybook-root tbody tr:nth-child(2) td:nth-child(2)");
  await page.waitFor(
    async () => !(await hidden(page, SECOND)),
    "悬停第二行，它的操作应该显示",
  );
  assert.ok(await hidden(page, FIRST), "别的行不应该跟着显示");

  // 键盘：先到第一行的链接，再到它的操作按钮
  await page.moveTo("#storybook-root thead th:nth-child(1)");
  await page.key("Tab");
  await page.waitFocused(/^a:TR-/);
  await page.key("Tab");
  await page.waitFocused(/^button:复制/);
  await page.waitFor(
    async () => !(await hidden(page, FIRST)),
    "焦点进了这一行，操作应该显示",
  );
});

test("窄屏：表格在自己里面横向滚动，页面不滚；滚过去之后首列还在左边", async () => {
  const { page } = storybook;
  await page.setSize(320, 700);
  try {
    await page.story("控件-table-表格--sticky");
    const before = await page.evaluate(() => {
      const scroller = document.querySelector(
        "#storybook-root table",
      )!.parentElement!;
      return {
        pageScrolls:
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth,
        overflowing: scroller.scrollWidth > scroller.clientWidth + 1,
        role: scroller.getAttribute("role"),
        name: scroller.getAttribute("aria-label"),
        tabIndex: scroller.getAttribute("tabindex"),
      };
    });
    assert.equal(before.pageScrolls, false, "页面不应该横向滚动");
    assert.ok(before.overflowing, "这个宽度下表格应该比容器宽");
    assert.deepEqual(
      [before.role, before.name, before.tabIndex],
      ["region", "运输批次", "0"],
      "溢出时滚动的那一层应该是一个能聚焦的、有名称的区域",
    );

    const after = await page.evaluate(() => {
      const scroller = document.querySelector(
        "#storybook-root table",
      )!.parentElement!;
      scroller.scrollLeft = 120;
      const left = scroller.getBoundingClientRect().left;
      const cells = [
        ...scroller.querySelectorAll("tr > :first-child"),
      ] as HTMLElement[];
      const second = scroller.querySelector("tbody tr > :nth-child(2)")!;
      const firstBody = scroller.querySelector("tbody tr > :first-child")!;
      return {
        scrolled: scroller.scrollLeft,
        pinned: cells.every(
          (cell) => Math.abs(cell.getBoundingClientRect().left - left) < 1,
        ),
        // 第二列滚到首列下面去了：首列得是不透明的，并且压在上面
        covered:
          second.getBoundingClientRect().left <
          firstBody.getBoundingClientRect().right,
        opaque: cells.every((cell) => {
          const color = getComputedStyle(cell).backgroundColor;
          return color !== "rgba(0, 0, 0, 0)" && color !== "transparent";
        }),
        onTop: (() => {
          const rect = firstBody.getBoundingClientRect();
          const hit = document.elementFromPoint(
            rect.right - 4,
            rect.top + rect.height / 2,
          );
          return hit === firstBody || firstBody.contains(hit);
        })(),
      };
    });
    assert.ok(after.scrolled > 0, "应该能横向滚动");
    assert.ok(after.pinned, "滚过去之后每一行的第一格都应该还贴着左边");
    assert.ok(after.covered, "第二列应该滚到了首列下面");
    assert.ok(after.opaque, "冻结的那一格不能是透明的");
    assert.ok(after.onTop, "冻结的那一格应该压在滚过去的内容上面");
  } finally {
    await page.setSize(1200, 800);
  }
});

test("宽的时候不溢出：滚动的那一层不占 Tab 停靠点", async () => {
  const { page } = storybook;
  await page.story("控件-table-表格--playground");
  const scroller = await page.evaluate(() => {
    const element = document.querySelector(
      "#storybook-root table",
    )!.parentElement!;
    return {
      role: element.getAttribute("role"),
      tabIndex: element.getAttribute("tabindex"),
    };
  });
  assert.deepEqual(scroller, { role: null, tabIndex: null });
});

test("勾选：全选在部分选中时是半选；勾上的行是选中的", async () => {
  const { page } = storybook;
  await page.story("控件-table-表格--selectable");
  const state = () =>
    page.evaluate(() => {
      const all = document.querySelector<HTMLInputElement>(
        "#storybook-root thead input",
      )!;
      return {
        all: all.indeterminate ? "mixed" : all.checked,
        selected: [...document.querySelectorAll("#storybook-root tbody tr")]
          .map((row) => row.getAttribute("aria-selected"))
          .filter((value) => value === "true").length,
      };
    });
  assert.deepEqual(await state(), { all: "mixed", selected: 1 });

  await page.click("#storybook-root thead input");
  await page.waitFor(
    async () => (await state()).selected === 6,
    "点全选之后六行都应该选中",
  );
  assert.equal((await state()).all, true);

  await page.click("#storybook-root tbody tr:nth-child(1) input");
  await page.waitFor(
    async () => (await state()).all === "mixed",
    "取消一行之后全选应该回到半选",
  );
});

test("两个主题：悬停的行、选中的行和普通的行底色各不相同", async () => {
  const { page } = storybook;
  for (const theme of ["light", "dark"] as const) {
    await page.story("控件-table-表格--selectable", theme);
    const background = (row: number) =>
      page.evaluate(
        (nth) =>
          getComputedStyle(
            document.querySelector(
              `#storybook-root tbody tr:nth-child(${nth})`,
            )!,
          ).backgroundColor,
        row,
      );
    const plain = await background(1);
    const selected = await background(2);
    assert.notEqual(selected, plain, `${theme}：选中的行应该有自己的底色`);

    await page.moveTo("#storybook-root tbody tr:nth-child(4) td:nth-child(3)");
    const hovered = await page.waitFor(async () => {
      const color = await background(4);
      return color !== plain ? color : null;
    }, `${theme}：悬停的行底色应该变`);
    assert.notEqual(
      hovered,
      selected,
      `${theme}：悬停和选中不应该是同一个底色`,
    );
  }
});

test("表头吸顶：表身在容器里滚过去，表头还在容器的上沿并压在内容上面", async () => {
  const { page } = storybook;
  await page.story("控件-table-表格--sticky-header");
  const before = await page.evaluate(() => {
    const scroller = document.querySelector(
      "#storybook-root table",
    )!.parentElement!;
    return {
      overflowing: scroller.scrollHeight > scroller.clientHeight + 1,
      role: scroller.getAttribute("role"),
      tabIndex: scroller.getAttribute("tabindex"),
      // 只是纵向溢出：冻结列右缘的那条线不该出现
      overflowingX: scroller.hasAttribute("data-overflowing"),
    };
  });
  assert.ok(before.overflowing, "这个高度下表身应该比容器高");
  assert.deepEqual(
    [before.role, before.tabIndex, before.overflowingX],
    ["region", "0", false],
    "纵向溢出时容器同样是一个能聚焦的区域",
  );

  const after = await page.evaluate(() => {
    const scroller = document.querySelector(
      "#storybook-root table",
    )!.parentElement!;
    scroller.scrollTop = 150;
    const top = scroller.getBoundingClientRect().top;
    const headers = [...scroller.querySelectorAll("thead th")];
    const first = headers[0]!.getBoundingClientRect();
    const hit = document.elementFromPoint(
      first.left + first.width / 2,
      first.top + first.height / 2,
    );
    return {
      scrolled: scroller.scrollTop,
      pinned: headers.every(
        (header) => Math.abs(header.getBoundingClientRect().top - top) < 1,
      ),
      onTop: headers[0] === hit || headers[0]!.contains(hit),
      opaque: headers.every((header) => {
        const color = getComputedStyle(header).backgroundColor;
        return color !== "rgba(0, 0, 0, 0)" && color !== "transparent";
      }),
    };
  });
  assert.ok(after.scrolled > 0, "应该能纵向滚动");
  assert.ok(after.pinned, "滚过去之后表头应该还贴着容器的上沿");
  assert.ok(after.onTop, "表头应该压在滚过去的行上面");
  assert.ok(after.opaque, "表头不能是透明的");
});

test("表头吸顶并冻结首列：两个方向都滚过去，左上角那一格压在最上面", async () => {
  const { page } = storybook;
  await page.story("控件-table-表格--sticky-both");
  const found = await page.evaluate(() => {
    const scroller = document.querySelector(
      "#storybook-root table",
    )!.parentElement!;
    scroller.scrollTop = 120;
    scroller.scrollLeft = 90;
    const box = scroller.getBoundingClientRect();
    const corner = scroller.querySelector("thead th")!;
    const rect = corner.getBoundingClientRect();
    const hit = (x: number, y: number) => {
      const element = document.elementFromPoint(x, y);
      return element === corner || corner.contains(element);
    };
    return {
      scrolled: [scroller.scrollLeft > 0, scroller.scrollTop > 0],
      pinned:
        Math.abs(rect.left - box.left) < 1 && Math.abs(rect.top - box.top) < 1,
      // 四个角都点得到它：滚过来的列头和滚上来的首列都在它下面
      onTop:
        hit(rect.left + 3, rect.top + 3) &&
        hit(rect.right - 3, rect.top + 3) &&
        hit(rect.left + 3, rect.bottom - 3) &&
        hit(rect.right - 3, rect.bottom - 3),
    };
  });
  assert.deepEqual(found.scrolled, [true, true], "两个方向都应该能滚");
  assert.ok(found.pinned, "左上角那一格应该留在容器的左上角");
  assert.ok(found.onTop, "左上角那一格应该压在冻结的列和吸顶的行之上");
});
