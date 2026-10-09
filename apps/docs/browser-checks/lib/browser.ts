/*
 * 通过 DevTools 协议驱动一个无头的 Chromium 系浏览器（Edge、Chrome、Chromium）。
 *
 * 为什么不用 jsdom：弹窗"打开后焦点移入"、焦点被锁在浮层里、浮层贴边翻转
 * 这些行为靠的是动画帧、真实的 Tab 顺序和布局，jsdom 里都没有。
 * 为什么不用现成的测试框架：这里只需要按键、点击、读 DOM，Node 自带的
 * WebSocket 就够了，不用再装一个浏览器。
 */
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import {
  closeSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  openSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, delimiter, dirname, join } from "node:path";

export type Theme = "light" | "dark" | "both";
export type Point = { x: number; y: number };
/** CSS 选择器；`text=归档` 找文字（或 `aria-label`）正好相等的可点击元素；或者直接给坐标 */
export type Target = string | Point;

// DevTools 协议的消息体没有随 Node 带类型，这里按用到的字段取
// oxlint-disable-next-line typescript/no-explicit-any
type Message = any;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const KEY_CODES: Record<string, number> = {
  Backspace: 8,
  Tab: 9,
  Enter: 13,
  Escape: 27,
  Space: 32,
  PageUp: 33,
  PageDown: 34,
  End: 35,
  Home: 36,
  ArrowLeft: 37,
  ArrowUp: 38,
  ArrowRight: 39,
  ArrowDown: 40,
  Delete: 46,
  ContextMenu: 93,
  F6: 117,
  F10: 121,
};

function findBrowser(): string {
  const fromEnv = process.env.BROWSER_PATH;
  if (fromEnv) {
    assert.ok(existsSync(fromEnv), `BROWSER_PATH 指向的文件不存在：${fromEnv}`);
    return fromEnv;
  }

  const candidates: string[] = [];
  if (process.platform === "win32") {
    const roots = [
      process.env["PROGRAMFILES(X86)"],
      process.env.PROGRAMFILES,
      process.env.LOCALAPPDATA,
    ];
    for (const root of roots) {
      if (!root) continue;
      candidates.push(
        join(root, "Microsoft/Edge/Application/msedge.exe"),
        join(root, "Google/Chrome/Application/chrome.exe"),
      );
    }
  } else if (process.platform === "darwin") {
    candidates.push(
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
      "/Applications/Chromium.app/Contents/MacOS/Chromium",
    );
  } else {
    const names = [
      "google-chrome",
      "google-chrome-stable",
      "chromium",
      "chromium-browser",
      "microsoft-edge",
    ];
    for (const dir of (process.env.PATH ?? "").split(delimiter)) {
      for (const name of names) candidates.push(join(dir, name));
    }
  }

  const found = candidates.find((path) => existsSync(path));
  assert.ok(
    found,
    "没有找到 Edge / Chrome / Chromium。用环境变量 BROWSER_PATH 指给它。",
  );
  return found;
}

export type LaunchOptions = {
  /** Storybook 的地址，不带末尾的斜杠 */
  baseUrl: string;
  width?: number;
  height?: number;
};

export type Page = Awaited<ReturnType<typeof launch>>;

/** 等浏览器把调试端口准备好的时间。CI 的机器冷启动时要好几秒 */
const STARTUP_TIMEOUT = 30_000;

/**
 * 起一个无头浏览器，返回它的页面的调试地址。
 * 没起来就把进程和 profile 清掉再报错——留着一个子进程，测试进程永远不会退出。
 */
async function start(width: number, height: number) {
  // 每次用一个新的 profile：复用同一个目录时，后起的进程会把活儿交给还没退出的那个
  const profile = mkdtempSync(join(tmpdir(), "ef-browser-check-"));
  // 浏览器自己说了什么，写进一个文件：起不来的时候，原因多半在这里。
  // 不能接成管道——Windows 上的 Edge 接了管道就起不来
  const logFile = join(profile, "stderr.log");
  const log = openSync(logFile, "w");
  const child = spawn(
    findBrowser(),
    [
      "--headless=new",
      "--disable-gpu",
      "--hide-scrollbars",
      "--no-first-run",
      "--no-default-browser-check",
      // 0 = 让浏览器自己挑一个空闲端口，写在 profile 里的 DevToolsActivePort
      "--remote-debugging-port=0",
      `--user-data-dir=${profile}`,
      `--window-size=${width},${height}`,
      // 没接鼠标的机器（CI 的 runner）上，无头浏览器报的是"不能悬停"：
      // `@media (hover: hover)` 不成立，所有 `hover:` 的样式都不生效。
      // 检查的是桌面上的样子，所以固定成"有一个能悬停的精确指针"
      "--blink-settings=primaryHoverType=2,availableHoverTypes=2,primaryPointerType=4,availablePointerTypes=4",
      ...(process.env.BROWSER_FLAGS?.split(" ").filter(Boolean) ?? []),
      "about:blank",
    ],
    { stdio: ["ignore", "ignore", log] },
  );
  closeSync(log);
  // 退出码是 0 不算失败：Windows 上最先起来的那个进程把活儿交给另一个进程就退出了
  let crashed = false;
  child.once("exit", (code) => {
    crashed = code !== 0;
  });

  const dispose = async ({ orphans = false } = {}) => {
    child.kill();
    if (orphans && process.platform === "win32") {
      // Windows 上真正的浏览器不是我们起的那个进程（它交了班就退出了），kill 够不着。
      // 正常收尾时是通过调试协议让浏览器自己关；这里是没连上的情形，
      // 只能按 profile 目录的名字把它们找出来关掉
      spawnSync(
        "powershell",
        [
          "-NoProfile",
          "-Command",
          `Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*${basename(profile)}*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }`,
        ],
        { stdio: "ignore" },
      );
    }
    await sleep(300);
    try {
      rmSync(profile, { recursive: true, force: true });
    } catch {
      // 浏览器刚退出时 profile 可能还被占着，留给系统清理
    }
  };

  let socketUrl: string | undefined;
  const deadline = Date.now() + STARTUP_TIMEOUT;
  while (!socketUrl && !crashed && Date.now() < deadline) {
    await sleep(125);
    try {
      const port = readFileSync(
        join(profile, "DevToolsActivePort"),
        "utf8",
      ).split("\n")[0];
      const targets: Message[] = await (
        await fetch(`http://127.0.0.1:${port}/json/list`, {
          // 端口开了但不答话的时候不要一直等下去
          signal: AbortSignal.timeout(2000),
        })
      ).json();
      socketUrl = targets.find(
        (target) => target.type === "page",
      )?.webSocketDebuggerUrl;
    } catch {
      // 还没起来，接着等
    }
  }

  if (!socketUrl) {
    let stderr = "";
    try {
      stderr = readFileSync(logFile, "utf8").trim().slice(-2000);
    } catch {
      // 没写出日志
    }
    await dispose({ orphans: true });
    throw new Error(
      `浏览器没有起来（${crashed ? "进程退出了" : `等了 ${STARTUP_TIMEOUT / 1000} 秒`}）${stderr ? `：\n${stderr}` : ""}`,
    );
  }
  return { socketUrl, dispose };
}

export async function launch({
  baseUrl,
  width = 1200,
  height = 800,
}: LaunchOptions) {
  // 偶尔会有一次起不来（CI 上见过），再试一次
  const { socketUrl, dispose } = await start(width, height).catch(() =>
    start(width, height),
  );

  const socket = new WebSocket(socketUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve);
    socket.addEventListener("error", reject);
  });

  let nextId = 1;
  const pending = new Map<
    number,
    { resolve: (value: Message) => void; reject: (error: Error) => void }
  >();
  const listeners = new Set<(message: Message) => void>();
  socket.addEventListener("message", (event) => {
    const message: Message = JSON.parse(String(event.data));
    const waiting = pending.get(message.id);
    if (waiting) {
      pending.delete(message.id);
      if (message.error) {
        waiting.reject(new Error(JSON.stringify(message.error)));
      } else {
        waiting.resolve(message.result);
      }
    } else {
      for (const listener of listeners) listener(message);
    }
  });
  // 连接断了，还在等回话的命令永远等不到：让它们立刻失败，别一直挂到检查的时限
  socket.addEventListener("close", () => {
    for (const waiting of pending.values()) {
      waiting.reject(new Error("和浏览器的连接断了"));
    }
    pending.clear();
  });

  const send = (method: string, params: object = {}): Promise<Message> =>
    new Promise((resolve, reject) => {
      const id = nextId++;
      pending.set(id, { resolve, reject });
      socket.send(JSON.stringify({ id, method, params }));
    });

  /** 页面里报的错：`console.error` 和没接住的异常。每次换页清空 */
  const errors: string[] = [];
  listeners.add((message) => {
    if (
      message.method === "Runtime.consoleAPICalled" &&
      message.params.type === "error"
    ) {
      errors.push(
        message.params.args
          .map((arg: Message) => arg.value ?? arg.description)
          .join(" "),
      );
    }
    if (message.method === "Runtime.exceptionThrown") {
      const details = message.params.exceptionDetails;
      errors.push(details.exception?.description ?? details.text);
    }
  });

  await send("Page.enable");
  await send("Runtime.enable");
  // 截图之后页面会被当成失去焦点，键盘事件随之慢一拍：让它始终算作有焦点
  await send("Emulation.setFocusEmulationEnabled", { enabled: true });
  // CPU_THROTTLE=2：把页面放慢一半。本机太快，"状态刚变就读样式"这类竞态碰不上；
  // 放慢之后和 CI 上一样会露出来。推送前跑一遍。再慢（4）抽屉的进场会等超时
  const throttle = Number(process.env.CPU_THROTTLE);
  if (throttle > 1) {
    await send("Emulation.setCPUThrottlingRate", { rate: throttle });
  }
  // BLOCK_URLS=*fonts.googleapis.com*,*fonts.gstatic.com*：这些地址的请求立刻失败。
  // 预览站的字体从 Google Fonts 取，本机到那边的网络一卡，页面就得等样式表超时（见过两分钟），
  // 整个文件的检查跟着报"页面没有渲染出来"。屏蔽之后页面用回退字体，检查不再看网络的脸色
  const blocked = process.env.BLOCK_URLS?.split(",").filter(Boolean) ?? [];
  if (blocked.length > 0) {
    await send("Network.enable");
    await send("Network.setBlockedURLs", { urls: blocked });
  }

  async function evaluate<Args extends unknown[], Result>(
    fn: (...args: Args) => Result,
    ...args: Args
  ): Promise<Awaited<Result>> {
    // 函数被转成源码送进页面执行，所以它不能引用外面的变量，要用的值走参数
    const { result, exceptionDetails } = await send("Runtime.evaluate", {
      expression: `(${fn.toString()})(...${JSON.stringify(args)})`,
      awaitPromise: true,
      returnByValue: true,
    });
    if (exceptionDetails) {
      throw new Error(
        exceptionDetails.exception?.description ?? exceptionDetails.text,
      );
    }
    return result.value;
  }

  /** 反复问，直到拿到一个真值；超时就以 `message` 失败 */
  async function waitFor<T>(
    probe: () => T | Promise<T>,
    message: string,
    timeout = 5000,
  ): Promise<NonNullable<T>> {
    const deadline = Date.now() + timeout;
    for (;;) {
      const value = await probe();
      if (value) return value;
      if (Date.now() > deadline) {
        assert.fail(`${message}（等了 ${timeout}ms）`);
      }
      await sleep(40);
    }
  }

  function locate(
    target: string,
  ): Promise<(Point & { hittable: boolean }) | null> {
    return evaluate((selector) => {
      const shown = (node: Element) => {
        const rect = node.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && !node.closest("[hidden]");
      };
      const element = selector.startsWith("text=")
        ? [
            ...document.querySelectorAll("button, a, [role], label, input"),
          ].find(
            (node) =>
              shown(node) &&
              (
                node.getAttribute("aria-label") ??
                node.textContent ??
                ""
              ).trim() === selector.slice(5),
          )
        : [...document.querySelectorAll(selector)].find(shown);
      if (!element) return null;
      element.scrollIntoView({ block: "nearest" });
      const rect = element.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      // 这一点上最上面的是不是它（或者它里面、包着它的东西）
      const top = document.elementFromPoint(x, y);
      const hittable =
        top !== null && (element.contains(top) || top.contains(element));
      return { x, y, hittable };
    }, target);
  }

  /**
   * 元素的中心点。等它出现，并且连续两次量到同一个位置——布局还在动的时候点不中。
   *
   * 还要等到真的点得到它：一个正在展开的容器里，元素的位置早就定了，
   * 但还被裁在外面，这时候点下去点到的是它下面的东西（本机快碰不上，CI 上碰得上）。
   * 等上一秒还是点不到就照点——有的检查点的就是被盖住的地方。
   */
  async function point(target: Target): Promise<Point> {
    if (typeof target !== "string") return target;
    let previous: Point | null = null;
    const started = Date.now();
    return waitFor(async () => {
      const current = await locate(target);
      const settled =
        current &&
        previous &&
        Math.abs(current.x - previous.x) < 0.5 &&
        Math.abs(current.y - previous.y) < 0.5;
      previous = current;
      if (!settled) return null;
      if (!current.hittable && Date.now() - started < 1000) return null;
      return { x: current.x, y: current.y };
    }, `找不到 ${target}`);
  }

  async function goto(url: string, ready: () => boolean | Promise<boolean>) {
    // 页面上的字体还在取的时候跳走，下一页的字体请求会卡住二十来秒才回来（本机量到的：
    // 一条检查的最后一步让等宽字第一次出现，紧接着下一条就跳去别的 story）。
    // 跳之前等这一页的字体取完；最多等三秒，取不完也照跳
    await evaluate(() =>
      Promise.race([
        document.fonts.ready.then(() => true),
        new Promise<boolean>((resolve) =>
          setTimeout(() => resolve(false), 3000),
        ),
      ]),
    ).catch(() => false);
    errors.length = 0;
    const loaded = new Promise<void>((resolve) => {
      const listener = (message: Message) => {
        if (message.method !== "Page.loadEventFired") return;
        listeners.delete(listener);
        resolve();
      };
      listeners.add(listener);
    });
    await send("Page.navigate", { url });
    await loaded;
    await waitFor(() => evaluate(ready), `页面没有渲染出来：${url}`, 20000);
    // 预览外壳是挂载之后才把主题写到 <html> 上的，颜色从亮色过渡到目标主题：
    // 多等两帧让这一轮过渡结束，否则紧跟着读颜色读到的是起点（见 frames）
    await page.frames();
  }

  const page = {
    send,
    errors,
    evaluate,
    waitFor,
    /** 干等。只用在"过了这么久它仍然没变"这类反面的断言上 */
    pause: sleep,

    /**
     * 等到读出来的东西和期望的一样（按 JSON 比）。读的是会过渡的样式时用它，
     * 不要读一次就断言：状态刚变、或者暗色主题刚载入，头几帧量到的是过渡的起点。
     * 一直等不到就用 deepEqual 报错，能看到差在哪
     */
    async waitEqual<T>(read: () => Promise<T>, expected: T, message: string) {
      let last: T | undefined;
      try {
        await waitFor(
          async () =>
            JSON.stringify((last = await read())) === JSON.stringify(expected),
          message,
        );
      } catch {
        assert.deepEqual(last, expected, message);
      }
    },

    /**
     * 等几帧。状态刚变、马上要读一个**会过渡的样式**（颜色、位置）当基准时用：
     * "减少动态效果"把过渡压到了 0.01ms，但它要到下一帧才走完，
     * 紧跟着读到的是过渡的起点——本机碰巧读得到终点，CI 上不一定
     */
    frames(count = 2) {
      return evaluate(
        (frames) =>
          new Promise<void>((resolve) => {
            const next = (left: number) =>
              left === 0
                ? resolve()
                : requestAnimationFrame(() => next(left - 1));
            next(frames);
          }),
        count,
      );
    },

    /**
     * 等动效走完：范围内（不传选择器就是整页，含伪元素）有限时长的过渡和动画
     * 都结束了才返回。状态变了之后要读**终态**时用它——之后读一次就行，不用轮询。
     * 循环的动画（加载指示、跑马灯、刻度环）不等：它们不会结束。
     *
     * 先等两帧：状态刚变的那一刻过渡可能还没被创建出来，这时候问会得到"已经没有了"
     */
    async settled(selector?: string, message = "动效没有走完") {
      await page.frames();
      await waitFor(
        () =>
          evaluate((css) => {
            const root = css
              ? document.querySelector(css)
              : document.documentElement;
            if (!root) return true;
            return root.getAnimations({ subtree: true }).every((animation) => {
              const iterations =
                animation.effect?.getComputedTiming().iterations;
              return (
                iterations === Infinity ||
                animation.playState === "finished" ||
                animation.playState === "idle"
              );
            });
          }, selector ?? null),
        message,
      );
    },

    /** 打开一个 story 的画布，等它渲染完 */
    story(id: string, theme: Theme = "light") {
      return goto(
        `${baseUrl}/iframe.html?id=${encodeURIComponent(id)}&viewMode=story&globals=theme:${theme}`,
        async () => {
          await document.fonts.ready;
          return (
            document.body.classList.contains("sb-show-main") &&
            (document.querySelector("#storybook-root")?.childElementCount ??
              0) > 0 &&
            // 预览外壳在挂载后才把主题写到 <html> 上
            document.documentElement.dataset.theme !== undefined
          );
        },
      );
    },

    /** 打开一个文档页（里面内嵌着这个组件的全部 story） */
    docs(id: string, theme: Theme = "both") {
      return goto(
        `${baseUrl}/iframe.html?id=${encodeURIComponent(id)}&viewMode=docs&globals=theme:${theme}`,
        async () => {
          await document.fonts.ready;
          const stories = document.querySelectorAll(".docs-story");
          // 每个 story 都套着预览外壳（.storybook/preview.tsx），外壳上有 text-ink
          return (
            stories.length > 0 &&
            [...stories].every((story) => story.querySelector(".text-ink"))
          );
        },
      );
    },

    async key(name: string, { shift = false, ctrl = false } = {}) {
      const code = KEY_CODES[name];
      const base = code
        ? {
            key: name === "Space" ? " " : name,
            code: name,
            windowsVirtualKeyCode: code,
          }
        : {
            key: name,
            code: `Key${name.toUpperCase()}`,
            windowsVirtualKeyCode: name.toUpperCase().charCodeAt(0),
          };
      // 功能键不产生文字；回车、空格和字母要带上，否则按钮不会被"按下"
      const text =
        name === "Enter"
          ? "\r"
          : name === "Space"
            ? " "
            : code
              ? undefined
              : name;
      const modifiers = (shift ? 8 : 0) | (ctrl ? 2 : 0);
      await send("Input.dispatchKeyEvent", {
        type: text ? "keyDown" : "rawKeyDown",
        ...base,
        text,
        modifiers,
      });
      await send("Input.dispatchKeyEvent", {
        type: "keyUp",
        ...base,
        modifiers,
      });
      // 让这次按键引起的渲染走完一帧
      await evaluate(
        () => new Promise((resolve) => requestAnimationFrame(resolve)),
      );
    },

    /** 逐字输入。字母和数字走按键；中文这类不在键盘上的字直接送进输入框，像输入法上屏那样 */
    async type(text: string) {
      for (const character of text) {
        if (/^[a-z0-9]$/i.test(character)) {
          await page.key(character);
        } else {
          await send("Input.insertText", { text: character });
          await evaluate(
            () => new Promise((resolve) => requestAnimationFrame(resolve)),
          );
        }
      }
    },

    point,

    /** 把指针移过去。分几步走：真的鼠标不会只发一个事件，有的控件要看到指针在动才认 */
    async moveTo(target: Target) {
      const { x, y } = await point(target);
      for (const offset of [6, 3, 0]) {
        await send("Input.dispatchMouseEvent", {
          type: "mouseMoved",
          x: x - offset,
          y: y - offset,
        });
      }
    },

    /** 点一下。`button: "right"` 是右键：页面会收到 contextmenu */
    async click(
      target: Target,
      { button = "left" }: { button?: "left" | "right" } = {},
    ) {
      const { x, y } = await point(target);
      const at = { x, y, button, clickCount: 1 };
      await send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y });
      await send("Input.dispatchMouseEvent", { type: "mousePressed", ...at });
      await send("Input.dispatchMouseEvent", { type: "mouseReleased", ...at });
    },

    /** 按住拖过去再松开。中间走几步：拖动类的控件要看到指针在动 */
    async drag(from: Target, to: Target) {
      const start = await point(from);
      const end = await point(to);
      const held = { button: "left", buttons: 1 };
      await send("Input.dispatchMouseEvent", { type: "mouseMoved", ...start });
      await send("Input.dispatchMouseEvent", {
        type: "mousePressed",
        ...start,
        ...held,
        clickCount: 1,
      });
      const steps = 6;
      for (let step = 1; step <= steps; step += 1) {
        await send("Input.dispatchMouseEvent", {
          type: "mouseMoved",
          x: start.x + ((end.x - start.x) * step) / steps,
          y: start.y + ((end.y - start.y) * step) / steps,
          ...held,
        });
      }
      await send("Input.dispatchMouseEvent", {
        type: "mouseReleased",
        ...end,
        button: "left",
        clickCount: 1,
      });
      await evaluate(
        () => new Promise((resolve) => requestAnimationFrame(resolve)),
      );
    },

    /** 当前焦点，写成 `角色:名称`；没有角色时用标签名，名称优先取 `aria-label` */
    focused() {
      return evaluate(() => {
        const element = document.activeElement;
        if (!element || element === document.body) return "(body)";
        const name =
          element.getAttribute("aria-label") ??
          element.textContent?.trim().slice(0, 30) ??
          "";
        const role =
          element.getAttribute("role") ?? element.tagName.toLowerCase();
        return `${role}:${name}`;
      });
    },

    /**
     * 看得见吗。有些浮层关掉后还留在 DOM 里（带 `hidden`），
     * 所以问的是"看得见"而不是"存在"。
     */
    visible(selector: string) {
      return evaluate(
        (css) =>
          [...document.querySelectorAll(css)].some((element) => {
            const rect = element.getBoundingClientRect();
            return (
              rect.width > 0 && rect.height > 0 && !element.closest("[hidden]")
            );
          }),
        selector,
      );
    },

    async waitVisible(selector: string, message = `${selector} 没有出现`) {
      await waitFor(() => page.visible(selector), message);
    },

    async waitGone(selector: string, message = `${selector} 没有消失`) {
      await waitFor(async () => !(await page.visible(selector)), message);
    },

    async waitFocused(expected: string | RegExp, message?: string) {
      let last = "";
      const matches = (value: string) =>
        typeof expected === "string"
          ? value === expected
          : expected.test(value);
      try {
        await waitFor(async () => matches((last = await page.focused())), "");
      } catch {
        assert.fail(
          `${message ?? "焦点不对"}：想要 ${String(expected)}，实际是 ${last}`,
        );
      }
    },

    /** 这些元素（不算藏起来的）各自的文字 */
    text(selector: string) {
      return evaluate(
        (css) =>
          [...document.querySelectorAll(css)]
            .filter((element) => !element.closest("[hidden]"))
            .map((element) => (element.textContent ?? "").trim()),
        selector,
      );
    },

    async setSize(nextWidth: number, nextHeight: number) {
      await send("Emulation.setDeviceMetricsOverride", {
        width: nextWidth,
        height: nextHeight,
        deviceScaleFactor: 1,
        mobile: false,
      });
    },

    /** 默认是"减少动态效果"：过渡几乎为零，检查不用等。动效那一组关掉它 */
    async setReducedMotion(reduce: boolean) {
      await send("Emulation.setEmulatedMedia", {
        features: [
          {
            name: "prefers-reduced-motion",
            value: reduce ? "reduce" : "no-preference",
          },
        ],
      });
    },

    async screenshot(file: string) {
      const { data } = await send("Page.captureScreenshot", { format: "png" });
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, Buffer.from(data, "base64"));
      await send("Page.bringToFront");
    },

    async close() {
      // 浏览器不一定回这一句：它可能先把连接断了，也可能已经不动了。
      // 所以有回话、连接断了、等了两秒，哪个先到都算数，不干等
      // （CI 上有过一次：一个文件跑完收尾，在这里挂到了两分钟的时限）
      await Promise.race([
        send("Browser.close").catch(() => {
          // 已经关了
        }),
        sleep(2000),
      ]);
      socket.close();
      await dispose();
    },
  };

  await page.setReducedMotion(true);
  return page;
}
