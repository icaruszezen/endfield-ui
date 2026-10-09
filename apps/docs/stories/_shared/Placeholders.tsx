/*
 * 演示用的原创占位图。预览站不放任何官方图像：
 * 场景位是两三层不同明度的灰色多边形，图片位是一个带对角线的矩形。
 * 颜色有意不随主题变——真实的图片也不会跟着主题换色。
 */

const sceneLayers = [
  // 每一组：远、中、近三层的轮廓
  [
    "M0 132 78 84l46 30 62-58 74 62 60-34v136H0z",
    "M0 164 96 120l70 36 84-52 70 44v72H0z",
    "M0 196 120 168l88 20 112-36v68H0z",
  ],
  [
    "M0 108 52 70l70 52 58-36 80 60 60-48v154H0z",
    "M0 150 70 132l92 44 66-30 92 22v80H0z",
    "M0 186 150 196l170-40v72H0z",
  ],
  [
    "M0 96 110 58l64 66 70-40 76 52v130H0z",
    "M0 142 60 160l110-46 150 60v70H0z",
    "M0 204 96 176l120 26 104-18v54H0z",
  ],
] as const;

const sceneTone = {
  light: [
    "fill-neutral-200",
    "fill-neutral-300",
    "fill-neutral-400",
    "fill-neutral-500",
  ],
  // 深色画面：演示压在图像上的叠层（取景角、录制指示）
  dark: [
    "fill-neutral-950",
    "fill-neutral-850",
    "fill-neutral-800",
    "fill-neutral-700",
  ],
} as const;

/**
 * 场景位：三层灰色的地形轮廓。`seed` 换一组轮廓，让一排卡片不至于一模一样；
 * `tone="dark"` 是一张深色的画面。
 */
export function ScenePlaceholder({
  seed = 0,
  tone = "light",
  className,
}: {
  seed?: number;
  tone?: keyof typeof sceneTone;
  className?: string;
}) {
  const [far, mid, near] = sceneLayers[seed % sceneLayers.length]!;
  const [sky, farFill, midFill, nearFill] = sceneTone[tone];
  return (
    <svg
      viewBox="0 0 320 180"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      className={className}
    >
      <rect width="320" height="180" className={sky} />
      <path d={far} className={farFill} />
      <path d={mid} className={midFill} />
      <path d={near} className={nearFill} />
    </svg>
  );
}

/** 图片位：带对角线的矩形，正中写着 IMAGE。 */
export function ImagePlaceholder() {
  return (
    <svg
      viewBox="0 0 320 180"
      preserveAspectRatio="none"
      aria-hidden="true"
      className="fill-none stroke-neutral-400"
    >
      <rect width="320" height="180" className="fill-neutral-200 stroke-none" />
      <path
        d="M0 0 320 180M320 0 0 180"
        strokeWidth={1}
        vectorEffect="non-scaling-stroke"
      />
      <rect
        x="124"
        y="76"
        width="72"
        height="28"
        className="fill-neutral-200 stroke-none"
      />
      <text
        x="160"
        y="95"
        textAnchor="middle"
        className="fill-neutral-600 stroke-none font-tech text-xs"
      >
        IMAGE
      </text>
    </svg>
  );
}

/* 有自己尺寸的占位图，给"图要按原比例整张显示"的地方用（图片查看） */
const photoFrames = {
  // 横幅 4:3、竖幅 3:4、宽幅 21:9
  landscape: [1200, 900],
  portrait: [900, 1200],
  wide: [1680, 720],
} as const;

const photoTones = [
  ["#d9d9d9", "#b3b3b3", "#8a8a8a", "#626262"],
  ["#383838", "#484848", "#626262", "#8a8a8a"],
  ["#e6e6e6", "#b3b3b3", "#626262", "#383838"],
] as const;

/**
 * 第 `seed` 张占位照片，输出成 data URI，直接当 `<img src>` 用。
 * 和场景位是同一种三层地形，但它是一张真的图片：有固有的宽高，
 * 颜色写死——真实的照片也不会跟着主题换色。
 */
export function photo(
  seed: number,
  frame: keyof typeof photoFrames = "landscape",
): string {
  const [width, height] = photoFrames[frame];
  const [sky, far, mid, near] = photoTones[seed % photoTones.length]!;
  // 三条山脊的起伏各错开一点，免得一组图一模一样
  const ridge = (base: number, swing: number, shift: number) => {
    const points = Array.from({ length: 7 }, (_, step) => {
      const x = (width / 6) * step;
      const y =
        height * base +
        Math.sin(step * 1.7 + seed * 1.3 + shift) * height * swing;
      return `${x.toFixed(0)} ${y.toFixed(0)}`;
    });
    return `M0 ${height} L${points.join(" L")} L${width} ${height}z`;
  };
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    `<path d="M0 0h${width}v${height}H0z" fill="${sky}"/>`,
    `<path d="${ridge(0.5, 0.1, 0)}" fill="${far}"/>`,
    `<path d="${ridge(0.66, 0.08, 2)}" fill="${mid}"/>`,
    `<path d="${ridge(0.82, 0.06, 4)}" fill="${near}"/>`,
    // 右上角一个小方块当"太阳"：看得出图有没有被裁掉一角
    `<path d="M${width - 140} 60h80v80h-80z" fill="${near}"/>`,
    `</svg>`,
  ].join("");
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
