import { Button, ImageViewer, ImageViewerItem } from "@endfield-ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { photo } from "./_shared/Placeholders";

/* 文案全部虚构；图是原创的灰色占位图，有横幅、竖幅、宽幅三种 */
const shots = [
  {
    title: "三号管廊入口",
    description: "北段复测当天拍的。闸门左侧的信标是这次新装的。",
    frame: "landscape",
  },
  {
    title: "信标 B-12",
    description: "竖着拍的一张：信标装在管壁的高处，要仰着看。",
    frame: "portrait",
  },
  {
    title: "第三岩层营地全景",
    description: "营地在一段废弃的输料管廊上方，从东线补给点望过去。",
    frame: "wide",
  },
  {
    title: "滤芯入库",
    description: "十二件，分两箱。",
    frame: "landscape",
  },
  {
    title: "夜班交接",
    description: "交接单贴在终端旁边，没做完的事写在最下面一栏。",
    frame: "portrait",
  },
] as const;

const items = (count: number = shots.length) =>
  shots.slice(0, count).map((shot, index) => (
    <ImageViewerItem
      key={shot.title}
      title={shot.title}
      description={shot.description}
    >
      <img src={photo(index, shot.frame)} alt="" />
    </ImageViewerItem>
  ));

const meta = {
  title: "控件/ImageViewer 图片查看",
  component: ImageViewer,
  args: {
    "aria-label": "现场照片",
    ratio: "4/3",
    loop: false,
    children: items(),
    className: "max-w-xl",
  },
  argTypes: {
    ratio: {
      control: "inline-radio",
      options: ["16/9", "4/3", "1/1", "3/4"],
    },
    children: { control: false },
    open: { control: false },
    index: { control: false },
  },
} satisfies Meta<typeof ImageViewer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = { name: "试一试" };

/* 只有一张：没有翻页钮和计数，就是"点开看大图" */
export const Single: Story = {
  name: "只有一张",
  parameters: { controls: { disable: true } },
  render: () => (
    <ImageViewer aria-label="管廊入口的照片" className="max-w-48">
      {items(1)}
    </ImageViewer>
  ),
};

/* 缩略图的宽高比四档；大图不受它影响，永远按原比例整张显示 */
export const Ratios: Story = {
  name: "缩略图的宽高比",
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex max-w-xl flex-col gap-6">
      <ImageViewer aria-label="方形的缩略图" ratio="1/1">
        {items(4)}
      </ImageViewer>
      <ImageViewer aria-label="宽幅的缩略图" ratio="16/9">
        {items(4)}
      </ImageViewer>
    </div>
  ),
};

/* 缩略图怎么排由使用方定：className 落在那个列表上 */
export const OwnLayout: Story = {
  name: "自己排缩略图",
  parameters: { controls: { disable: true } },
  render: () => (
    <ImageViewer
      aria-label="现场照片"
      ratio="1/1"
      className="flex max-w-md gap-1 *:w-16"
    >
      {items()}
    </ImageViewer>
  ),
};

/* 缩略图另给一张小的；没有标题的那几张，按钮的名称报的是第几张 */
export const Thumbnails: Story = {
  name: "另给小图，不带标题",
  parameters: { controls: { disable: true } },
  render: () => (
    <ImageViewer aria-label="测绘图" className="max-w-sm">
      {[0, 1, 2].map((seed) => (
        <ImageViewerItem
          key={seed}
          thumbnail={<img src={photo(seed + 1, "landscape")} alt="" />}
        >
          <img src={photo(seed, "wide")} alt={`测绘图第 ${seed + 14} 幅`} />
        </ImageViewerItem>
      ))}
    </ImageViewer>
  ),
};

export const Loop: Story = {
  name: "首尾相接",
  parameters: { controls: { disable: true } },
  render: () => (
    <ImageViewer aria-label="现场照片" loop className="max-w-md">
      {items(3)}
    </ImageViewer>
  ),
};

/* 开没开、开在第几张都可以由外面决定：比如从地址里的参数恢复 */
function ControlledExample() {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  return (
    <div className="flex max-w-md flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          size="sm"
          onClick={() => {
            setIndex(2);
            setOpen(true);
          }}
        >
          直接看第三张
        </Button>
        <p role="status" className="font-tech text-sm text-ink-secondary">
          {`// ${open ? "开着" : "关着"}，第 ${index + 1} 张`}
        </p>
      </div>
      <ImageViewer
        aria-label="现场照片"
        open={open}
        onOpenChange={setOpen}
        index={index}
        onIndexChange={setIndex}
      >
        {items(4)}
      </ImageViewer>
    </div>
  );
}

export const Controlled: Story = {
  name: "受控",
  parameters: { controls: { disable: true } },
  render: () => <ControlledExample />,
};

export const Narrow: Story = {
  name: "窄容器",
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="w-56 border border-dashed border-line-strong p-3">
      <ImageViewer aria-label="现场照片">{items()}</ImageViewer>
    </div>
  ),
};
