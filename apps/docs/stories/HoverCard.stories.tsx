import {
  Avatar,
  Button,
  HoverCard,
  Progress,
  Tag,
  TagPair,
  type HoverCardProps,
} from "@endfield-ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactNode } from "react";
import { portrait } from "./_shared/Portraits";
import { RouterLink } from "./_shared/RouterLink";

const linkClass =
  "underline decoration-line-strong underline-offset-4 hover:decoration-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

/* 文案全部虚构 */
const meta = {
  title: "控件/HoverCard 悬浮卡",
  component: HoverCard,
  args: {
    side: "bottom",
    align: "start",
    delay: 600,
    closeDelay: 300,
    title: "三号管廊中继",
    description: "北段的第二个中继站，四人值守。",
    trigger: (
      <a href="#n-07" className={linkClass}>
        N-07 三号管廊中继
      </a>
    ),
    children: <Progress value={62} showValue aria-label="仓容" />,
  },
  argTypes: {
    side: {
      control: "inline-radio",
      options: ["top", "bottom", "left", "right"],
    },
    align: { control: "inline-radio", options: ["start", "center", "end"] },
    trigger: { control: false },
    children: { control: false },
  },
} satisfies Meta<typeof HoverCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = { name: "试一试" };

function StationCard({
  code,
  name,
  crew,
  load,
  side,
  children,
}: {
  code: string;
  name: string;
  crew: string;
  load: number;
  side?: HoverCardProps["side"];
  children?: ReactNode;
}) {
  return (
    <HoverCard
      side={side}
      trigger={
        <a href={`#${code}`} className={linkClass}>
          {children ?? name}
        </a>
      }
      title={name}
      description={`${crew}值守。`}
    >
      <div className="flex flex-wrap gap-2">
        <TagPair name="编号" value={code} size="sm" />
        <TagPair name="在途" value={`${Math.round(load / 10)} 批`} size="sm" />
      </div>
      <Progress value={load} showValue aria-label="仓容" />
    </HoverCard>
  );
}

/* 正文里的链接：停一下才出来，扫过去不会一路弹 */
export const InText: Story = {
  name: "正文里的链接",
  parameters: { controls: { disable: true } },
  render: () => (
    <p className="max-w-prose leading-relaxed">
      本周的补给从
      <StationCard code="N-01" name="北区仓储站" crew="六人" load={84} />
      发出，经
      <StationCard code="N-07" name="三号管廊中继" crew="四人" load={62} />
      转运，周五前送到
      <StationCard code="E-05" name="第三岩层营地" crew="三人" load={35} />。
    </p>
  ),
};

/*
 * 一列链接：卡片出在侧面。出在下面的话它会盖住下一行的链接，
 * 指针往下移的时候先进了卡片，下面那几个就悬停不到了
 */
export const List: Story = {
  name: "一列链接",
  parameters: { controls: { disable: true } },
  render: () => (
    <ul className="flex w-64 flex-col divide-y divide-line border-y border-line">
      {(
        [
          ["N-01", "北区仓储站", "六人", 84],
          ["N-07", "三号管廊中继", "四人", 62],
          ["E-02", "东线补给点", "两人", 48],
          ["E-05", "第三岩层营地", "三人", 35],
        ] as const
      ).map(([code, name, crew, load]) => (
        <li key={code} className="flex items-center justify-between py-2.5">
          <StationCard
            code={code}
            name={name}
            crew={crew}
            load={load}
            side="right"
          />
          <span className="font-tech text-xs text-ink-secondary">{code}</span>
        </li>
      ))}
    </ul>
  ),
};

/* 卡片里可以放别的展示控件：头像、标签、进度 */
export const Person: Story = {
  name: "一个人的概况",
  parameters: { controls: { disable: true } },
  render: () => (
    <p>
      今天的夜班由
      <HoverCard
        trigger={
          <a href="#crew-ye" className={linkClass}>
            叶舟
          </a>
        }
        className="w-64"
      >
        <div className="flex items-center gap-3">
          <Avatar src={portrait(2)} name="叶舟" alt="" size="lg" />
          <div className="flex min-w-0 flex-col gap-1">
            <span className="text-base font-bold">叶舟</span>
            <span className="text-ink-secondary">测绘员 · 第七勘探队</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Tag size="sm">夜班</Tag>
          <Tag size="sm">三号管廊</Tag>
        </div>
      </HoverCard>
      值守。
    </p>
  ),
};

/* 触发元素只要是链接就行：带 href 的按钮、路由库的链接组件都可以 */
export const Triggers: Story = {
  name: "别的触发元素",
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-wrap items-center gap-8">
      <HoverCard
        trigger={
          <Button variant="text" href="#report">
            查看周报
          </Button>
        }
        title="第 41 周周报"
        description="测绘 14 幅，补给 3 批，延误 1 批。"
      />
      <HoverCard
        trigger={
          <RouterLink to="archive" className={linkClass}>
            路由库的链接
          </RouterLink>
        }
        title="档案"
        description="按站点和月份归档的现场记录。"
      />
    </div>
  ),
};

export const Sides: Story = {
  name: "四个方向",
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-wrap items-center justify-center gap-10 py-24">
      {(["top", "bottom", "left", "right"] as const).map((side) => (
        <HoverCard
          key={side}
          side={side}
          align="center"
          trigger={
            <a href={`#${side}`} className={linkClass}>
              {side}
            </a>
          }
          title="三号管廊中继"
          description="放不下时会翻到对面。"
        />
      ))}
    </div>
  ),
};

/* 暗色版块里的链接：卡片挂在 body 下，也跟着是暗色的 */
export const LocalTheme: Story = {
  name: "暗色版块里",
  parameters: { controls: { disable: true } },
  render: () => (
    <div data-theme="dark" className="bg-surface p-6 text-ink">
      下一站：
      <StationCard code="E-05" name="第三岩层营地" crew="三人" load={35} />
    </div>
  ),
};

export const Narrow: Story = {
  name: "窄容器",
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="w-56 border border-dashed border-line-strong p-3">
      <p>
        本周的补给经
        <StationCard code="N-07" name="三号管廊中继" crew="四人" load={62} />
        转运。
      </p>
    </div>
  ),
};
