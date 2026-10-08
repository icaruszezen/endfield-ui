import { MediaCard, Tag } from "@endfield-ui/react";
import type { Decorator, Meta, StoryObj } from "@storybook/react-vite";
import { ImagePlaceholder, ScenePlaceholder } from "./_shared/Placeholders";

const meta = {
  title: "控件/MediaCard 媒体卡",
  component: MediaCard,
  args: {
    media: <ScenePlaceholder />,
    title: "第七勘探区的首批测绘数据已归档",
    category: "新闻",
    date: "2026.10.08",
    href: "#",
  },
  argTypes: {
    media: { control: false },
    tag: { control: false },
    ratio: {
      control: "inline-radio",
      options: ["16/9", "4/3", "1/1", "3/4"],
    },
  },
} satisfies Meta<typeof MediaCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const narrow: Decorator = (Story) => (
  <div className="max-w-xs">
    <Story />
  </div>
);

export const Playground: Story = { decorators: [narrow] };

export const WithTag: Story = {
  name: "带类型标签",
  decorators: [narrow],
  args: {
    tag: <Tag size="sm">PV</Tag>,
    category: "影像",
    title: "秋季勘探计划 · 预告",
  },
};

export const Static: Story = {
  name: "静态（不可点）",
  decorators: [narrow],
  args: { href: undefined, media: <ImagePlaceholder /> },
};

export const Ratios: Story = {
  name: "宽高比",
  render: () => (
    <div className="grid max-w-3xl grid-cols-2 items-start gap-6 sm:grid-cols-4">
      {(["16/9", "4/3", "1/1", "3/4"] as const).map((ratio, seed) => (
        <MediaCard
          key={ratio}
          ratio={ratio}
          media={<ScenePlaceholder seed={seed} />}
          title={ratio}
          category="比例"
        />
      ))}
    </div>
  ),
};

const news = [
  ["第七勘探区的首批测绘数据已归档", "新闻", "2026.10.08"],
  ["补给站扩建工程进入第二阶段", "新闻", "2026.10.05"],
  ["秋季勘探计划公开征集路线建议，截止日期顺延一周", "公告", "2026.09.28"],
] as const;

export const Grid: Story = {
  name: "一组卡片",
  render: () => (
    <div className="@container max-w-3xl">
      <div className="grid gap-x-6 gap-y-8 @md:grid-cols-3">
        {news.map(([title, category, date], seed) => (
          <MediaCard
            key={title}
            href="#"
            media={<ScenePlaceholder seed={seed} />}
            title={title}
            category={category}
            date={date}
          />
        ))}
      </div>
    </div>
  ),
};
