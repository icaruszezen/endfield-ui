import { createIcon } from "./createIcon";

/**
 * 日历：日期字段右侧的记号。
 * 名字带 `Icon` 是因为 `Calendar` 已经是月历控件了
 */
export const CalendarIcon = createIcon(
  "CalendarIcon",
  <path d="M4 6h16v14H4zM4 11h16M8 3v5M16 3v5" />,
);
