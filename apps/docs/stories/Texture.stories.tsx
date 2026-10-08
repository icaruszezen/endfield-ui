import { BracketTitle, EmptyState, Texture } from "@endfield-ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  title: "母题/Texture 底纹",
  component: Texture,
  args: { variant: "dots" },
  argTypes: {
    variant: {
      control: "inline-radio",
      options: ["dots", "grid", "contour"],
    },
  },
} satisfies Meta<typeof Texture>;

export default meta;
type Story = StoryObj<typeof meta>;

const frame =
  "relative h-56 max-w-xl overflow-clip border border-line bg-surface-raised";

export const Playground: Story = {
  render: (args) => (
    <div className={frame}>
      <Texture {...args} />
    </div>
  ),
};

export const Variants: Story = {
  name: "三种",
  render: () => (
    <div className="grid max-w-xl gap-6">
      {(
        [
          ["dots", "点阵：印刷网点。弹窗、卡片、面板的底"],
          ["grid", "工程网格：图纸与坐标。图解、工作台的背景"],
          ["contour", "等高线：测绘与地形。偏在一角，被边缘截断"],
        ] as const
      ).map(([variant, caption]) => (
        <figure key={variant}>
          <div className="relative h-40 overflow-clip border border-line bg-surface-raised">
            <Texture variant={variant} />
          </div>
          <figcaption className="mt-1 text-xs text-ink-secondary">
            {caption}
          </figcaption>
        </figure>
      ))}
    </div>
  ),
};

export const UnderContent: Story = {
  name: "垫在内容下面",
  render: () => (
    // 底纹只在四周露出来，正文垫着一层实色
    <section className="relative max-w-xl overflow-clip border border-line bg-surface-raised p-4">
      <Texture />
      <div className="relative bg-surface-raised p-5">
        <BracketTitle className="text-2xl">北区仓储站</BracketTitle>
        <p className="mt-3 text-sm text-ink-secondary">
          文字下面垫一层实色，点阵不从字后面穿过去。
        </p>
      </div>
    </section>
  ),
};

export const EmptyBackground: Story = {
  name: "空状态的背景",
  render: () => (
    <div className="relative max-w-xl overflow-clip border border-line bg-surface">
      {/* 缩小后收在角上：曲线不从标题和说明后面穿过去 */}
      <Texture variant="contour" className="[--contour-size:11rem]" />
      <EmptyState
        className="relative"
        title="这片区域还没有测绘"
        description="派出勘探队之后，这里会出现地形与资源点。"
      />
    </div>
  ),
};

export const Tuned: Story = {
  name: "调间距与颜色",
  render: () => (
    <div className="grid max-w-xl gap-6 sm:grid-cols-2">
      <div className="relative h-40 overflow-clip border border-line bg-surface-raised">
        <Texture className="[--dot-gap:24px] [--dot-size:1.5px]" />
      </div>
      <div className="relative h-40 overflow-clip border border-line bg-surface-raised">
        <Texture variant="grid" className="[--grid-gap:40px]" />
      </div>
      <div className="relative h-40 overflow-clip border border-line bg-surface-raised sm:col-span-2">
        {/* 换到左下角：整层水平翻转，淡出的方向跟着翻 */}
        <Texture
          variant="contour"
          className="-scale-x-100 [--contour-size:20rem]"
        />
      </div>
    </div>
  ),
};
