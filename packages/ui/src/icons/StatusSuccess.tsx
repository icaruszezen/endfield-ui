import { createIcon } from "./createIcon";

/** 圆 + 对勾：成功 */
export const StatusSuccess = createIcon(
  "StatusSuccess",
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M7.5 12.5l3 3 6-7" />
  </>,
);
