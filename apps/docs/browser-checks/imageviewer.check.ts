// 图片查看：点缩略图开大图层、翻页、整张显示、关了之后焦点的落点、窄屏
import assert from "node:assert/strict";
import { test } from "node:test";
import { useStorybook, type Page } from "./lib/harness.ts";

const storybook = useStorybook();

const VIEWER = "[data-image-viewer]";
const PLAYGROUND = "控件-imageviewer-图片查看--playground";

/** 第几张缩略图的中心点 */
const thumbPoint = (page: Page, index: number) =>
  page.evaluate((nth) => {
    const rect = document
      .querySelectorAll("#storybook-root ul button")
      [nth]!.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  }, index);

/** 大图层现在的样子；没开是 null */
const read = (page: Page) =>
  page.evaluate((css) => {
    const viewer = document.querySelector<HTMLElement>(css);
    if (!viewer) return null;
    const track = viewer.querySelector<HTMLElement>(
      "[data-image-viewer-track]",
    )!;
    const button = (name: string) =>
      viewer.querySelector<HTMLButtonElement>(`button[aria-label="${name}"]`);
    return {
      count: viewer.querySelector("[data-count]")?.textContent ?? null,
      title: viewer.querySelector("[aria-live] p")?.textContent ?? null,
      // 轨道停在第几张上
      slide:
        track.clientWidth > 0
          ? Math.round(track.scrollLeft / track.clientWidth)
          : -1,
      settled: track.scrollLeft % Math.max(track.clientWidth, 1) === 0,
      previous: button("上一张")?.disabled ?? null,
      next: button("下一张")?.disabled ?? null,
      focusInside: viewer.contains(document.activeElement),
      focusOnLayer: document.activeElement === viewer,
      background: getComputedStyle(viewer).backgroundColor,
    };
  }, VIEWER);

/** 面板出现和焦点进面板不是同一刻：等焦点到了再往下走，不然按键会落在外面 */
const waitReady = async (page: Page) => {
  await page.waitVisible(VIEWER, "大图层应该打开");
  await page.waitFor(
    async () => (await read(page))?.focusOnLayer === true,
    "打开时焦点应该落在大图层自己身上",
  );
  // 轨道挂上之后还要对一次位置，等它走完
  await page.frames();
};

const openAt = async (page: Page, index: number) => {
  await page.click(await thumbPoint(page, index));
  await waitReady(page);
};

const waitCount = (page: Page, expected: string, message: string) =>
  page.waitFor(async () => {
    const now = await read(page);
    return now?.count === expected && now.settled;
  }, message);

test("点第三张缩略图：大图层开在第三张；舞台在两个主题下都是深色；焦点在这一层里出不去", async () => {
  const { page } = storybook;
  let dark = "";
  for (const theme of ["light", "dark"] as const) {
    await page.story(PLAYGROUND, theme);
    const surface = await page.evaluate(() => {
      const probe = document.createElement("i");
      probe.style.backgroundColor = "var(--ef-surface)";
      document.querySelector("#storybook-root")!.append(probe);
      const color = getComputedStyle(probe).backgroundColor;
      probe.remove();
      return color;
    });

    await openAt(page, 2);
    await waitCount(page, "3 / 5", `${theme}：应该开在第三张`);
    const opened = (await read(page))!;
    assert.equal(opened.title, "第三岩层营地全景");
    assert.equal(opened.slide, 2, "轨道应该直接对到第三张");

    if (theme === "light") {
      // 亮色页面上它也是深色的：等淡入走完再读
      await page.waitFor(
        async () => (await read(page))!.background !== surface,
        "亮色页面上大图层的底不该是页面的白",
      );
      dark = (await read(page))!.background;
    } else {
      await page.waitEqual(
        async () => (await read(page))!.background,
        dark,
        "暗色页面上大图层的底和亮色页面上是同一个深色",
      );
    }

    // Tab 走一圈：关闭、上一张、下一张，然后还在这一层里
    for (let press = 0; press < 5; press += 1) {
      await page.key("Tab");
      assert.equal(
        (await read(page))!.focusInside,
        true,
        `${theme}：Tab 不应该走出大图层`,
      );
    }
    // 底下的缩略图点不到：那个位置上现在是大图层
    const covered = await page.evaluate(
      ({ css, point }) =>
        document
          .querySelector(css)!
          .contains(document.elementFromPoint(point.x, point.y)),
      { css: VIEWER, point: await thumbPoint(page, 0) },
    );
    assert.equal(covered, true, `${theme}：大图层应该盖住整个页面`);

    await page.key("Escape");
    await page.waitGone(VIEWER);
  }
});

test("方向键翻页：计数、标题、轨道的位置对得上；到头的翻页钮禁用", async () => {
  const { page } = storybook;
  await page.story(PLAYGROUND);
  await openAt(page, 0);
  await waitCount(page, "1 / 5", "开在第一张");
  assert.deepEqual(
    [(await read(page))!.previous, (await read(page))!.next],
    [true, false],
    "第一张：上一张禁用",
  );

  await page.key("ArrowRight");
  await waitCount(page, "2 / 5", "→ 到第二张");
  await page.waitFor(
    async () => (await read(page))!.slide === 1,
    "轨道应该滚到第二张",
  );
  assert.equal((await read(page))!.title, "信标 B-12");

  await page.key("End");
  await waitCount(page, "5 / 5", "End 到最后一张");
  await page.waitFor(async () => {
    const now = (await read(page))!;
    return now.slide === 4 && now.next === true && now.previous === false;
  }, "最后一张：轨道到头，下一张禁用");

  await page.key("Home");
  await waitCount(page, "1 / 5", "Home 回到第一张");
  await page.waitFor(
    async () => (await read(page))!.slide === 0,
    "轨道应该回到第一张",
  );
});

test("点翻页钮也能翻；翻到头，焦点交还给这一层，方向键还能翻回去", async () => {
  const { page } = storybook;
  await page.story(PLAYGROUND);
  await openAt(page, 3);
  await waitCount(page, "4 / 5", "开在第四张");

  await page.click(`${VIEWER} button[aria-label="下一张"]`);
  await waitCount(page, "5 / 5", "点下一张到第五张");
  await page.waitFor(
    async () => (await read(page))!.focusOnLayer,
    "刚按的钮禁用了，焦点应该回到这一层",
  );
  await page.key("ArrowLeft");
  await waitCount(page, "4 / 5", "← 还能翻回去");
});

test("横幅、竖幅、宽幅：都按原比例整张放在舞台里", async () => {
  const { page } = storybook;
  await page.story(PLAYGROUND);
  await openAt(page, 0);

  for (const [index, name] of ["横幅", "竖幅", "宽幅"].entries()) {
    await waitCount(page, `${index + 1} / 5`, `到第 ${index + 1} 张`);
    // 隔一张的图是翻到旁边时才开始取的：等它取完再量
    await page.waitFor(
      () =>
        page.evaluate((css) => {
          const image = document.querySelector<HTMLImageElement>(
            `${css} [data-current] img`,
          );
          return Boolean(image?.complete && image.naturalWidth > 0);
        }, VIEWER),
      `${name}的图应该取得到`,
    );
    const found = await page.evaluate((css) => {
      const slide = document.querySelector(`${css} [data-current]`)!;
      const image = slide.querySelector("img")!;
      const stage = slide.getBoundingClientRect();
      const rect = image.getBoundingClientRect();
      return {
        loaded: image.complete && image.naturalWidth > 0,
        inside:
          rect.left >= stage.left &&
          rect.right <= stage.right &&
          rect.top >= stage.top &&
          rect.bottom <= stage.bottom,
        // 显示出来的宽高比和图自己的宽高比差多少
        skew: Math.abs(
          rect.width / rect.height - image.naturalWidth / image.naturalHeight,
        ),
        visible: rect.width > 100 && rect.height > 100,
      };
    }, VIEWER);
    assert.deepEqual(
      { ...found, skew: found.skew < 0.02 },
      { loaded: true, inside: true, skew: true, visible: true },
      `${name}的图应该整张在舞台里、不变形`,
    );
    await page.key("ArrowRight");
  }
});

test("自己滑：轨道停在第三张，计数和标题跟着变", async () => {
  const { page } = storybook;
  await page.story(PLAYGROUND);
  await openAt(page, 0);
  await waitCount(page, "1 / 5", "开在第一张");

  await page.evaluate((css) => {
    const track = document.querySelector<HTMLElement>(
      `${css} [data-image-viewer-track]`,
    )!;
    track.scrollLeft = track.clientWidth * 2;
  }, VIEWER);
  await waitCount(page, "3 / 5", "滑到第三张停稳之后，计数应该跟着变");
  assert.equal((await read(page))!.title, "第三岩层营地全景");
});

test("点图不关；点舞台上的空处才关，焦点回到当前这一张的缩略图", async () => {
  const { page } = storybook;
  await page.story(PLAYGROUND);
  await openAt(page, 0);
  await page.key("ArrowRight");
  await page.key("ArrowRight");
  await waitCount(page, "3 / 5", "翻到第三张");

  const points = await page.evaluate((css) => {
    const slide = document.querySelector(`${css} [data-current]`)!;
    const stage = slide.getBoundingClientRect();
    const image = slide.querySelector("img")!.getBoundingClientRect();
    return {
      image: {
        x: image.left + image.width / 2,
        y: image.top + image.height / 2,
      },
      // 图的上边和舞台上缘之间的那一条空处
      empty: { x: stage.left + stage.width / 2, y: stage.top + 8 },
    };
  }, VIEWER);

  await page.click(points.image);
  await page.pause(300);
  assert.notEqual(await read(page), null, "点图本身不应该关");

  await page.click(points.empty);
  await page.waitGone(VIEWER, "点舞台上的空处应该关");
  await page.waitFocused(
    "button:查看大图：第三岩层营地全景",
    "关了之后焦点应该回到第三张的缩略图",
  );
});

test("Esc 和关闭钮都能关，焦点回到缩略图", async () => {
  const { page } = storybook;
  await page.story(PLAYGROUND);

  await openAt(page, 1);
  await page.key("Escape");
  await page.waitGone(VIEWER, "Esc 应该关");
  await page.waitFocused("button:查看大图：信标 B-12");

  await openAt(page, 1);
  await page.click(`${VIEWER} button[aria-label="关闭"]`);
  await page.waitGone(VIEWER, "关闭钮应该关");
  await page.waitFocused("button:查看大图：信标 B-12");
});

test("只有一张：没有翻页钮和计数，标题还在", async () => {
  const { page } = storybook;
  await page.story("控件-imageviewer-图片查看--single");
  await openAt(page, 0);
  await page.waitFor(
    async () => (await read(page))?.title === "三号管廊入口",
    "标题应该在",
  );
  const found = (await read(page))!;
  assert.deepEqual(
    [found.count, found.previous, found.next],
    [null, null, null],
    "只有一张时没有计数和翻页钮",
  );
});

test("受控：外面的按钮直接开在第三张，开关和下标都报给外面", async () => {
  const { page } = storybook;
  await page.story("控件-imageviewer-图片查看--controlled");
  const status = async () =>
    (await page.text("#storybook-root [role=status]"))[0];

  await page.click("#storybook-root button");
  await waitReady(page);
  await waitCount(page, "3 / 4", "应该开在第三张");
  await page.key("ArrowRight");
  await waitCount(page, "4 / 4", "→ 到第四张");
  await page.key("Escape");
  await page.waitGone(VIEWER);
  await page.waitFor(
    async () => (await status()) === "// 关着，第 4 张",
    "关了之后外面应该知道：关着，停在第四张",
  );
});

test("缩略图：比例按给的来；悬停时底边充出一条线", async () => {
  const { page } = storybook;
  await page.story("控件-imageviewer-图片查看--ratios");
  const ratios = await page.evaluate(() =>
    [...document.querySelectorAll("#storybook-root ul")].map((list) => {
      const rect = list.querySelector("button")!.getBoundingClientRect();
      return rect.width / rect.height;
    }),
  );
  assert.ok(Math.abs(ratios[0]! - 1) < 0.02, "第一组是方形的");
  assert.ok(Math.abs(ratios[1]! - 16 / 9) < 0.03, "第二组是 16:9 的");

  const line = () =>
    page.evaluate(() => {
      const mark = document.querySelector(
        "#storybook-root ul button > span[aria-hidden]",
      )!;
      // 横向缩放了多少：0 是没出来，1 是充满。写的是 scale 属性，不是 transform
      return parseFloat(getComputedStyle(mark).scale);
    });
  await page.waitEqual(line, 0, "平时那条线不出来");
  await page.moveTo(await thumbPoint(page, 0));
  await page.waitEqual(line, 1, "悬停时那条线充满底边");
  await page.moveTo({ x: 5, y: 5 });
});

test("320px 宽：大图层不横向溢出，翻页钮和说明都在视口里", async () => {
  const { page } = storybook;
  await page.setSize(320, 640);
  try {
    await page.story(PLAYGROUND);
    await openAt(page, 2);
    await waitCount(page, "3 / 5", "开在第三张");
    const found = await page.evaluate((css) => {
      const viewer = document.querySelector<HTMLElement>(css)!;
      const outside = [
        ...viewer.querySelectorAll<HTMLElement>("button, p, [data-count]"),
      ].filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && (rect.left < 0 || rect.right > innerWidth);
      }).length;
      const image = viewer
        .querySelector("[data-current] img")!
        .getBoundingClientRect();
      return {
        pageScrolls: document.documentElement.scrollWidth > innerWidth,
        outside,
        imageInside: image.left >= 0 && image.right <= innerWidth,
        fills: viewer.getBoundingClientRect().width === innerWidth,
      };
    }, VIEWER);
    assert.deepEqual(found, {
      pageScrolls: false,
      outside: 0,
      imageInside: true,
      fills: true,
    });
  } finally {
    await page.setSize(1280, 860);
  }
});
