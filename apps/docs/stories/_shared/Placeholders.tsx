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

/** 场景位：三层灰色的地形轮廓。`seed` 换一组轮廓，让一排卡片不至于一模一样。 */
export function ScenePlaceholder({ seed = 0 }: { seed?: number }) {
  const [far, mid, near] = sceneLayers[seed % sceneLayers.length]!;
  return (
    <svg
      viewBox="0 0 320 180"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <rect width="320" height="180" className="fill-neutral-200" />
      <path d={far} className="fill-neutral-300" />
      <path d={mid} className="fill-neutral-400" />
      <path d={near} className="fill-neutral-500" />
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
