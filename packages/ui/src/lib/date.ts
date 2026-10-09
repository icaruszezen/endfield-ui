/*
 * 日期的纯函数。日期一律是 `YYYY-MM-DD` 的字符串：没有时间，也没有时区
 * （和原生 `<input type="date">` 的值是同一种写法）。月份是 `YYYY-MM`。
 *
 * 全部按 UTC 算：本地时区和夏令时会让"加一天"偶尔变成加 23 或 25 小时，
 * 落到前一天或后一天上。只有"今天是几号"要问本地时间。
 */

const DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MONTH = /^(\d{4})-(\d{2})$/;
const DAY_MS = 86_400_000;

const pad = (value: number, length = 2) => String(value).padStart(length, "0");

const toUTC = (date: string) => {
  const match = DATE.exec(date);
  if (!match) return Number.NaN;
  return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
};

const fromUTC = (time: number) => {
  const date = new Date(time);
  return `${pad(date.getUTCFullYear(), 4)}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
};

/** 是不是一个真的日期：格式对，而且这一天存在（`2026-02-30` 不算） */
export function isDate(value: unknown): value is string {
  return typeof value === "string" && fromUTC(toUTC(value)) === value;
}

/** 今天，按本地时间 */
export function today(): string {
  const now = new Date();
  return `${pad(now.getFullYear(), 4)}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** 拆成年、月（1 – 12）、日 */
export function dateParts(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return { year: year!, month: month!, day: day! };
}

export function addDays(date: string, days: number): string {
  return fromUTC(toUTC(date) + days * DAY_MS);
}

/** 这个月有几天 */
export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** 加减月份。那个月没有这一天就落在月末：1 月 31 日加一个月是 2 月 28 日 */
export function addMonths(date: string, months: number): string {
  const { year, month, day } = dateParts(date);
  const index = year * 12 + (month - 1) + months;
  const nextYear = Math.floor(index / 12);
  const nextMonth = (index % 12) + 1;
  return `${pad(nextYear, 4)}-${pad(nextMonth)}-${pad(Math.min(day, daysInMonth(nextYear, nextMonth)))}`;
}

/** 从 `from` 到 `to` 隔了几天；`to` 在前时是负数 */
export function daysBetween(from: string, to: string): number {
  return Math.round((toUTC(to) - toUTC(from)) / DAY_MS);
}

/** 星期几：0 是星期日，6 是星期六 */
export function dayOfWeek(date: string): number {
  return new Date(toUTC(date)).getUTCDay();
}

/** 夹到 `min` 和 `max` 之间。同一种写法的日期可以直接按字符串比大小 */
export function clampDate(date: string, min?: string, max?: string): string {
  if (min && date < min) return min;
  if (max && date > max) return max;
  return date;
}

/** 这个日期所在的月份，`YYYY-MM` */
export function monthOf(date: string): string {
  return date.slice(0, 7);
}

export function isMonth(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const match = MONTH.exec(value);
  return !!match && Number(match[2]) >= 1 && Number(match[2]) <= 12;
}

export function addMonthsToMonth(month: string, months: number): string {
  return monthOf(addMonths(`${month}-01`, months));
}

/** 这一周的第一天。`weekStartsOn`：0 是从星期日起，1 是从星期一起 */
export function startOfWeek(date: string, weekStartsOn: 0 | 1 = 1): string {
  return addDays(date, -((dayOfWeek(date) - weekStartsOn + 7) % 7));
}

/**
 * 一个月的月历：固定六行七列，前后用相邻月份的日子补齐。
 * 固定六行是为了翻月时高度不跳
 */
export function monthGrid(month: string, weekStartsOn: 0 | 1 = 1): string[][] {
  const first = startOfWeek(`${month}-01`, weekStartsOn);
  return Array.from({ length: 6 }, (_, week) =>
    Array.from({ length: 7 }, (_, day) => addDays(first, week * 7 + day)),
  );
}

/** 从 `start` 到 `end`（都包含）的每一天 */
export function eachDay(start: string, end: string): string[] {
  const count = daysBetween(start, end) + 1;
  return Array.from({ length: Math.max(0, count) }, (_, offset) =>
    addDays(start, offset),
  );
}

/** 交给 `Intl.DateTimeFormat` 用的 `Date`。格式化时要带 `timeZone: "UTC"` */
export function toDateObject(date: string): Date {
  return new Date(toUTC(date));
}
