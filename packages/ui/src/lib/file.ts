/** 文件的纯函数：按 `accept` 认类型、把字节数写成人读的大小。`FileUpload` 用，不对外导出 */

/**
 * 这个文件合不合 `accept`。写法和原生的 `<input accept>` 一样，逗号分开：
 * `.pdf`（扩展名）、`image/*`（一类）、`text/plain`（一种）。不分大小写；没写就是都行。
 */
export function matchesAccept(
  file: { name: string; type: string },
  accept: string | undefined,
): boolean {
  const rules = (accept ?? "")
    .split(",")
    .map((rule) => rule.trim().toLowerCase())
    .filter(Boolean);
  if (rules.length === 0) return true;

  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return rules.some((rule) => {
    if (rule.startsWith(".")) return name.endsWith(rule);
    if (rule.endsWith("/*")) return type.startsWith(rule.slice(0, -1));
    return type === rule;
  });
}

const UNITS = ["B", "KB", "MB", "GB", "TB"];

/**
 * 字节数写成 `1.2 MB`：按 1024 进位；不到 100 的留一位小数（`.0` 不写），再大就取整。
 * 字节不带小数。
 */
export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "";
  let value = bytes;
  let unit = 0;
  const round = () =>
    unit === 0 || value >= 100
      ? Math.round(value)
      : Math.round(value * 10) / 10;

  while (unit < UNITS.length - 1 && round() >= 1024) {
    value /= 1024;
    unit += 1;
  }
  return `${round()} ${UNITS[unit]}`;
}

/** 扩展名，大写、不带点：`report.final.PDF` → `PDF`。没有、或者长得不像扩展名时是空的 */
export function fileExtension(name: string): string {
  const dot = name.lastIndexOf(".");
  if (dot <= 0 || dot === name.length - 1) return "";
  const extension = name.slice(dot + 1);
  return /^[a-z0-9]{1,5}$/i.test(extension) ? extension.toUpperCase() : "";
}

/** 是不是同一个文件：名字、大小、修改时间都一样 */
export function sameFile(a: File, b: File): boolean {
  return (
    a.name === b.name && a.size === b.size && a.lastModified === b.lastModified
  );
}
