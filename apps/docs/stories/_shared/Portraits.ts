/*
 * 演示用的原创头像：一个通用的半身剪影，肩上叠一个几何记号。
 * 不对应任何人，也不取自任何官方图像。输出成 data URI，直接当 `src` 用。
 * 颜色写死：真实的照片也不会跟着主题换色。
 */

const tones = [
  { sky: "#d9d9d9", body: "#626262", mark: "#fffa00" },
  { sky: "#b3b3b3", body: "#383838", mark: "#fafafa" },
  { sky: "#e6e6e6", body: "#8a8a8a", mark: "#191919" },
  { sky: "#8a8a8a", body: "#282828", mark: "#fffa00" },
  { sky: "#f2f2f2", body: "#484848", mark: "#06a2a2" },
  { sky: "#626262", body: "#191919", mark: "#fc6c00" },
] as const;

/* 肩上的记号：三角、方块、菱形、横杠 */
const marks = [
  (fill: string) => `<path d="M40 64 48 50 56 64z" fill="${fill}"/>`,
  (fill: string) => `<path d="M42 54h12v10H42z" fill="${fill}"/>`,
  (fill: string) => `<path d="M48 50 55 58 48 66 41 58z" fill="${fill}"/>`,
  (fill: string) => `<path d="M38 56h20v4H38z" fill="${fill}"/>`,
] as const;

/** 第 `seed` 张头像。同一个 seed 永远是同一张 */
export function portrait(seed: number): string {
  const tone = tones[seed % tones.length]!;
  const mark = marks[seed % marks.length]!;
  // 头的位置和肩宽各偏一点，免得一排头像一模一样
  const head = 46 + (seed % 3) * 2;
  const shoulder = 14 + (seed % 4) * 2;
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">`,
    `<path d="M0 0h96v96H0z" fill="${tone.sky}"/>`,
    `<path d="M${shoulder} 96 ${shoulder + 10} 62h${76 - shoulder * 2}l10 34z" fill="${tone.body}"/>`,
    `<circle cx="${head}" cy="38" r="17" fill="${tone.body}"/>`,
    mark(tone.mark),
    `</svg>`,
  ].join("");
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/* 虚构的人名：头像、头像切换和内容页共用 */
export const crew = [
  { value: "chen", label: "陈知远", role: "值班调度", src: portrait(0) },
  { value: "lin", label: "林澈", role: "线路测绘", src: portrait(1) },
  { value: "mira", label: "Mira Kessel", role: "设备维护", src: portrait(2) },
  { value: "su", label: "苏禾", role: "物资清点", src: portrait(3) },
  { value: "odile", label: "Odile", role: "外勤联络", src: portrait(4) },
  { value: "tang", label: "唐砚", role: "夜班值守", src: portrait(5) },
];
