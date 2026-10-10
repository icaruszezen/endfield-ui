// 正常动效下进出场真的有过渡，过渡走完后停在终态、关闭后被卸载；"减少动态效果"下没有过渡。
// 状态的记号（勾、细线、连线、括号、填入的字）也在这里。断言三件事：声明了什么过渡（计算样式）、
// 它真的跑过（浏览器发的 transitionrun / animationstart）、走完之后停在哪——都不靠"正好量到一半"
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
