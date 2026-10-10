/* 把构建好的 Storybook（一个静态目录）起在本机的一个随机端口上。 */
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { extname, join, normalize, sep } from "node:path";

const CONTENT_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
};

/*
 * 浏览器不肯连的端口：Fetch 规范的"坏端口"里 1024 以上的那些。系统的随机端口从 1024
 * 起分的机器上（有的 Windows 是这样）会分到它们——页面报 ERR_UNSAFE_PORT，
 * 这个文件里每一条检查都成了"页面没有渲染出来"
 */
const UNSAFE_PORTS = new Set([
  1719, 1720, 1723, 2049, 3659, 4045, 4190, 5060, 5061, 6000, 6566, 6665, 6666,
  6667, 6668, 6669, 6679, 6697, 10080,
]);

export async function serve(root: string) {
  const server = createServer((request, response) => {
    const pathname = decodeURIComponent(
      new URL(request.url ?? "/", "http://localhost").pathname,
    );
    let file = normalize(join(root, pathname));
    // 不让路径跑到目录外面去
    if (file !== root && !file.startsWith(root + sep)) {
      response.writeHead(403).end();
      return;
    }
    if (existsSync(file) && statSync(file).isDirectory()) {
      file = join(file, "index.html");
    }
    if (!existsSync(file)) {
      response.writeHead(404).end();
      return;
    }
    response.writeHead(200, {
      "content-type":
        CONTENT_TYPES[extname(file).toLowerCase()] ??
        "application/octet-stream",
    });
    createReadStream(file).pipe(response);
  });

  // 分到了浏览器不肯连的端口就放掉、再要一个
  let port: number;
  for (;;) {
    await new Promise<void>((resolve) =>
      server.listen(0, "127.0.0.1", resolve),
    );
    ({ port } = server.address() as AddressInfo);
    if (!UNSAFE_PORTS.has(port)) break;
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }

  return {
    url: `http://127.0.0.1:${port}`,
    close: () =>
      new Promise<void>((resolve) => {
        server.closeAllConnections();
        server.close(() => resolve());
      }),
  };
}
