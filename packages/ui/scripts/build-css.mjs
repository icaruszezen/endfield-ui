import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { compile, optimize } from "@tailwindcss/node";
import { Scanner } from "@tailwindcss/oxide";

const [input, output] = process.argv.slice(2).map((file) => resolve(file));
const compiler = await compile(await readFile(input, "utf8"), {
  base: dirname(input),
  from: input,
  onDependency() {},
});
const roots =
  compiler.root === "none"
    ? []
    : [
        {
          base: compiler.root?.base ?? process.cwd(),
          pattern: compiler.root?.pattern ?? "**/*",
          negated: false,
        },
      ];
const scanner = new Scanner({ sources: [...roots, ...compiler.sources] });
const css = compiler.build(scanner.scan());
await mkdir(dirname(output), { recursive: true });
await writeFile(output, optimize(css, { file: input, minify: true }).code);
