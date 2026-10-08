import { Timeline, TimelineItem } from "@endfield-ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  title: "控件/Timeline 时间线",
  component: Timeline,
  parameters: { controls: { disable: true } },
  decorators: [
    (Story) => (
      <div className="max-w-sm">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Timeline>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Schedule: Story = {
  name: "已过 · 当前 · 未到",
  render: () => (
    <Timeline aria-label="勘探日程">
      <TimelineItem date="2026.09.21" title="路线勘定">
        北段管廊的三条备选路线已完成比对。
      </TimelineItem>
      <TimelineItem date="2026.10.02" title="首批测绘数据归档" />
      <TimelineItem status="current" date="2026.10.08" title="补给站扩建">
        第二阶段施工中，预计持续两周。
      </TimelineItem>
      <TimelineItem status="upcoming" date="2026.10.21" title="终端停机维护">
        凌晨 2 点至 6 点，期间无法提交记录。
      </TimelineItem>
      <TimelineItem status="upcoming" date="2026.11.03" title="秋季计划收尾" />
    </Timeline>
  ),
};

export const WithoutDates: Story = {
  name: "不带日期",
  render: () => (
    <Timeline aria-label="提交流程">
      <TimelineItem title="填写采样记录" />
      <TimelineItem title="上传现场照片" />
      <TimelineItem status="current" title="等待复核" />
      <TimelineItem status="upcoming" title="归档" />
    </Timeline>
  ),
};

export const LongText: Story = {
  name: "长文字",
  render: () => (
    <Timeline aria-label="记录">
      <TimelineItem
        date="2026.10.05 14:32"
        title="第三岩层的采样点在连续降雨后出现渗水，取样工作顺延到排水完成之后"
      >
        Samplingpostponeduntildrainagecompletes：英文长串也要能折行，不能把版面撑破。
      </TimelineItem>
      <TimelineItem status="current" date="2026.10.08 09:00" title="排水中" />
    </Timeline>
  ),
};
