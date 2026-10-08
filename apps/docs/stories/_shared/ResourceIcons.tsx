import { createIcon } from "@endfield-ui/react";

/* 演示用的原创资源图标：简单的几何形，不对应任何官方素材 */

export const FuelIcon = createIcon(
  "FuelIcon",
  <path d="M12 3l8 9-8 9-8-9z" fill="currentColor" stroke="none" />,
);

export const OreIcon = createIcon(
  "OreIcon",
  <path d="M7 4h10l5 8-5 8H7l-5-8z" fill="currentColor" stroke="none" />,
);

export const CrateIcon = createIcon(
  "CrateIcon",
  <path d="M4 4h16v16H4zM4 12h16" strokeWidth={3} />,
);

/* "更多"：三个小方块，菜单触发按钮上用 */
export const MoreIcon = createIcon(
  "MoreIcon",
  <path
    d="M4 10.5h3v3H4zM10.5 10.5h3v3h-3zM17 10.5h3v3h-3z"
    fill="currentColor"
    stroke="none"
  />,
);
