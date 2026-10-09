// 文件上传：拖进来、把关、移除后的焦点、表单值、拖入态的画法
// 从桌面真的拖一个文件、系统的文件框，驱动做不了：这里用的是合成的拖放事件
import assert from "node:assert/strict";
import { test } from "node:test";
import { useStorybook, type Page } from "./lib/harness.ts";

const storybook = useStorybook();

const ZONE = "#storybook-root [data-dropzone]";

type Fake = { name: string; type: string; bytes: number };

/** 在投放区上派发一个带文件的拖放事件 */
const dispatch = (
  page: Page,
  kind: "dragenter" | "dragleave" | "drop",
  files: Fake[],
  nth = 0,
) =>
  page.evaluate(
    ({ css, event, list, index }) => {
      const data = new DataTransfer();
      for (const fake of list) {
        data.items.add(
          new File([new Uint8Array(fake.bytes)], fake.name, {
            type: fake.type,
            lastModified: 1,
          }),
        );
      }
      document.querySelectorAll(css)[index]!.dispatchEvent(
        new DragEvent(event, {
          dataTransfer: data,
          bubbles: true,
          cancelable: true,
        }),
      );
    },
    { css: ZONE, event: kind, list: files, index: nth },
  );

const names = (page: Page) =>
  page.text("#storybook-root ul[aria-label] li [title]");

const pdf: Fake = {
  name: "巡检记录.pdf",
  type: "application/pdf",
  bytes: 2048,
};
const png: Fake = { name: "信标照片.png", type: "image/png", bytes: 4096 };
const exe: Fake = {
  name: "工具.exe",
  type: "application/x-msdownload",
  bytes: 64,
};

test("投放区里是一个真的文件输入框：Tab 到得了，焦点环画在投放区上", async () => {
  const { page } = storybook;
  await page.story("控件-fileupload-文件上传--playground");
  await page.key("Tab");
  await page.waitFocused("input:交接附件");
  const found = await page.waitFor(async () => {
    const result = await page.evaluate((css) => {
      const zone = document.querySelector<HTMLElement>(css)!;
      const input = zone.querySelector("input")!;
      const style = getComputedStyle(zone);
      const box = zone.getBoundingClientRect();
      const inner = input.getBoundingClientRect();
      return {
        type: input.type,
        ring: `${style.outlineStyle} ${style.outlineWidth}`,
        // 输入框铺满投放区：点哪儿都是它
        covers:
          Math.abs(inner.width - zone.clientWidth) < 1 &&
          Math.abs(inner.height - zone.clientHeight) < 1,
        hit: document.elementFromPoint(box.left + 8, box.bottom - 8) === input,
        opacity: getComputedStyle(input).opacity,
      };
    }, ZONE);
    return result.ring === "solid 2px" ? result : null;
  }, "键盘聚焦时投放区上应该有焦点环");
  assert.deepEqual(found, {
    type: "file",
    ring: "solid 2px",
    covers: true,
    hit: true,
    opacity: "0",
  });
});

test("拖到上面：虚线变实线、四角出取景角、字换一句；离开就复原（亮暗两套）", async () => {
  const { page } = storybook;
  for (const theme of ["light", "dark"] as const) {
    await page.story("控件-fileupload-文件上传--playground", theme);
    await page.frames();
    const look = () =>
      page.evaluate((css) => {
        const zone = document.querySelector<HTMLElement>(css)!;
        const style = getComputedStyle(zone);
        const probe = document.createElement("i");
        probe.style.color = "var(--ef-ink)";
        zone.parentElement!.append(probe);
        const ink = getComputedStyle(probe).color;
        probe.remove();
        const brackets = zone.querySelector("[data-brackets]");
        return {
          line: style.borderTopStyle,
          inkLine: style.borderTopColor === ink,
          brackets:
            brackets !== null &&
            getComputedStyle(brackets, "::after").backgroundImage !== "none",
          text: zone.textContent,
        };
      }, ZONE);

    assert.deepEqual(await look(), {
      line: "dashed",
      inkLine: false,
      brackets: false,
      text: "把文件拖到这里，或者选择文件PDF 或图片，单个不超过 10 MB，最多 5 个",
    });

    await dispatch(page, "dragenter", [pdf]);
    await page.waitFor(
      async () => (await look()).inkLine,
      `${theme}：拖到上面时线应该变成墨色`,
    );
    assert.deepEqual(await look(), {
      line: "solid",
      inkLine: true,
      brackets: true,
      text: "松开，放进来PDF 或图片，单个不超过 10 MB，最多 5 个",
    });

    await dispatch(page, "dragleave", [pdf]);
    await page.waitFor(
      async () => (await look()).line === "dashed",
      `${theme}：离开之后应该回到虚线`,
    );
    assert.equal((await look()).brackets, false);
  }
});

test("放下：文件列出来，带扩展名和大小；类型不对的不收，下面出一行说明", async () => {
  const { page } = storybook;
  await page.story("控件-fileupload-文件上传--playground");
  await dispatch(page, "drop", [pdf, exe, png]);
  await page.waitFor(
    async () => (await names(page)).join("|") === "巡检记录.pdf|信标照片.png",
    "合格的两个文件应该列出来",
  );

  const rows = await page.evaluate(() =>
    [...document.querySelectorAll("#storybook-root ul[aria-label] li")].map(
      (row) => ({
        extension: row.querySelector("[data-extension]")!.textContent,
        size: row.querySelector("[data-meta]")!.textContent,
        height: (row.firstElementChild as HTMLElement).offsetHeight,
      }),
    ),
  );
  assert.deepEqual(rows, [
    { extension: "PDF", size: "2 KB", height: 40 },
    { extension: "PNG", size: "4 KB", height: 40 },
  ]);

  assert.equal(
    (await page.text("#storybook-root [data-rejections]"))[0],
    "1 个文件没有加进来：工具.exe 类型不对",
  );

  // 下一次加文件：那一行换掉
  await dispatch(page, "drop", [
    { name: "站点平面图.png", type: "image/png", bytes: 1024 },
  ]);
  await page.waitFor(
    async () => (await names(page)).length === 3,
    "再放一个应该是接着加",
  );
  assert.equal((await page.text("#storybook-root [data-rejections]"))[0], "");
});

test("太大的、超出个数的不收", async () => {
  const { page } = storybook;
  await page.story("控件-fileupload-文件上传--in-field");
  await dispatch(page, "drop", [
    pdf,
    { name: "全景.png", type: "image/png", bytes: 11 * 1024 * 1024 },
    png,
    { name: "草图一.png", type: "image/png", bytes: 512 },
    { name: "草图二.png", type: "image/png", bytes: 512 },
  ]);
  await page.waitFor(
    async () => (await names(page)).length === 3,
    "最多收三个",
  );
  assert.equal(
    (await page.text("#storybook-root [data-rejections]"))[0],
    "2 个文件没有加进来：全景.png 超过 10 MB；草图二.png 超出个数上限（最多 3 个）",
  );
});

test("列表里的文件随表单提交；移除的不在里面", async () => {
  const { page } = storybook;
  await page.story("控件-fileupload-文件上传--in-field");
  // 没放文件就提交：字段报错
  await page.click("text=提交");
  await page.waitVisible("#storybook-root [id$=error]", "应该出现错误说明");

  await dispatch(page, "drop", [pdf, png]);
  await page.waitFor(
    async () => (await names(page)).length === 2,
    "应该有两个",
  );
  await page.waitGone("#storybook-root [id$=error]", "放了文件错误应该消失");
  await page.click("text=提交");
  await page.waitFor(
    async () =>
      (await page.text("#storybook-root output"))[0] ===
      "attachments=巡检记录.pdf|信标照片.png",
    "提交的应该是列表里那两个",
  );

  await page.click("text=移除巡检记录.pdf");
  await page.waitFor(
    async () => (await names(page)).length === 1,
    "应该剩一个",
  );
  await page.click("text=提交");
  await page.waitFor(
    async () =>
      (await page.text("#storybook-root output"))[0] ===
      "attachments=信标照片.png",
    "移除的不应该再提交",
  );
});

test("移除之后焦点有去处：下一行的移除钮，一个不剩回到投放区", async () => {
  const { page } = storybook;
  await page.story("控件-fileupload-文件上传--with-files");
  assert.deepEqual(await names(page), ["交接单-1009.pdf", "北段管廊-现场.png"]);

  await page.key("Tab");
  await page.waitFocused("input:交接附件");
  await page.key("Tab");
  await page.waitFocused("button:移除交接单-1009.pdf");
  await page.key("Enter");
  await page.waitFocused(
    "button:移除北段管廊-现场.png",
    "焦点应该落到下一行的移除钮上",
  );
  await page.key("Enter");
  await page.waitFocused("input:交接附件", "一个不剩时焦点应该回到投放区");
  assert.deepEqual(await names(page), []);
});

test("只收一个：再放一个替掉原来的", async () => {
  const { page } = storybook;
  await page.story("控件-fileupload-文件上传--single");
  assert.deepEqual(await names(page), ["北段管廊-现场.png"]);
  await dispatch(page, "drop", [png]);
  await page.waitFor(
    async () => (await names(page)).join() === "信标照片.png",
    "新放的应该替掉原来的",
  );
});

test("禁用：拖进来不收，也不出拖入态", async () => {
  const { page } = storybook;
  await page.story("控件-fileupload-文件上传--states");
  await dispatch(page, "dragenter", [pdf], 1);
  await dispatch(page, "drop", [pdf], 1);
  await page.pause(300);
  const found = await page.evaluate((css) => {
    const zone = document.querySelectorAll<HTMLElement>(css)[1]!;
    return {
      dragging: zone.hasAttribute("data-dragging"),
      line: getComputedStyle(zone).borderTopStyle,
      disabled: zone.querySelector("input")!.disabled,
    };
  }, ZONE);
  assert.deepEqual(found, { dragging: false, line: "dashed", disabled: true });
  assert.deepEqual(await names(page), ["交接单-1009.pdf"]);
});

test("文件行：上传中有进度条和百分比，失败有说明和重试，名字太长截断", async () => {
  const { page } = storybook;
  await page.story("控件-fileupload-文件上传--items");
  const rows = await page.evaluate(() =>
    [...document.querySelectorAll("#storybook-root li > div")].map((row) => {
      const name = row.querySelector<HTMLElement>("[title]")!;
      const bar = row.querySelector("[role=progressbar]");
      return {
        status: row.getAttribute("data-status"),
        meta: row.querySelector("[data-meta]")?.textContent ?? null,
        bar: bar ? bar.getAttribute("aria-valuenow") : "none",
        truncated: name.scrollWidth > name.clientWidth,
        buttons: [...row.querySelectorAll("button")].map(
          (button) => button.getAttribute("aria-label") ?? button.textContent,
        ),
        link: row.querySelector("a") !== null,
      };
    }),
  );
  assert.deepEqual(rows, [
    {
      status: null,
      meta: "1.2 MB",
      bar: "none",
      truncated: false,
      buttons: [],
      link: true,
    },
    {
      status: "uploading",
      meta: "42%",
      bar: "42",
      truncated: false,
      buttons: ["移除交接单-1009.pdf"],
      link: false,
    },
    {
      status: "uploading",
      meta: null,
      bar: null,
      truncated: false,
      buttons: ["移除设备日志"],
      link: false,
    },
    {
      status: "done",
      meta: "320 KB",
      bar: "none",
      truncated: false,
      buttons: ["移除北段管廊-现场.png"],
      link: false,
    },
    {
      status: "error",
      meta: "86 MB",
      bar: "none",
      truncated: true,
      buttons: ["重试", "移除第七勘探区的首批测绘数据-全景拼接-未压缩.tiff"],
      link: false,
    },
    {
      status: null,
      meta: "2.1 MB",
      bar: "none",
      truncated: false,
      buttons: ["移除旧版平面图.png"],
      link: false,
    },
  ]);
});

test("两档尺寸：sm 是矮的那一档，至少 40px 高", async () => {
  const { page } = storybook;
  await page.story("控件-fileupload-文件上传--sizes");
  const heights = await page.evaluate(
    (css) =>
      [...document.querySelectorAll<HTMLElement>(css)].map(
        (zone) => zone.offsetHeight,
      ),
    ZONE,
  );
  // 不断言正好 40px：CI 上没有中文字体，字宽不一样，那一行可能折成两行
  assert.ok(heights[1]! >= 40, `sm 至少 40px 高，实际 ${heights[1]}px`);
  assert.ok(
    heights[0]! > heights[1]!,
    `md 应该比 sm 高，实际 ${heights[0]}px 和 ${heights[1]}px`,
  );
});
