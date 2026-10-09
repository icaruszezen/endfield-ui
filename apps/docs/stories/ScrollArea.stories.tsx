import {
  BackToTop,
  List,
  ListRow,
  Panel,
  PanelHeader,
  ScrollArea,
  Tag,
  Texture,
  Timeline,
  TimelineItem,
} from "@endfield-ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useRef } from "react";

/* 文案全部虚构 */
const meta = {
  title: "控件/ScrollArea 滚动区",
  component: ScrollArea,
  args: { "aria-label": "值守日志", orientation: "vertical" },
  argTypes: {
    orientation: {
      control: "inline-radio",
      options: ["vertical", "horizontal", "both"],
    },
    viewportRef: { control: false },
    children: { control: false },
  },
} satisfies Meta<typeof ScrollArea>;

export default meta;
type Story = StoryObj<typeof meta>;

const entries = [
  "三号管廊北段复测完成",
  "补给车 TR-2041 到站",
  "信标 B-12 电量低，已更换",
  "第三岩层采样 6 处",
  "终端例行自检通过",
  "夜班交接，无遗留",
  "二号线限行解除",
  "滤芯入库 12 件",
  "测绘图第 14 幅归档",
  "气象站读数回传中断 4 分钟",
  "备用电源切换演练",
  "管廊南口照明检修",
  "早班交接，遗留 1 项",
  "补给申请已提交",
  "第七勘探区巡检",
  "通信中继重启",
];

function Log({ count = entries.length }: { count?: number }) {
  return (
    <ol className="flex flex-col text-sm">
      {entries.slice(0, count).map((entry, index) => (
        <li
          key={entry}
          className="flex items-baseline gap-3 border-b border-line py-2 last:border-b-0"
        >
          <span className="font-tech text-xs text-ink-secondary tabular-nums">
            {`${String(6 + Math.floor(index / 2)).padStart(2, "0")}:${index % 2 === 0 ? "10" : "40"}`}
          </span>
          <span className="min-w-0 wrap-anywhere">{entry}</span>
        </li>
      ))}
    </ol>
  );
}

export const Playground: Story = {
  name: "试一试",
  render: (args) => (
    <ScrollArea {...args} className="h-56 w-72">
      {/* 换成横向、双向时要有比它宽的东西可滚 */}
      <div
        className={args.orientation === "vertical" ? undefined : "w-[36rem]"}
      >
        <Log />
      </div>
    </ScrollArea>
  ),
};

/* 给的是高度上限：内容短就跟着矮，也没有滚动条、不让位 */
export const MaxHeight: Story = {
  name: "高度上限：内容短就跟着矮",
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-wrap items-start gap-8">
      <ScrollArea
        aria-label="今天的日志"
        data-area="short"
        className="max-h-48 w-64 border border-line px-3"
      >
        <Log count={3} />
      </ScrollArea>
      <ScrollArea
        aria-label="本周的日志"
        data-area="long"
        className="max-h-48 w-64 border border-line px-3"
      >
        <Log />
      </ScrollArea>
    </div>
  ),
};

const stations = [
  ["N-01", "北区仓储站"],
  ["N-07", "三号管廊中继"],
  ["E-02", "东线补给点"],
  ["E-05", "第三岩层营地"],
  ["S-03", "南口检修站"],
  ["S-08", "气象观测点"],
  ["W-04", "西线转运场"],
  ["W-09", "备用电源站"],
] as const;

/* 横向：一排放不下的卡片。滚动条在下缘，内容在下面让出 12px */
export const Horizontal: Story = {
  name: "横向",
  parameters: { controls: { disable: true } },
  render: () => (
    <ScrollArea aria-label="站点" orientation="horizontal" className="max-w-xl">
      <ul className="flex gap-3">
        {stations.map(([code, name]) => (
          <li
            key={code}
            className="flex w-40 shrink-0 flex-col gap-2 border border-line bg-surface-raised p-3"
          >
            <Tag size="sm" numeric>
              {code}
            </Tag>
            <span className="text-sm font-medium">{name}</span>
          </li>
        ))}
      </ul>
    </ScrollArea>
  ),
};

/* 两个方向：一张比窗口大的图。右下角空出一个 12px 的交角 */
export const Both: Story = {
  name: "两个方向",
  parameters: { controls: { disable: true } },
  render: () => (
    <ScrollArea
      aria-label="测绘图"
      orientation="both"
      className="h-64 max-w-xl border border-line"
    >
      <div className="relative h-[32rem] w-[56rem] bg-surface-sunken">
        <Texture variant="grid" />
        {stations.map(([code], index) => (
          <span
            key={code}
            className="absolute font-tech text-xs text-ink-secondary"
            style={{
              left: `${8 + ((index * 23) % 80)}%`,
              top: `${10 + ((index * 37) % 75)}%`,
            }}
          >
            {`+ ${code}`}
          </span>
        ))}
      </div>
    </ScrollArea>
  ),
};

/* 面板里的长列表：面板不跟着长，里面自己滚 */
export const InPanel: Story = {
  name: "面板里的长列表",
  parameters: { controls: { disable: true } },
  render: () => (
    <Panel className="max-w-sm">
      <PanelHeader extra={<span className="font-tech">08</span>}>
        站点
      </PanelHeader>
      <ScrollArea aria-label="站点" className="max-h-56">
        <List aria-label="站点">
          {stations.map(([code, name]) => (
            <ListRow key={code} href={`#${code}`} end={code}>
              {name}
            </ListRow>
          ))}
        </List>
      </ScrollArea>
    </Panel>
  ),
};

/* viewportRef 交出真正在滚的元素：回到顶部、页内目录的 target 要的就是它 */
function WithBackToTopExample() {
  const viewport = useRef<HTMLDivElement>(null);
  return (
    <div className="relative w-72">
      <ScrollArea
        aria-label="日程"
        viewportRef={viewport}
        className="h-64 border border-line px-3 py-2"
      >
        <Timeline aria-label="日程">
          {entries.slice(0, 10).map((entry, index) => (
            <TimelineItem
              key={entry}
              date={`10.${String(index + 2).padStart(2, "0")}`}
              title={entry}
              status={
                index < 3 ? undefined : index === 3 ? "current" : "upcoming"
              }
            />
          ))}
        </Timeline>
      </ScrollArea>
      <BackToTop
        target={viewport}
        threshold={80}
        size="sm"
        className="absolute right-5 bottom-3"
      />
    </div>
  );
}

export const WithBackToTop: Story = {
  name: "配合回到顶部",
  parameters: { controls: { disable: true } },
  render: () => <WithBackToTopExample />,
};

export const Narrow: Story = {
  name: "窄容器",
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="w-56 border border-dashed border-line-strong p-3">
      <ScrollArea aria-label="值守日志" className="h-40">
        <Log />
      </ScrollArea>
    </div>
  ),
};
