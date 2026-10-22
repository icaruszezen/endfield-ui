import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { after, before, test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { runInNewContext } from "node:vm";
import { brotliCompressSync } from "node:zlib";
import commonjs from "@rollup/plugin-commonjs";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { rollup } from "rollup";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const temporary = mkdtempSync(join(tmpdir(), "endfield-ui-package-"));
const packed = join(temporary, "package");
const dist = join(packed, "dist");
const consumer = join(packed, "consumer.js");
const flat = join(packed, "flat.js");
let flatCode;
let coldCode;

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((item) => {
    const file = join(dir, item.name);
    return item.isDirectory() ? walk(file) : [file];
  });
}

const bare = (id) => !id.startsWith(".") && !isAbsolute(id);

async function bundle(
  source,
  { dependencies = true, treeshake = true, format = "esm" } = {},
) {
  const build = await rollup({
    input: consumer,
    treeshake,
    external: dependencies ? (id) => /^(react|react-dom)(\/|$)/.test(id) : bare,
    plugins: [
      {
        name: "package-consumer",
        resolveId(id) {
          if (id === consumer || id === flat) return id;
        },
        load(id) {
          if (id === consumer) return source;
          if (id === flat) return flatCode;
        },
      },
      nodeResolve({ browser: true, modulePaths: [join(root, "node_modules")] }),
      ...(dependencies ? [commonjs()] : []),
    ],
    onwarn(warning) {
      if (warning.code !== "MODULE_LEVEL_DIRECTIVE") {
        throw new Error(warning.message);
      }
    },
  });
  try {
    const { output } = await build.generate({ format });
    assert.equal(output.length, 1);
    assert.equal(output[0].type, "chunk");
    return output[0];
  } finally {
    await build.close();
  }
}

before(async () => {
  const [archive] = JSON.parse(
    execFileSync("npm", ["pack", "--json", "--pack-destination", temporary], {
      cwd: root,
      encoding: "utf8",
      stdio: "pipe",
    }),
  );
  execFileSync("tar", [
    "-xf",
    join(temporary, archive.filename),
    "-C",
    temporary,
  ]);
  symlinkSync(join(root, "node_modules"), join(packed, "node_modules"), "dir");
  const source = ["index.js", "game.js"]
    .map((file) => `export * from ${JSON.stringify(join(dist, file))};`)
    .join("\n");
  flatCode = (await bundle(source, { dependencies: false, treeshake: false }))
    .code;
  coldCode = (
    await bundle(`export * from ${JSON.stringify(flat)};`, {
      dependencies: false,
      treeshake: false,
      format: "cjs",
    })
  ).code;
});

after(() => rmSync(temporary, { recursive: true, force: true }));

test("npm 包里的模块、类型、样式、图片与客户端边界完整", () => {
  const manifest = JSON.parse(
    readFileSync(join(packed, "package.json"), "utf8"),
  );
  for (const target of Object.values(manifest.exports)) {
    for (const file of typeof target === "string"
      ? [target]
      : Object.values(target)) {
      assert.ok(existsSync(join(packed, file)), `未发布导出路径 ${file}`);
    }
  }
  for (const name of ["LICENSE", "NOTICE.md"])
    assert.ok(existsSync(join(packed, name)));
  const code = walk(dist).filter((file) => file.endsWith(".js"));
  assert.ok(
    code.some((file) => file.includes(`${sep}components${sep}`)),
    "组件被合并成了单文件",
  );
  for (const file of code) {
    const text = readFileSync(file, "utf8");
    assert.ok(
      text.startsWith('"use client";'),
      `${relative(dist, file)} 缺客户端边界`,
    );
    for (const [, imported] of text.matchAll(/\bfrom\s+["'](\.[^"']+)["']/g)) {
      assert.ok(
        existsSync(resolve(dirname(file), imported)),
        `${file} 引用了未发布的 ${imported}`,
      );
    }
    assert.ok(!/\.(test|stories)\./.test(file));
  }
  const css = readFileSync(join(dist, "game/styles.css"), "utf8");
  for (const [, url] of css.matchAll(/url\(["']?(\.\/[^)"']+)/g)) {
    assert.ok(
      existsSync(resolve(dist, "game", url)),
      `未发布 Game 图片 ${url}`,
    );
  }
});

test("已打包的两个入口及其声明可供外部 TypeScript 项目使用", () => {
  const fixture = join(packed, "consumer.tsx");
  writeFileSync(
    fixture,
    `
    import { Field, Input, type InputProps } from "@endfield-ui/react";
    import { RoundedSwitch, type RoundedSwitchProps } from "@endfield-ui/react/game";
    const input: InputProps = { placeholder: "账号" };
    const toggle: RoundedSwitchProps = { defaultChecked: true };
    export const form = <Field label="账号"><Input {...input} /></Field>;
    export const game = <Field label="声音"><RoundedSwitch {...toggle} /></Field>;
  `,
  );
  execFileSync(
    join(root, "node_modules/.bin/tsc"),
    [
      "--noEmit",
      "--strict",
      "--target",
      "es2022",
      "--module",
      "nodenext",
      "--moduleResolution",
      "nodenext",
      "--jsx",
      "react-jsx",
      fixture,
    ],
    { cwd: packed, stdio: "pipe" },
  );
});

test("导入整个库不创建 Context，首次渲染后复用同一个 Context", () => {
  const require = createRequire(join(root, "package.json"));
  const react = require("react");
  let created = 0;
  const trackedReact = {
    ...react,
    createContext(...args) {
      created += 1;
      return react.createContext(...args);
    },
  };
  const exports = {};
  runInNewContext(coldCode, {
    exports,
    require: (id) => (id === "react" ? trackedReact : require(id)),
  });
  assert.equal(created, 0, "导入库就执行了 createContext");
  for (let i = 0; i < 2; i += 1) {
    const html = renderToStaticMarkup(
      createElement(
        exports.Field,
        {
          label: "账号",
          controlId: "account",
          error: "请填写账号",
        },
        createElement(exports.Input),
      ),
    );
    assert.match(html, /id="account"/);
    assert.match(html, /aria-invalid="true"/);
    assert.equal(created, 1, "Field 的 Provider 与消费者没有复用 Context");
  }
});

test("主入口的 Field 状态传到 Game 组件，嵌套 Field 不串状态", async () => {
  const { Field } = await import(pathToFileURL(join(dist, "index.js")));
  const { RoundedSwitch } = await import(pathToFileURL(join(dist, "game.js")));
  const html = renderToStaticMarkup(
    createElement(
      Field,
      {
        label: "外层",
        disabled: true,
        error: "外层错误",
      },
      createElement(RoundedSwitch, { "data-probe": "outer" }),
      createElement(
        Field,
        { label: "内层" },
        createElement(RoundedSwitch, { "data-probe": "inner" }),
      ),
    ),
  );
  const outer = html.match(/<[^>]+data-probe="outer"[^>]*>/)?.[0];
  const inner = html.match(/<[^>]+data-probe="inner"[^>]*>/)?.[0];
  assert.ok(outer);
  assert.ok(inner);
  assert.match(outer, /aria-invalid="true"/);
  assert.match(outer, /data-disabled/);
  assert.doesNotMatch(inner, /aria-invalid|data-disabled/);
});

const fixtures = {
  icon: [["index", "icons/Check", ["Check"]]],
  utility: [["index", "lib/cn", ["cn"]]],
  button: [["index", "components/button/Button", ["Button"]]],
  form: [
    ["index", "components/button/Button", ["Button"]],
    ["index", "components/field/Field", ["Field"]],
    ["index", "components/input/Input", ["Input"]],
    ["index", "components/checkbox/Checkbox", ["Checkbox"]],
    ["index", "components/otp-input/OtpInput", ["OtpInput"]],
    ["index", "components/radio/Radio", ["Radio", "RadioGroup"]],
    ["index", "components/select/Select", ["Select", "SelectItem"]],
    ["index", "components/tabs/Tabs", ["Tabs", "Tab", "TabList", "TabPanel"]],
    ["index", "components/tooltip/Tooltip", ["Tooltip", "TooltipProvider"]],
    ["index", "components/toast/Toast", ["ToastProvider", "useToast"]],
  ],
  navigation: [
    ["index", "components/nav-action/NavAction", ["NavAction"]],
    ["index", "components/nav-menu/NavMenu", ["NavMenu", "NavMenuItem"]],
    ["index", "components/side-rail/SideRail", ["SideRail", "SideRailItem"]],
    [
      "index",
      "components/side-rail/SideRailSub",
      ["SideRailSub", "SideRailSubItem"],
    ],
    ["index", "components/top-bar/TopBar", ["TopBar"]],
  ],
  game: [
    ["index", "components/field/Field", ["Field"]],
    ["game", "game/rounded-switch/RoundedSwitch", ["RoundedSwitch"]],
    ["game", "game/rounded-toggle/RoundedToggle", ["RoundedToggle"]],
    ["game", "game/animated-dialog/AnimatedDialog", ["AnimatedDialog"]],
  ],
};

function fixtureSource(groups, mode) {
  return groups
    .map(([entry, file, names]) => {
      const target =
        mode === "direct"
          ? join(dist, `${file}.js`)
          : mode === "flat"
            ? flat
            : `@endfield-ui/react${entry === "game" ? "/game" : ""}`;
      return `export { ${names.join(", ")} } from ${JSON.stringify(target)};`;
    })
    .join("\n");
}

function modules(chunk) {
  return Object.entries(chunk.modules)
    .filter(
      ([file, info]) => file.startsWith(dist + sep) && info.renderedLength > 0,
    )
    .map(([file]) => relative(dist, file))
    .sort();
}

function size(chunk) {
  return {
    raw: Buffer.byteLength(chunk.code),
    brotli: brotliCompressSync(chunk.code).length,
  };
}

for (const [name, groups] of Object.entries(fixtures)) {
  test(`Rollup 按需打包 ${name}：公共入口与单文件版均无其它组件族泄漏`, async (t) => {
    const direct = await bundle(fixtureSource(groups, "direct"));
    const expected = size(direct);
    for (const mode of ["public", "flat"]) {
      const actual = await bundle(fixtureSource(groups, mode));
      const bytes = size(actual);
      t.diagnostic(
        `${mode}: raw ${bytes.raw}, brotli ${bytes.brotli}; direct: raw ${expected.raw}, brotli ${expected.brotli}`,
      );
      if (mode === "public") assert.deepEqual(modules(actual), modules(direct));
      assert.ok(
        bytes.raw <= expected.raw + 256,
        `${mode} 引入了额外 JS：${bytes.raw - expected.raw} bytes`,
      );
      assert.ok(
        bytes.brotli <= expected.brotli + 128,
        `${mode} 引入了额外 brotli：${bytes.brotli - expected.brotli} bytes`,
      );
    }
  });
}
