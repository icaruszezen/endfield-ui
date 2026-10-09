import { Button, Carousel, CarouselSlide } from "@endfield-ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { ScenePlaceholder } from "./_shared/Placeholders";

/* 文案全部虚构；画面是原创的灰色占位图，不是任何游戏的截图 */
const scenes = [
  {
    title: "线路测绘",
    description:
      "沿着管廊布设信标，把走过的每一段记进图里。没测过的地方在图上是一片斜纹。",
  },
  {
    title: "物资调度",
    description: "把批次派往各个站点；延误超过两小时的会自动上报给值班调度。",
  },
  {
    title: "站点维护",
    description: "滤芯、电池、信标都有寿命。到期前三天，站点会出现在待办里。",
  },
  {
    title: "夜间值守",
    description:
      "深色的画面：翻页钮的白底有意不随主题变，压在哪种图上都看得见。",
    tone: "dark" as const,
  },
  {
    title: "档案归集",
    description: "到站满三十天的批次进档案，按站点和月份分开存放。",
  },
];

const slides = scenes.map((scene, position) => (
  <CarouselSlide
    key={scene.title}
    title={scene.title}
    description={scene.description}
  >
    <ScenePlaceholder seed={position} tone={scene.tone} />
  </CarouselSlide>
));

const meta = {
  title: "控件/Carousel 媒体轮播",
  component: Carousel,
  args: {
    "aria-label": "玩法介绍",
    loop: false,
    ratio: "16/9",
    indicator: false,
    children: slides,
  },
  argTypes: {
    ratio: {
      control: "inline-radio",
      options: ["16/9", "4/3", "1/1", "3/4", "21/9"],
    },
    index: { control: false },
    children: { control: false },
  },
  decorators: [
    (Story) => (
      <div className="max-w-2xl">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Carousel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Indicator: Story = {
  name: "带进度短横，首尾相接",
  args: { indicator: true, loop: true },
};

export const Wide: Story = {
  name: "宽幅",
  args: { ratio: "21/9", indicator: true },
};

/* 下标由外面拿着：别的控件也能翻它 */
export const Controlled: Story = {
  name: "受控",
  parameters: { controls: { disable: true } },
  render: function Render() {
    const [index, setIndex] = useState(1);
    return (
      <div className="flex flex-col gap-4">
        <Carousel aria-label="玩法介绍" index={index} onIndexChange={setIndex}>
          {slides}
        </Carousel>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="light" onClick={() => setIndex(0)}>
            回到第一张
          </Button>
          <Button
            size="sm"
            variant="light"
            onClick={() => setIndex(scenes.length - 1)}
          >
            跳到最后一张
          </Button>
        </div>
      </div>
    );
  },
};

/* 幻灯片里可以有能点的东西；不在眼前的那几张里的，Tab 走不进去 */
export const WithLinks: Story = {
  name: "幻灯片里有链接",
  parameters: { controls: { disable: true } },
  render: () => (
    <Carousel aria-label="站点介绍">
      {scenes.slice(0, 3).map((scene, position) => (
        <CarouselSlide
          key={scene.title}
          title={scene.title}
          description={scene.description}
        >
          <ScenePlaceholder seed={position} />
          <a
            href={`#scene-${position + 1}`}
            className="absolute! top-3 right-3 size-auto! bg-surface px-3 py-1.5 text-sm font-medium text-ink underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            {`了解${scene.title}`}
          </a>
        </CarouselSlide>
      ))}
    </Carousel>
  ),
};
