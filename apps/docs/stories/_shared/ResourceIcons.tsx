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

/* 展开条里用的几个：分享与它的几个去处 */
export const ShareIcon = createIcon(
  "ShareIcon",
  <path d="M5 10h4v4H5zM15 4h4v4h-4zM15 16h4v4h-4zM9 11l6-4M9 13l6 4" />,
);

export const LinkIcon = createIcon(
  "LinkIcon",
  <path d="M10 8H4v8h6M14 8h6v8h-6M8 12h8" />,
);

export const MailIcon = createIcon(
  "MailIcon",
  <path d="M3 6h18v12H3zM3 7l9 7 9-7" />,
);

export const PrintIcon = createIcon(
  "PrintIcon",
  <path d="M7 9V4h10v5M7 17H4V9h16v8h-3M7 14h10v6H7z" />,
);

export const CodeGridIcon = createIcon(
  "CodeGridIcon",
  <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 14h2v2h-2zM14 18h2v2h-2zM18 18h2v2h-2z" />,
);
