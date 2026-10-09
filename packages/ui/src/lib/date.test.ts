import { afterEach, describe, expect, it, vi } from "vitest";
import {
  addDays,
  addMonths,
  addMonthsToMonth,
  clampDate,
  dateParts,
  dayOfWeek,
  daysBetween,
  daysInMonth,
  eachDay,
  isDate,
  isMonth,
  monthGrid,
  monthOf,
  startOfWeek,
  today,
} from "./date";

afterEach(() => {
  vi.useRealTimers();
});

describe("date", () => {
  it("isDate：格式要对，这一天也要真的存在", () => {
    expect(isDate("2026-10-09")).toBe(true);
    expect(isDate("2024-02-29")).toBe(true);
    expect(isDate("2026-02-29")).toBe(false);
    expect(isDate("2026-02-30")).toBe(false);
    expect(isDate("2026-13-01")).toBe(false);
    expect(isDate("2026-1-9")).toBe(false);
    expect(isDate("2026/10/09")).toBe(false);
    expect(isDate("")).toBe(false);
    expect(isDate(null)).toBe(false);
    expect(isDate(20261009)).toBe(false);
  });

  it("isMonth", () => {
    expect(isMonth("2026-10")).toBe(true);
    expect(isMonth("2026-13")).toBe(false);
    expect(isMonth("2026-00")).toBe(false);
    expect(isMonth("2026-10-09")).toBe(false);
  });

  it("today 取的是本地的日期", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 9, 23, 59));
    expect(today()).toBe("2026-10-09");
    vi.setSystemTime(new Date(2027, 0, 1, 0, 0));
    expect(today()).toBe("2027-01-01");
  });

  it("dateParts 与 monthOf", () => {
    expect(dateParts("2026-10-09")).toEqual({ year: 2026, month: 10, day: 9 });
    expect(monthOf("2026-10-09")).toBe("2026-10");
  });

  it("addDays：跨月、跨年、闰日", () => {
    expect(addDays("2026-10-09", 1)).toBe("2026-10-10");
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2027-01-01", -1)).toBe("2026-12-31");
    expect(addDays("2024-02-28", 1)).toBe("2024-02-29");
    expect(addDays("2026-02-28", 1)).toBe("2026-03-01");
    expect(addDays("2026-10-09", 0)).toBe("2026-10-09");
    expect(addDays("2026-10-09", 365)).toBe("2027-10-09");
  });

  it("addDays 不受夏令时影响：一天就是一天", () => {
    // 这两天在有夏令时的时区里分别只有 23 和 25 个小时
    expect(addDays("2026-03-08", 1)).toBe("2026-03-09");
    expect(addDays("2026-11-01", 1)).toBe("2026-11-02");
    expect(daysBetween("2026-03-01", "2026-03-31")).toBe(30);
  });

  it("daysInMonth：闰年的二月", () => {
    expect(daysInMonth(2026, 2)).toBe(28);
    expect(daysInMonth(2024, 2)).toBe(29);
    expect(daysInMonth(2100, 2)).toBe(28);
    expect(daysInMonth(2000, 2)).toBe(29);
    expect(daysInMonth(2026, 4)).toBe(30);
    expect(daysInMonth(2026, 12)).toBe(31);
  });

  it("addMonths：那个月没有这一天就落在月末", () => {
    expect(addMonths("2026-10-09", 1)).toBe("2026-11-09");
    expect(addMonths("2026-01-31", 1)).toBe("2026-02-28");
    expect(addMonths("2024-01-31", 1)).toBe("2024-02-29");
    expect(addMonths("2026-03-31", -1)).toBe("2026-02-28");
    expect(addMonths("2026-12-15", 1)).toBe("2027-01-15");
    expect(addMonths("2026-01-15", -1)).toBe("2025-12-15");
    expect(addMonths("2026-10-09", 12)).toBe("2027-10-09");
    expect(addMonths("2024-02-29", 12)).toBe("2025-02-28");
    expect(addMonths("2026-10-09", -22)).toBe("2024-12-09");
  });

  it("addMonthsToMonth", () => {
    expect(addMonthsToMonth("2026-12", 1)).toBe("2027-01");
    expect(addMonthsToMonth("2026-01", -1)).toBe("2025-12");
    expect(addMonthsToMonth("2026-10", 0)).toBe("2026-10");
  });

  it("daysBetween：往后是正，往前是负", () => {
    expect(daysBetween("2026-10-01", "2026-10-09")).toBe(8);
    expect(daysBetween("2026-10-09", "2026-10-01")).toBe(-8);
    expect(daysBetween("2026-10-09", "2026-10-09")).toBe(0);
    expect(daysBetween("2026-12-31", "2027-01-01")).toBe(1);
  });

  it("dayOfWeek：0 是星期日", () => {
    expect(dayOfWeek("2026-10-09")).toBe(5);
    expect(dayOfWeek("2026-10-11")).toBe(0);
    expect(dayOfWeek("2026-10-12")).toBe(1);
  });

  it("clampDate", () => {
    expect(clampDate("2026-10-09", "2026-10-01", "2026-10-31")).toBe(
      "2026-10-09",
    );
    expect(clampDate("2026-09-20", "2026-10-01", "2026-10-31")).toBe(
      "2026-10-01",
    );
    expect(clampDate("2026-11-20", "2026-10-01", "2026-10-31")).toBe(
      "2026-10-31",
    );
    expect(clampDate("2026-11-20")).toBe("2026-11-20");
    expect(clampDate("2026-11-20", undefined, "2026-10-31")).toBe("2026-10-31");
  });

  it("startOfWeek：从星期一起，或者从星期日起", () => {
    // 2026-10-09 是星期五
    expect(startOfWeek("2026-10-09")).toBe("2026-10-05");
    expect(startOfWeek("2026-10-09", 0)).toBe("2026-10-04");
    expect(startOfWeek("2026-10-05")).toBe("2026-10-05");
    // 星期日：从星期一起算时它是这一周的最后一天
    expect(startOfWeek("2026-10-11")).toBe("2026-10-05");
    expect(startOfWeek("2026-10-11", 0)).toBe("2026-10-11");
  });

  it("monthGrid：固定六行七列，前后用相邻月份补齐", () => {
    const grid = monthGrid("2026-10");
    expect(grid).toHaveLength(6);
    expect(grid.every((week) => week.length === 7)).toBe(true);
    // 2026-10-01 是星期四：从星期一起的话，第一行从 9 月 28 日开始
    expect(grid[0]).toEqual([
      "2026-09-28",
      "2026-09-29",
      "2026-09-30",
      "2026-10-01",
      "2026-10-02",
      "2026-10-03",
      "2026-10-04",
    ]);
    expect(grid[5]![6]).toBe("2026-11-08");
    expect(
      grid.flat().filter((date) => monthOf(date) === "2026-10"),
    ).toHaveLength(31);
    expect(monthGrid("2026-10", 0)[0]![0]).toBe("2026-09-27");
  });

  it("monthGrid：一号正好是一周的第一天时，第一行就是这个月", () => {
    // 2026-06-01 是星期一
    expect(monthGrid("2026-06")[0]![0]).toBe("2026-06-01");
    // 2026-02 有 28 天，从星期日起正好四行：后两行是三月
    const february = monthGrid("2026-02", 0);
    expect(february[0]![0]).toBe("2026-02-01");
    expect(february[4]![0]).toBe("2026-03-01");
  });

  it("eachDay：两头都包含", () => {
    expect(eachDay("2026-10-30", "2026-11-02")).toEqual([
      "2026-10-30",
      "2026-10-31",
      "2026-11-01",
      "2026-11-02",
    ]);
    expect(eachDay("2026-10-09", "2026-10-09")).toEqual(["2026-10-09"]);
    expect(eachDay("2026-10-09", "2026-10-01")).toEqual([]);
  });
});
