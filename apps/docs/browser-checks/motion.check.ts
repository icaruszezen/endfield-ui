// 正常动效下进出场真的有过渡，过渡走完后停在终态、关闭后被卸载；"减少动态效果"下没有过渡。
// 状态的记号（勾、细线、连线、括号、填入的字）也在这里。断言三件事：声明了什么过渡（计算样式）、
// 它真的跑过（浏览器发的 transitionrun / animationstart）、走完之后停在哪——都不靠"正好量到一半"。
// 最后几条是只播一次的入场：进视口才播的，把 story 推到视口下面再重播，看它等不等
import assert from "node:assert/strict";
import { test } from "node:test";
import { useStorybook, type Page } from "./lib/harness.ts";

const storybook = useStorybook();

/** 这个元素上正在跑的过渡数；元素不在（或藏着）时是 null */
const running = (page: Page, selector: string) =>
  page.evaluate((css) => {
    const element = document.querySelector(css);
    if (!element || element.closest("[hidden]")) return null;
    return element.getAnimations().length;
  }, selector);

const opacity = (page: Page, selector: string) =>
  page.evaluate(
    (css) => Number(getComputedStyle(document.querySelector(css)!).opacity),
    selector,
  );

/** 这个元素（或它的伪元素）上声明的过渡：属性名 → 时长（秒）。元素不在时是 null */
const transitions = (page: Page, selector: string, pseudo?: string) =>
  page.evaluate(
    (css, pseudoElement) => {
      const element = document.querySelector(css);
      if (!element) return null;
      const style = getComputedStyle(element, pseudoElement);
      const durations = style.transitionDuration
        .split(",")
        .map((value) => Number.parseFloat(value));
      return Object.fromEntries(
        style.transitionProperty
          .split(",")
          .map((property, index) => [
            property.trim(),
            durations[index % durations.length]!,
          ]),
      );
    },
    selector,
    pseudo ?? null,
  );

type MotionLog = { motionLog: string[]; motionFrom: [number, number][] };

/**
 * 从现在起记下这个范围里（含后代和伪元素）跑起来的过渡与动画。
 * 记的是浏览器自己发的事件，过渡再短也漏不掉；写成 `属性名` 或 `动画名`，
 * 伪元素上的带后缀（`scale::before`）。换一页之后要重新开始记。
 *
 * 浮层挂在 <body> 下：范围给 `body`，再用 `only` 只留下要看的那几个元素。
 * 位移（`translate`）的过渡另记一样——它从哪儿出发：事件到的这一刻过渡刚建出来，
 * 它的第一帧就是起点。所以"从哪一侧来"也不用去量跑到一半的位置
 */
const record = (page: Page, selector: string, only?: string) =>
  page.evaluate(
    (css, filter) => {
      const seen: string[] = [];
      const from: [number, number][] = [];
      Object.assign(window, { motionLog: seen, motionFrom: from });
      const root = document.querySelector(css)!;
      const wanted = (event: Event) =>
        !filter ||
        (event.target instanceof Element && event.target.matches(filter));
      root.addEventListener("transitionrun", (event) => {
        if (!wanted(event)) return;
        const { propertyName, pseudoElement, target } =
          event as TransitionEvent;
        seen.push(`${propertyName}${pseudoElement}`);
        if (propertyName !== "translate" || pseudoElement) return;
        const transition = (target as Element)
          .getAnimations()
          .find(
            (found) =>
              found instanceof CSSTransition &&
              found.transitionProperty === "translate",
          );
        const start = (
          transition?.effect as KeyframeEffect | null
        )?.getKeyframes()[0]?.translate;
        // "none"、"4px"、"0px -4px" 都见得到：没写的那一个方向是 0
        const [x = 0, y = 0] = String(start)
          .split(" ")
          .map((part) => Number.parseFloat(part) || 0);
        from.push([x, y]);
      });
      root.addEventListener("animationstart", (event) => {
        if (!wanted(event)) return;
        const { animationName, pseudoElement } = event as AnimationEvent;
        seen.push(`${animationName}${pseudoElement}`);
      });
    },
    selector,
    only ?? null,
  );

/** 读出记到的，并清空 */
const recorded = (page: Page) =>
  page.evaluate(() => (window as unknown as MotionLog).motionLog.splice(0));

/** 读出记到的位移各自的起点 [x, y]（像素），并清空 */
const startedFrom = (page: Page) =>
  page.evaluate(() => (window as unknown as MotionLog).motionFrom.splice(0));

/** 这个元素现在偏了多少 [x, y]；没有位移是 [0, 0] */
const shift = (page: Page, selector: string) =>
  page.evaluate((css) => {
    const [x = 0, y = 0] = getComputedStyle(document.querySelector(css)!)
      .translate.split(" ")
      .map((part) => Number.parseFloat(part) || 0);
    return [x, y];
  }, selector);

/**
 * "入场动画"的 story：把整页推到视口下面，再点"重播"。
 * 新挂上的那一份一开始不在视口里——进视口才播的东西这时候应该停在起点
 */
const replayOffscreen = (page: Page) =>
  page.evaluate(() => {
    document.querySelector<HTMLElement>("#storybook-root")!.style.paddingTop =
      "200vh";
    scrollTo(0, 0);
    [...document.querySelectorAll("button")]
      .find((button) => button.textContent === "重播")!
      .click();
  });

const scrollIntoView = (page: Page, selector: string) =>
  page.evaluate((css) => {
    document.querySelector(css)!.scrollIntoView({ block: "center" });
  }, selector);

/** 关掉"减少动态效果"跑一段；跑完不管成没成都开回去 */
async function withMotion(page: Page, run: () => Promise<void>) {
  await page.setReducedMotion(false);
  try {
    await run();
  } finally {
    await page.setReducedMotion(true);
  }
}

async function assertAnimatesInAndOut(
  page: Page,
  open: () => Promise<void>,
  selector: string,
  name: string,
) {
  await open();
  await page.waitFor(
    async () => ((await running(page, selector)) ?? 0) > 0,
    `${name}进场没有过渡`,
    2000,
  );
  await page.settled(selector, `${name}的进场过渡没有走完`);
  assert.equal(await opacity(page, selector), 1, `${name}没有停在不透明`);

  await page.key("Escape");
  await page.waitFor(
    async () => (await running(page, selector)) === null,
    `${name}关闭后没有被卸载`,
  );
}

test("弹窗、抽屉、下拉菜单：有进场过渡，关闭后卸载", async () => {
  const { page } = storybook;
  await page.setReducedMotion(false);
  try {
    await page.story("控件-dialog-弹窗--playground");
    await assertAnimatesInAndOut(
      page,
      () => page.click("text=归档"),
      "[role=dialog]",
      "弹窗",
    );

    await page.story("控件-drawer-抽屉--playground");
    await assertAnimatesInAndOut(
      page,
      () => page.click("text=查看详情"),
      "[role=dialog]",
      "抽屉",
    );

    await page.story("控件-dropdownmenu-下拉菜单--playground");
    await assertAnimatesInAndOut(
      page,
      () => page.click("text=更多操作"),
      "[role=menu]",
      "下拉菜单",
    );
  } finally {
    await page.setReducedMotion(true);
  }
});

test("减少动态效果：弹窗直接出现", async () => {
  const { page } = storybook;
  await page.story("控件-dialog-弹窗--playground");
  await page.click("text=归档");
  await page.waitVisible("[role=dialog]");
  const seconds = await page.evaluate(() =>
    Math.max(
      ...getComputedStyle(document.querySelector("[role=dialog]")!)
        .transitionDuration.split(",")
        .map((value) => Number.parseFloat(value)),
    ),
  );
  assert.ok(seconds < 0.001, `过渡时长应该接近零，实际是 ${seconds}s`);
});

test("等动效走完（page.settled）：之后读一次就是终态；循环的动画不会让它挂住", async () => {
  const { page } = storybook;
  await page.setReducedMotion(false);
  try {
    await page.story("控件-dialog-弹窗--playground");
    await page.click("text=归档");
    await page.waitVisible("[role=dialog]");
    await page.settled("[role=dialog]");
    // 不轮询：过渡走完了，读到的就是终点
    assert.equal(await opacity(page, "[role=dialog]"), 1);
    assert.equal(await running(page, "[role=dialog]"), 0);
    await page.key("Escape");
    await page.waitGone("[role=dialog]");

    // 加载指示一直在转。它在页面上，settled 也照样回来
    await page.story("控件-spinner-行内加载指示--playground");
    const spinning = await page.evaluate(
      () =>
        document
          .getAnimations()
          .filter(
            (animation) =>
              animation.effect?.getComputedTiming().iterations === Infinity,
          ).length,
    );
    assert.ok(spinning > 0, "这个 story 里应该有一个循环的动画在跑");
    const started = Date.now();
    await page.settled();
    assert.ok(
      Date.now() - started < 2000,
      "循环的动画不该让 settled 一直等下去",
    );
  } finally {
    await page.setReducedMotion(true);
  }
});

test("复选与单选：记号淡入淡出（200ms），走完停在终态", async () => {
  const { page } = storybook;
  // 第一个复选框是没选的；勾紧跟在 <input> 后面
  const ROW = "#storybook-root label:first-of-type";
  const MARK = `${ROW} input + svg`;
  /** 写着这几个字的那一行里，记号的不透明度 */
  const markOf = (text: string) =>
    page.evaluate((label) => {
      const row = [...document.querySelectorAll("#storybook-root label")].find(
        (element) => element.textContent === label,
      )!;
      return Number(getComputedStyle(row.querySelector("input + *")!).opacity);
    }, text);

  await withMotion(page, async () => {
    await page.story("控件-choice-选择控件--checkbox-states");
    assert.deepEqual(await transitions(page, MARK), { opacity: 0.2 });
    assert.equal(await opacity(page, MARK), 0);

    await record(page, MARK);
    await page.click(ROW);
    await page.settled(ROW);
    assert.equal(await opacity(page, MARK), 1, "勾选之后勾应该是不透明的");
    assert.deepEqual(await recorded(page), ["opacity"], "勾应该是过渡出来的");

    await page.click(ROW);
    await page.settled(ROW);
    assert.equal(await opacity(page, MARK), 0, "取消之后勾应该淡出");
    assert.deepEqual(await recorded(page), ["opacity"]);

    // 单选：换一项，新的圆点亮起来，旧的熄掉
    await page.story("控件-choice-选择控件--radio-states");
    assert.deepEqual([await markOf("草图"), await markOf("标准")], [0, 1]);
    await page.click("text=草图");
    await page.settled();
    assert.deepEqual([await markOf("草图"), await markOf("标准")], [1, 0]);
  });

  // 开回"减少动态效果"：还是那个过渡，时长被压到接近零
  const reduced = await transitions(page, "#storybook-root input + span");
  assert.ok(reduced!.opacity! < 0.001, "减少动态效果下记号不该有看得见的过渡");
});

test("滑块：按键跳值时滑过去；拖动时位置贴着指针，没有过渡", async () => {
  const { page } = storybook;
  const THUMB = "#storybook-root [data-index]";
  const box = (selector: string) =>
    page.evaluate((css) => {
      const rect = document.querySelector(css)!.getBoundingClientRect();
      return {
        left: rect.left,
        right: rect.right,
        width: rect.width,
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
    }, selector);
  /** 记到的里面和位置有关的（逻辑属性在事件里可能报成物理的那个） */
  const moves = async () =>
    (await recorded(page)).filter(
      (name) => name === "left" || name === "inset-inline-start",
    );

  await withMotion(page, async () => {
    await page.story("控件-slider-滑块--playground");
    assert.deepEqual(await transitions(page, THUMB), {
      "inset-inline-start": 0.2,
    });
    // 滑块头的父元素就是轨道
    const track = await page.evaluate((css) => {
      const rect = document
        .querySelector(css)!
        .parentElement!.getBoundingClientRect();
      return { left: rect.left, right: rect.right, width: rect.width };
    }, THUMB);

    await page.key("Tab");
    await page.waitFocused("input:音量");
    await record(page, THUMB);
    await page.key("End");
    await page.settled(THUMB);
    assert.ok(
      Math.abs((await box(THUMB)).x - track.right) < 1,
      "End 之后滑块的中心应该在轨道右端",
    );
    assert.equal((await moves()).length, 1, "按键跳值应该是滑过去的");

    // 按住滑块往左拖到轨道正中，不松手
    const from = await box(THUMB);
    const middle = track.left + track.width / 2;
    const held = { button: "left", buttons: 1 };
    await page.send("Input.dispatchMouseEvent", {
      type: "mouseMoved",
      x: from.x,
      y: from.y,
    });
    await page.send("Input.dispatchMouseEvent", {
      type: "mousePressed",
      x: from.x,
      y: from.y,
      ...held,
      clickCount: 1,
    });
    try {
      for (let step = 1; step <= 6; step += 1) {
        await page.send("Input.dispatchMouseEvent", {
          type: "mouseMoved",
          x: from.x + ((middle - from.x) * step) / 6,
          y: from.y,
          ...held,
        });
      }
      await page.frames();
      assert.deepEqual(
        Object.keys((await transitions(page, THUMB))!),
        ["none"],
        "拖动中位置不该有过渡",
      );
      // 一步是轨道的百分之一：滑块落在离指针最近的那一步上
      assert.ok(
        Math.abs((await box(THUMB)).x - middle) <= track.width / 100,
        "拖动中滑块应该贴着指针，不是在后面追",
      );
      assert.deepEqual(await moves(), [], "拖动中不该跑过位置的过渡");
    } finally {
      await page.send("Input.dispatchMouseEvent", {
        type: "mouseReleased",
        x: middle,
        y: from.y,
        button: "left",
        clickCount: 1,
      });
    }
  });
});

test("步骤条：走完一步，连线的墨色从起点充到头；往回走收回去", async () => {
  const { page } = storybook;
  const LIST = "#storybook-root ol";
  /** 每一步通向下一步的那条线：墨色充了几成（1 是满的，0 是空的），以及墨色那一层是不是墨色 */
  const lines = () =>
    page.evaluate((css) => {
      const probe = document.createElement("i");
      probe.style.color = "var(--ef-ink)";
      document.querySelector(css)!.append(probe);
      const ink = getComputedStyle(probe).color;
      probe.remove();
      return [...document.querySelectorAll(`${css} > li`)].map((item) => {
        const line = item.querySelector(
          "[aria-hidden=true] > span:last-child",
        )!;
        const style = getComputedStyle(line, "::before");
        const scale =
          style.scale === "none" ? [1] : style.scale.split(" ").map(Number);
        return {
          filled: Math.min(...scale),
          ink: style.backgroundColor === ink,
          origin: style.transformOrigin,
        };
      });
    }, LIST);

  await withMotion(page, async () => {
    await page.story("控件-steps-步骤条--clickable");
    const line = `${LIST} > li:nth-child(3) [aria-hidden=true] > span:last-child`;
    assert.deepEqual(await transitions(page, line, "::before"), { scale: 0.3 });

    // 一开始在第三步：前两条线是满的，第三条是空的
    const before = await lines();
    assert.deepEqual(
      before.map((found) => found.filled),
      [1, 1, 0, 0],
    );
    assert.ok(
      before.every((found) => found.ink && found.origin === "0px 0px"),
      "墨色那一层应该是墨色的，从左上角放大",
    );

    await record(page, LIST);
    await page.click("text=下一步");
    await page.settled(LIST);
    assert.deepEqual(
      (await lines()).map((found) => found.filled),
      [1, 1, 1, 0],
      "走到第四步，第三条线应该充满",
    );
    assert.ok(
      (await recorded(page)).includes("scale::before"),
      "线应该是充进去的，不是直接换色",
    );

    await page.click("text=上一步");
    await page.settled(LIST);
    assert.deepEqual(
      (await lines()).map((found) => found.filled),
      [1, 1, 0, 0],
      "退回第三步，第三条线应该收回去",
    );
  });
});

test("角括号：选中时八段短线从角上伸出来，不往外多占地方；取景角不动", async () => {
  const { page } = storybook;
  await withMotion(page, async () => {
    await page.story("控件-itemslot-物品格--selectable");
    await record(page, "#storybook-root");
    // 点一个原来没选的：选中的换成它
    await page.click("#storybook-root button[aria-pressed=false]");
    await page.waitVisible("#storybook-root [data-selected]");
    await page.settled("#storybook-root");
    assert.ok(
      (await recorded(page)).includes("ef-bracket-in::after"),
      "括号应该是伸出来的，不是直接出现",
    );

    // 动画走完还留着（它带 fill）：拨回起点和终点各看一眼
    const frames = await page.evaluate(() => {
      const host = document.querySelector("#storybook-root [data-selected]")!;
      const animation = host
        .getAnimations({ subtree: true })
        .find(
          (found) => (found as CSSAnimation).animationName === "ef-bracket-in",
        )!;
      const read = () => {
        const style = getComputedStyle(host, "::after");
        return {
          // 八层里的头两层：左上角的一横一竖
          arms: style.backgroundSize
            .split(",")
            .slice(0, 2)
            .map((value) => value.trim()),
          box: [style.top, style.right, style.bottom, style.left].join(" "),
        };
      };
      animation.pause();
      animation.currentTime = 0;
      const start = read();
      animation.finish();
      return { start, end: read() };
    });
    assert.deepEqual(frames, {
      // 起点两段都是 0 长；括号的盒子从头到尾在宿主之外 4px，没有再往外
      start: { arms: ["0px 2px", "2px 0px"], box: "-4px -4px -4px -4px" },
      end: { arms: ["12px 2px", "2px 12px"], box: "-4px -4px -4px -4px" },
    });

    // 取景角用的是同一个工具类，但它是静态的装饰：不带这个动画
    await page.story("母题-viewfinder-取景角--playground");
    const viewfinder = await page.evaluate(() => {
      const brackets = document.querySelector(
        "#storybook-root .corner-brackets",
      );
      return brackets && getComputedStyle(brackets, "::after").animationName;
    });
    assert.equal(viewfinder, "none");
  });
});

test("验证码输入：填上的那一位从透明淡入到墨色", async () => {
  const { page } = storybook;
  const FIRST = "#storybook-root [role=group] input:not([aria-hidden])";
  const look = () =>
    page.evaluate((css) => {
      const probe = document.createElement("i");
      probe.style.color = "var(--ef-ink)";
      document.querySelector("#storybook-root")!.append(probe);
      const ink = getComputedStyle(probe).color;
      probe.remove();
      const slot = document.querySelector(css)!;
      return {
        filled: slot.hasAttribute("data-filled"),
        color: getComputedStyle(slot).color,
        ink,
      };
    }, FIRST);

  await withMotion(page, async () => {
    await page.story("控件-otpinput-验证码输入--playground");
    assert.equal((await transitions(page, FIRST))!.color, 0.2);
    const empty = await look();
    assert.equal(empty.filled, false);
    assert.equal(empty.color, "rgba(0, 0, 0, 0)", "空格的字色应该是透明的");

    await page.click(FIRST);
    await page.waitFocused(/^input:/);
    await page.settled(FIRST);
    await record(page, FIRST);
    await page.type("2");
    await page.settled(FIRST);
    const filled = await look();
    assert.equal(filled.filled, true);
    assert.equal(filled.color, filled.ink, "填上之后字色应该是墨色");
    assert.ok(
      (await recorded(page)).includes("color"),
      "字应该是淡入的，不是直接出现",
    );
  });
});

test("菜单面板一族：从触发处那一侧来（4px），走完归位；退场只淡出", async () => {
  const { page } = storybook;
  const MENU = "[role=menu]";
  const CARD = "[data-hover-card]";
  const open = (selector: string) =>
    page.evaluate(
      (css) =>
        [...document.querySelectorAll(css)].filter(
          (panel) => panel.getBoundingClientRect().height > 0,
        ).length,
      selector,
    );

  await withMotion(page, async () => {
    // 下拉菜单在按钮下方：从上面（按钮那一侧）来
    await page.story("控件-dropdownmenu-下拉菜单--view-options");
    await record(page, "body", MENU);
    await page.click("button[aria-haspopup]");
    await page.waitVisible(MENU);
    await page.settled(MENU);
    // 透明度和位移各走各的时长：200ms 淡入，300ms 归位（和顶上那条强调条同一拍）。
    // 走完了再读：基元在进场的第一帧往面板上写内联的 transition: none，读早了读到的是它
    assert.deepEqual(await transitions(page, MENU), {
      opacity: 0.2,
      translate: 0.3,
    });
    assert.deepEqual(await startedFrom(page), [[0, -4]]);
    assert.deepEqual(await shift(page, MENU), [0, 0], "走完应该归位");
    const entering = await recorded(page);
    assert.ok(
      entering.includes("opacity") && entering.includes("translate"),
      `进场应该既淡入又挪过来，实际跑的是 ${entering.join("、")}`,
    );

    // 子菜单在这一行的右边：从左边（这一行那一侧）来
    await page.moveTo("text=导出为");
    await page.waitFor(async () => (await open(MENU)) === 2, "子菜单没有打开");
    await page.settled();
    assert.deepEqual(await startedFrom(page), [[-4, 0]]);
    await recorded(page);

    // Esc 一次收一层：先是子菜单，再是主菜单
    await page.key("Escape");
    await page.waitFor(async () => (await open(MENU)) < 2, "子菜单没有收起");
    if ((await open(MENU)) > 0) await page.key("Escape");
    await page.waitGone(MENU);
    const leaving = await recorded(page);
    assert.ok(leaving.includes("opacity"), "退场应该淡出");
    assert.ok(!leaving.includes("translate"), "退场不该再走位移");

    // 悬浮卡用的是同一块面板：四个方向各从自己的那一侧来
    await page.story("控件-hovercard-悬浮卡--sides");
    await record(page, "body", CARD);
    const expected = {
      top: [0, 4],
      bottom: [0, -4],
      left: [4, 0],
      right: [-4, 0],
    };
    for (const [index, side] of Object.keys(expected).entries()) {
      const point = await page.evaluate((nth) => {
        const rect = document
          .querySelectorAll("#storybook-root a")
          [nth]!.getBoundingClientRect();
        return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      }, index);
      await page.moveTo(point);
      await page.waitFor(async () => (await open(CARD)) === 1, `${side}：没开`);
      await page.settled(CARD);
      assert.deepEqual(
        await startedFrom(page),
        [expected[side as keyof typeof expected]],
        `${side}：卡片应该从链接那一侧来`,
      );
      await page.moveTo({ x: 5, y: 5 });
      await page.waitFor(async () => (await open(CARD)) === 0, `${side}：没关`);
    }

    // 下拉选择是另一个基元，面板是同一块（列表在面板里面，面板自己带着 data-variant）
    await page.story("控件-select-下拉选择--playground");
    await record(page, "body", "[data-variant]");
    await page.click("#storybook-root [role=combobox]");
    await page.waitVisible("[role=listbox]");
    await page.settled();
    assert.deepEqual(await startedFrom(page), [[0, -4]]);
    await page.key("Escape");
    await page.waitGone("[role=listbox]");
  });

  // 开回"减少动态效果"：位移还在声明里，时长被压到接近零——不会停在偏着 4px 的地方
  await page.story("控件-dropdownmenu-下拉菜单--view-options");
  await page.click("button[aria-haspopup]");
  await page.waitVisible(MENU);
  await page.settled(MENU);
  assert.deepEqual(await shift(page, MENU), [0, 0]);
  const reduced = await transitions(page, MENU);
  assert.ok(reduced!.translate! < 0.001 && reduced!.opacity! < 0.001);
});

test("文字提示：悬停出来的从按钮那一侧来（4px，200ms）；移到相邻的按钮是换过去的，不过渡", async () => {
  const { page } = storybook;
  // 定位层是 presentation，小三角对读屏隐藏，剩下带 data-side 的就是提示本身
  const TIP =
    "[data-side][data-open]:not([role=presentation]):not([aria-hidden])";
  const showing = () =>
    page.evaluate(
      (css) =>
        [...document.querySelectorAll(css)].map((tip) =>
          (tip.textContent ?? "").trim(),
        ),
      TIP,
    );

  await withMotion(page, async () => {
    await page.story("控件-tooltip-文字提示--toolbar");
    await record(page, "body", TIP);
    await page.moveTo("text=上一条");
    await page.waitFor(
      async () => (await showing()).includes("上一条"),
      "提示没有出现",
    );
    await page.settled(TIP);
    assert.deepEqual(await transitions(page, TIP), {
      opacity: 0.2,
      translate: 0.2,
    });
    // 提示在按钮上方：从下面（按钮那一侧）来
    assert.deepEqual(await startedFrom(page), [[0, 4]]);
    assert.deepEqual(await shift(page, TIP), [0, 0], "走完应该归位");
    await recorded(page);

    await page.moveTo("text=下一条");
    await page.waitFor(
      async () => (await showing()).includes("下一条"),
      "相邻的提示没有出现",
    );
    await page.settled();
    assert.deepEqual(
      (await recorded(page)).filter((name) => name === "translate"),
      [],
      "从相邻的提示移过来不该再走一遍位移",
    );
    assert.deepEqual(await startedFrom(page), []);
  });
});

test("轻提示：底部的从下面升上来（8px）；正中的只淡入；没划够松手滑回原位", async () => {
  const { page } = storybook;
  const TOAST = "[role=region] :is([role=dialog], [role=alertdialog])";
  const shown = (text: string) =>
    page.waitFor(
      () =>
        page.evaluate(
          ({ css, wanted }) =>
            [...document.querySelectorAll(css)].some(
              (toast) => toast.querySelector("p")?.textContent === wanted,
            ),
          { css: TOAST, wanted: text },
        ),
      `轻提示"${text}"没有出现`,
    );

  await withMotion(page, async () => {
    await page.story("控件-toast-轻提示--playground");
    await record(page, "body", TOAST);
    await page.click("text=一直留着");
    await shown("连接已断开");
    await page.settled(TOAST);
    assert.deepEqual(await transitions(page, TOAST), {
      opacity: 0.2,
      translate: 0.3,
      transform: 0.2,
    });
    assert.deepEqual(await startedFrom(page), [[0, 8]]);
    assert.deepEqual(await shift(page, TOAST), [0, 0], "走完应该归位");
    await recorded(page);

    // 抓着文字往右拖一小段：拖动中基元把过渡整个关掉；松手之后才滑回去
    const grab = await page.evaluate((css) => {
      const rect = document.querySelector(`${css} p`)!.getBoundingClientRect();
      return { x: rect.left + 8, y: rect.top + rect.height / 2 };
    }, TOAST);
    const left = () =>
      page.evaluate(
        (css) => document.querySelector(css)!.getBoundingClientRect().left,
        TOAST,
      );
    const rest = await left();
    const held = { button: "left", buttons: 1 };
    await page.send("Input.dispatchMouseEvent", {
      type: "mouseMoved",
      ...grab,
    });
    await page.send("Input.dispatchMouseEvent", {
      type: "mousePressed",
      ...grab,
      ...held,
      clickCount: 1,
    });
    for (const dx of [4, 14, 24]) {
      await page.send("Input.dispatchMouseEvent", {
        type: "mouseMoved",
        x: grab.x + dx,
        y: grab.y,
        ...held,
      });
    }
    await page.frames();
    assert.deepEqual(
      Object.keys((await transitions(page, TOAST))!),
      ["none"],
      "拖动中不该有过渡",
    );
    assert.deepEqual(await recorded(page), [], "拖动中不该跑过任何过渡");
    await page.send("Input.dispatchMouseEvent", {
      type: "mouseReleased",
      x: grab.x + 24,
      y: grab.y,
      button: "left",
      clickCount: 1,
    });
    await page.waitFor(
      async () => (await recorded(page)).includes("transform"),
      "没划够就松手，应该是滑回去的",
    );
    await page.settled(TOAST);
    assert.ok(Math.abs((await left()) - rest) < 1, "应该回到原位");

    // 正中的那一种是官网的做法：只有透明度
    await page.story("控件-toast-轻提示--centered");
    await record(page, "body", TOAST);
    await page.click("text=一直留着");
    await shown("连接已断开");
    await page.settled(TOAST);
    assert.deepEqual(await startedFrom(page), []);
    assert.deepEqual(await recorded(page), ["opacity"]);
  });
});

test("全屏菜单：栏目逐条从左滑入（8px），延迟按第几项错开，第六项起一起到；减少动态效果下不等", async () => {
  const { page } = storybook;
  const DIALOG = "[role=dialog]";
  const ITEM = `${DIALOG} nav li`;
  const items = () =>
    page.evaluate(
      (css) =>
        [...document.querySelectorAll(css)].map((item) => {
          const style = getComputedStyle(item);
          return {
            name: style.animationName,
            delay: Number.parseFloat(style.animationDelay),
            opacity: Number(style.opacity),
            shifted: style.translate !== "none" && style.translate !== "0px",
          };
        }),
      ITEM,
    );

  await withMotion(page, async () => {
    await page.story("控件-topbar-顶栏与全屏菜单--with-menu");
    await record(page, "body", ITEM);
    await page.click("button[aria-label=打开菜单]");
    await page.waitVisible(DIALOG);
    // 入场不挡操作：栏目还在路上，焦点已经在第一项上了
    await page.waitFocused("a:总览");

    const entering = await items();
    assert.deepEqual(
      entering.map((item) => item.name),
      Array.from({ length: 5 }, () => "ef-shift-in"),
    );
    assert.deepEqual(
      entering.map((item) => item.delay),
      [0.1, 0.15, 0.2, 0.25, 0.3],
    );

    await page.settled(DIALOG);
    assert.equal(
      (await recorded(page)).filter((name) => name === "ef-shift-in").length,
      5,
      "五个栏目应该各播了一次",
    );
    assert.ok(
      (await items()).every((item) => item.opacity === 1 && !item.shifted),
      "走完应该都不透明、都在原位",
    );

    // 动画带 fill，走完还留着：把第一项拨回起点看一眼它是从哪来的
    const start = await page.evaluate((css) => {
      const item = document.querySelector(css)!;
      const [animation] = item.getAnimations();
      animation!.pause();
      animation!.currentTime = 0;
      const style = getComputedStyle(item);
      const from = { opacity: style.opacity, translate: style.translate };
      animation!.finish();
      return from;
    }, ITEM);
    assert.equal(start.opacity, "0");
    assert.equal(Number.parseFloat(start.translate), -8, "应该从左边 8px 来");

    // 这个 story 只有五项：再塞三项进去，第六项起的延迟不再往后排
    const tail = await page.evaluate((css) => {
      const list = document.querySelector(css)!.parentElement!;
      for (let extra = 0; extra < 3; extra += 1) {
        list.append(list.lastElementChild!.cloneNode(true));
      }
      return [...list.children]
        .slice(5)
        .map((item) =>
          Number.parseFloat(getComputedStyle(item).animationDelay),
        );
    }, ITEM);
    assert.deepEqual(tail, [0.35, 0.35, 0.35]);
  });

  // 开回"减少动态效果"：延迟归零——不然栏目会一条一条蹦出来
  await page.story("控件-topbar-顶栏与全屏菜单--with-menu");
  await page.click("button[aria-label=打开菜单]");
  await page.waitVisible(DIALOG);
  const reduced = await items();
  assert.ok(reduced.every((item) => item.delay === 0));
  await page.settled(DIALOG);
  assert.ok(
    (await items()).every((item) => item.opacity === 1 && !item.shifted),
  );
});

test("图片查看：整层淡入完了取景角才落位；大图取到了才露出来", async () => {
  const { page } = storybook;
  const LAYER = "[data-image-viewer]";
  const BRACKETS = `${LAYER} .corner-brackets`;

  await withMotion(page, async () => {
    await page.story("控件-imageviewer-图片查看--playground");
    await record(page, "body", `${BRACKETS}, ${LAYER} img`);
    await page.click("#storybook-root button[aria-haspopup=dialog]");
    await page.waitVisible(LAYER);

    const brackets = await page.evaluate((css) => {
      const style = getComputedStyle(document.querySelector(css)!, "::after");
      return {
        name: style.animationName,
        // 等整层的淡入（200ms）走完再动：一起动的话被淡入盖住
        delay: style.animationDelay,
        duration: style.animationDuration,
      };
    }, BRACKETS);
    assert.deepEqual(brackets, {
      name: "ef-bracket-in",
      delay: "0.2s",
      duration: "0.2s",
    });

    // 当前这张取到了：容器标上 data-loaded，图才不透明
    await page.waitVisible(`${LAYER} [data-current][data-loaded]`);
    await page.settled(LAYER);
    assert.ok(
      (await recorded(page)).includes("ef-bracket-in::after"),
      "取景角应该是伸出来的",
    );
    const image = await page.evaluate((css) => {
      const style = getComputedStyle(
        document.querySelector(`${css} [data-current] > img`)!,
      );
      return {
        opacity: style.opacity,
        property: style.transitionProperty,
        duration: style.transitionDuration,
      };
    }, LAYER);
    assert.deepEqual(image, {
      opacity: "1",
      property: "opacity",
      duration: "0.2s",
    });

    // 还没取到的图是透明的：往旁边那一张里换一张取不到头的图，它的容器是新的状态
    const pending = await page.evaluate((css) => {
      const slides = [...document.querySelectorAll(`${css} [role=group]`)];
      const empty = slides.find((slide) => slide.childElementCount === 0);
      if (!empty) return null;
      const img = document.createElement("img");
      img.src = "/never-arrives.png?" + Date.now();
      empty.append(img);
      return {
        loaded: empty.hasAttribute("data-loaded"),
        opacity: getComputedStyle(img).opacity,
      };
    }, LAYER);
    // 五张图里离当前最远的那几张是空位（只渲染当前和左右各一张）
    assert.deepEqual(pending, { loaded: false, opacity: "0" });

    await page.key("Escape");
    await page.waitGone(LAYER);
  });
});

test("弹窗：从下面升上来（8px）并淡入，不放大；退场只淡出。确认弹窗一样", async () => {
  const { page } = storybook;

  await withMotion(page, async () => {
    for (const [story, trigger, role] of [
      ["控件-dialog-弹窗--playground", "text=归档", "dialog"],
      [
        "控件-dialog-弹窗--danger-confirm",
        "#storybook-root button",
        "alertdialog",
      ],
    ] as const) {
      const PANEL = `[role=${role}]`;
      await page.story(story);
      await record(page, "body", PANEL);
      await page.click(trigger);
      await page.waitVisible(PANEL);
      await page.settled(PANEL);
      assert.deepEqual(
        await transitions(page, PANEL),
        { opacity: 0.2, translate: 0.3 },
        `${role}：淡入 200ms，位移 300ms`,
      );
      assert.deepEqual(await startedFrom(page), [[0, 8]], `${role}：从下面来`);
      assert.deepEqual(await shift(page, PANEL), [0, 0], "走完应该归位");
      const entering = await recorded(page);
      assert.ok(
        !entering.includes("scale") && !entering.includes("transform"),
        "不该再有放大",
      );

      await page.key("Escape");
      await page.waitGone(PANEL);
      const leaving = await recorded(page);
      assert.ok(leaving.includes("opacity"), "退场应该淡出");
      assert.ok(!leaving.includes("translate"), "退场不该再走位移");
    }
  });
});

test("完成横幅：进视口才播——色带从左擦入，字和按钮晚 200ms 出；滚走再回来不重播", async () => {
  const { page } = storybook;
  const STORY = "控件-completionbanner-完成横幅--entrance";
  const BANNER = "#storybook-root [role=status]";
  const CLIPPED = "inset(0px 100% 0px 0px)";
  const parts = (rewind = false) =>
    page.evaluate(
      (css, toStart) => {
        const banner = document.querySelector(css)!;
        // 动画带 fill，走完还留着：拨回起点读一眼它是从哪来的，再放回终点
        const animations = banner.getAnimations({ subtree: true });
        if (toStart) {
          for (const animation of animations) {
            animation.pause();
            animation.currentTime = 0;
          }
        }
        const read = (element: Element) => {
          const style = getComputedStyle(element);
          return {
            name: style.animationName,
            delay: style.animationDelay,
            duration: style.animationDuration,
            clip: style.clipPath,
            opacity: style.opacity,
            shift: Number.parseFloat(style.translate) || 0,
          };
        };
        const found = {
          banner: read(banner),
          text: read(banner.querySelector("h3")!.parentElement!),
          action: read(banner.querySelector("button")!.parentElement!),
        };
        if (toStart) for (const animation of animations) animation.finish();
        return found;
      },
      BANNER,
      rewind,
    );

  await withMotion(page, async () => {
    await page.story(STORY);
    await replayOffscreen(page);
    // 反面的断言：等上一会儿，它仍然没有开始
    await page.pause(300);
    const waiting = await parts();
    assert.equal(waiting.banner.name, "none", "没进视口不应该开始播");
    assert.equal(waiting.banner.clip, CLIPPED, "没进视口时整块是裁掉的");

    await record(page, "body");
    await scrollIntoView(page, BANNER);
    await page.waitFor(
      async () => (await parts()).banner.name === "ef-wipe-in",
      "滚进视口之后色带应该开始擦入",
    );
    const playing = await parts();
    assert.deepEqual(
      [playing.banner.delay, playing.banner.duration],
      ["0s", "0.3s"],
    );
    assert.deepEqual(
      [playing.text.name, playing.text.delay, playing.text.duration],
      ["ef-shift-in", "0.2s", "0.3s"],
      "标题那一组等色带过去了再出",
    );
    assert.deepEqual(
      [playing.action.name, playing.action.delay],
      ["ef-fade-in", "0.2s"],
    );

    await page.settled(BANNER);
    const seen = await recorded(page);
    for (const name of ["ef-wipe-in", "ef-shift-in", "ef-fade-in"]) {
      assert.ok(
        seen.includes(name),
        `应该播过 ${name}（记到的：${seen.join("、")}）`,
      );
    }
    const done = await parts();
    assert.equal(done.banner.clip, "inset(0px 0% 0px 0px)", "走完整块都在");
    assert.deepEqual(
      [done.text.opacity, done.text.shift, done.action.opacity],
      ["1", 0, "1"],
    );

    const start = await parts(true);
    assert.equal(start.banner.clip, CLIPPED, "色带应该从左边擦过来");
    assert.deepEqual(
      [start.text.opacity, start.text.shift, start.action.opacity],
      ["0", -8, "0"],
      "标题那一组从左边 8px 淡入，按钮只淡入",
    );
    assert.equal(start.action.shift, 0, "能点的东西不做位移");

    // 滚走再滚回来：只播一次
    await recorded(page);
    await page.evaluate(() => scrollTo(0, 0));
    await page.frames(4);
    await scrollIntoView(page, BANNER);
    await page.frames(4);
    assert.deepEqual(await recorded(page), [], "滚回来不应该重播");
  });

  // 开回"减少动态效果"：直接是终态，不停在裁掉或者透明
  await page.story(STORY);
  await page.settled(BANNER);
  const reduced = await parts();
  assert.equal(reduced.banner.clip, "inset(0px 0% 0px 0px)");
  assert.deepEqual([reduced.text.opacity, reduced.action.opacity], ["1", "1"]);
});

test("方括号标题：进视口才播——括号先淡入，名称晚 100ms；只淡入不位移", async () => {
  const { page } = storybook;
  const STORY = "控件-brackettitle-方括号标题--entrance";
  const HEADING = "#storybook-root h3";
  const parts = (rewind = false) =>
    page.evaluate(
      (css, toStart) => {
        const heading = document.querySelector(css)!;
        const animations = heading.getAnimations({ subtree: true });
        if (toStart) {
          for (const animation of animations) {
            animation.pause();
            animation.currentTime = 0;
          }
        }
        const found = [...heading.children].map((part) => {
          const style = getComputedStyle(part);
          return {
            name: style.animationName,
            delay: style.animationDelay,
            opacity: style.opacity,
            translate: style.translate,
          };
        });
        if (toStart) for (const animation of animations) animation.finish();
        return found;
      },
      HEADING,
      rewind,
    );
  const each = async (key: "name" | "delay" | "opacity" | "translate") =>
    (await parts()).map((part) => part[key]);

  await withMotion(page, async () => {
    await page.story(STORY);
    await replayOffscreen(page);
    await page.pause(300);
    assert.deepEqual(await each("name"), ["none", "none", "none"]);
    assert.deepEqual(await each("opacity"), ["0", "0", "0"], "没进视口时透明");

    await record(page, "body");
    await scrollIntoView(page, HEADING);
    await page.waitFor(
      async () => (await each("name"))[0] === "ef-fade-in",
      "滚进视口之后应该开始淡入",
    );
    // 左括号、名称、右括号
    assert.deepEqual(await each("delay"), ["0s", "0.1s", "0s"]);

    await page.settled(HEADING);
    assert.deepEqual(await recorded(page), [
      "ef-fade-in",
      "ef-fade-in",
      "ef-fade-in",
    ]);
    assert.deepEqual(await each("opacity"), ["1", "1", "1"]);
    const start = await parts(true);
    assert.deepEqual(
      start.map((part) => [part.opacity, part.translate]),
      Array.from({ length: 3 }, () => ["0", "none"]),
      "从透明淡入，不位移",
    );

    await page.evaluate(() => scrollTo(0, 0));
    await page.frames(4);
    await scrollIntoView(page, HEADING);
    await page.frames(4);
    assert.deepEqual(await recorded(page), [], "滚回来不应该重播");
  });

  await page.story(STORY);
  await page.settled(HEADING);
  assert.deepEqual(await each("opacity"), ["1", "1", "1"]);
});

test("页头：挂上就播——微文字行、标题、说明依次从左淡入归位；能点的不动；吸顶的不播", async () => {
  const { page } = storybook;
  const STORY = "控件-pageheader-页头--entrance";
  const HEADER = "#storybook-root header";
  const parts = (rewind = false) =>
    page.evaluate(
      (css, toStart) => {
        const header = document.querySelector(css)!;
        const animations = header.getAnimations({ subtree: true });
        if (toStart) {
          for (const animation of animations) {
            animation.pause();
            animation.currentTime = 0;
          }
        }
        const read = (element: Element | null | undefined) => {
          if (!element) return null;
          const style = getComputedStyle(element);
          return {
            name: style.animationName,
            delay: style.animationDelay,
            opacity: style.opacity,
            shift: Number.parseFloat(style.translate) || 0,
          };
        };
        const heading = header.querySelector("h1")!;
        const found = {
          // 微文字行、标题、说明
          lines: [
            read(header.querySelector("p")),
            read(heading),
            read(heading.nextElementSibling),
          ],
          back: read(
            header.querySelector("[data-page-header-back]")?.parentElement,
          ),
          actions: read(header.querySelector("[data-actions]")),
        };
        if (toStart) for (const animation of animations) animation.finish();
        return found;
      },
      HEADER,
      rewind,
    );
  const lines = async (rewind = false) =>
    (await parts(rewind)).lines.map((line) => [line?.opacity, line?.shift]);

  await withMotion(page, async () => {
    await page.story(STORY);
    await page.settled(HEADER);
    // 只记页头里面的："重播"按钮自己被点的时候也有过渡
    await record(page, "body", `${HEADER} *`);
    await page.click("text=重播");
    await page.waitFor(
      async () => (await parts()).lines[0]?.opacity !== "1",
      "重新挂上的页头应该在入场",
    );
    const playing = await parts();
    assert.deepEqual(
      playing.lines.map((line) => [line?.name, line?.delay]),
      [
        ["ef-shift-in", "0s"],
        ["ef-shift-in", "0.1s"],
        ["ef-shift-in", "0.2s"],
      ],
    );
    assert.equal(playing.back?.name, "none", "返回方块不参加入场");
    assert.equal(playing.actions?.name, "none", "行动区不参加入场");

    await page.settled(HEADER);
    assert.deepEqual(await recorded(page), [
      "ef-shift-in",
      "ef-shift-in",
      "ef-shift-in",
    ]);
    const settled = Array.from({ length: 3 }, () => ["1", 0]);
    assert.deepEqual(await lines(), settled);
    assert.deepEqual(
      await lines(true),
      Array.from({ length: 3 }, () => ["0", -8]),
      "三行字都是从左边 8px 淡入",
    );

    // 吸顶的页头是一直贴在那儿的：不播
    await page.story("控件-pageheader-页头--sticky");
    const names = (await parts()).lines.map((line) => line?.name ?? "none");
    assert.deepEqual(names, ["none", "none", "none"], "吸顶的页头不播入场");
  });

  await page.story(STORY);
  await page.settled(HEADER);
  assert.deepEqual(
    await lines(),
    Array.from({ length: 3 }, () => ["1", 0]),
  );
});

test("小型面积图：进视口才画——整张从左擦出来（600ms），几张一起画；盒子外面那一圈不裁", async () => {
  const { page } = storybook;
  const STORY = "控件-sparkline-小型面积图--entrance";
  const CHART = "#storybook-root svg[data-variant]";
  const charts = (rewind = false) =>
    page.evaluate(
      (css, toStart) =>
        [...document.querySelectorAll(css)].map((chart) => {
          const animations = chart.getAnimations();
          if (toStart) {
            for (const animation of animations) {
              animation.pause();
              animation.currentTime = 0;
            }
          }
          const style = getComputedStyle(chart);
          const found = {
            name: style.animationName,
            delay: style.animationDelay,
            duration: style.animationDuration,
            clip: style.clipPath,
          };
          if (toStart) for (const animation of animations) animation.finish();
          return found;
        }),
      CHART,
      rewind,
    );
  const each = async (key: "name" | "delay" | "duration" | "clip") =>
    (await charts()).map((chart) => chart[key]);

  await withMotion(page, async () => {
    await page.story(STORY);
    await replayOffscreen(page);
    await page.pause(300);
    assert.deepEqual(await each("name"), ["none", "none"]);
    assert.deepEqual(
      await each("clip"),
      ["inset(0px 100% 0px 0px)", "inset(0px 100% 0px 0px)"],
      "没进视口时整张是裁掉的",
    );

    await record(page, "body", CHART);
    await scrollIntoView(page, CHART);
    await page.waitFor(
      async () => (await each("name"))[0] === "ef-wipe-in",
      "滚进视口之后应该开始画",
    );
    assert.deepEqual(await each("name"), ["ef-wipe-in", "ef-wipe-in"]);
    assert.deepEqual(await each("duration"), ["0.6s", "0.6s"]);
    // 一起画，不逐张错开
    assert.deepEqual(await each("delay"), ["0s", "0s"]);

    await page.settled("#storybook-root");
    assert.deepEqual(await recorded(page), ["ef-wipe-in", "ef-wipe-in"]);
    // 走完：四边都往外让 4px——折线有半个线宽画在盒子外面。
    // 右边是从 100% 插值过来的，浏览器把它写成 calc(0% - 4px)
    for (const clip of await each("clip")) {
      assert.match(
        clip,
        /^inset\(-4px( (calc\(0% - 4px\)|-4px) -4px -4px)?\)$/,
        "走完整张图都在，盒子外面那一圈不裁",
      );
    }
    for (const chart of await charts(true)) {
      assert.equal(chart.clip, "inset(-4px 100% -4px -4px)", "从左边擦过来");
    }

    await page.evaluate(() => scrollTo(0, 0));
    await page.frames(4);
    await scrollIntoView(page, CHART);
    await page.frames(4);
    assert.deepEqual(await recorded(page), [], "滚回来不应该重画");
  });

  await page.story(STORY);
  await page.settled("#storybook-root");
  for (const clip of await each("clip")) {
    assert.doesNotMatch(clip, /100%/, "减少动态效果下直接是画完的样子");
  }
});
