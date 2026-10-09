import { Schedule, ScheduleItem, ScheduleTrack } from "@endfield-ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ScenePlaceholder } from "./_shared/Placeholders";
import { CrateIcon, RouteIcon, SlidersIcon } from "./_shared/ResourceIcons";
import { RouterLink } from "./_shared/RouterLink";

/* 文案与日期全部虚构；条目垫的是原创的灰色占位图 */
const tracks = (
  <>
    <ScheduleTrack label="测绘" icon={<RouteIcon />}>
      <ScheduleItem
        start="2026-10-01"
        end="2026-10-12"
        title="管廊北段测绘"
        type="限时"
        media={<ScenePlaceholder seed={0} />}
      />
      <ScheduleItem
        start="2026-10-10"
        end="2026-10-24"
        title="第三岩层复测"
        type="常驻"
        media={<ScenePlaceholder seed={1} />}
      />
      <ScheduleItem
        start="2026-10-26"
        end="2026-10-31"
        title="旧输料口"
        type="限时"
        media={<ScenePlaceholder seed={2} />}
      />
    </ScheduleTrack>
    <ScheduleTrack label="补给" icon={<CrateIcon />}>
      <ScheduleItem
        start="2026-10-05"
        end="2026-10-11"
        title="南岸补给周"
        type="双倍"
      />
      <ScheduleItem
        start="2026-10-19"
        end="2026-10-25"
        title="北区补给周"
        type="双倍"
      />
    </ScheduleTrack>
    <ScheduleTrack label="系统" icon={<SlidersIcon />}>
      <ScheduleItem
        variant="system"
        start="2026-10-01"
        end="2026-10-31"
        title="每日巡检签到"
      />
      <ScheduleItem
        variant="system"
        start="2026-10-14"
        end="2026-10-16"
        title="例行检修"
      />
    </ScheduleTrack>
  </>
);

const meta = {
  title: "控件/Schedule 排期",
  component: Schedule,
  args: {
    label: "十月排期",
    start: "2026-10-01",
    end: "2026-10-31",
    today: "2026-10-09",
    dayWidth: 32,
    children: tracks,
  },
  argTypes: {
    anchors: { control: false },
    children: { control: false },
    describeRange: { control: false },
  },
} satisfies Meta<typeof Schedule>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/* 日期锚自己指定：标出几个要留意的日子 */
export const Anchors: Story = {
  name: "自己指定日期锚",
  args: { anchors: ["2026-10-01", "2026-10-10", "2026-10-19", "2026-10-26"] },
};

/* 跨月：默认的日期锚是第一天和每个月的 1 号 */
export const AcrossMonths: Story = {
  name: "跨月",
  args: {
    label: "十月下旬到十一月上旬",
    start: "2026-10-20",
    end: "2026-11-12",
    today: undefined,
    children: (
      <>
        <ScheduleTrack label="测绘" icon={<RouteIcon />}>
          {/* 起止超出范围的条目被裁到范围内 */}
          <ScheduleItem
            start="2026-10-10"
            end="2026-10-24"
            title="第三岩层复测"
            type="常驻"
            media={<ScenePlaceholder seed={1} />}
          />
          <ScheduleItem
            start="2026-10-26"
            end="2026-11-08"
            title="旧输料口"
            type="限时"
            media={<ScenePlaceholder seed={2} />}
          />
        </ScheduleTrack>
        <ScheduleTrack label="系统" icon={<SlidersIcon />}>
          <ScheduleItem
            variant="system"
            start="2026-11-01"
            end="2026-11-30"
            title="十一月巡检签到"
          />
        </ScheduleTrack>
      </>
    ),
  },
};

/* 同一条轨里时间重叠的条目自动错到下一行 */
export const Overlapping: Story = {
  name: "同一条轨里重叠",
  args: {
    label: "一周",
    start: "2026-10-05",
    end: "2026-10-18",
    today: undefined,
    children: (
      <ScheduleTrack label="测绘" icon={<RouteIcon />}>
        <ScheduleItem start="2026-10-05" end="2026-10-10" title="北段" />
        <ScheduleItem start="2026-10-08" end="2026-10-14" title="中段" />
        <ScheduleItem start="2026-10-09" end="2026-10-11" title="复核" />
        <ScheduleItem start="2026-10-12" end="2026-10-18" title="南段" />
        <ScheduleItem start="2026-10-16" end="2026-10-18" title="收尾" />
      </ScheduleTrack>
    ),
  },
};

/* 条目可以是链接；竖轨的颜色可以换成版本的主题色 */
export const LinksAndColor: Story = {
  name: "链接与换色的竖轨",
  args: {
    label: "一周",
    start: "2026-10-05",
    end: "2026-10-18",
    today: "2026-10-09",
    children: (
      <>
        <ScheduleTrack
          label="测绘"
          icon={<RouteIcon />}
          className="[--track-color:var(--color-region)] [--track-ink:var(--color-neutral-900)]"
        >
          <ScheduleItem
            start="2026-10-05"
            end="2026-10-11"
            title="管廊北段"
            type="限时"
            href="#north"
            media={<ScenePlaceholder seed={0} />}
          />
          <ScheduleItem
            start="2026-10-12"
            end="2026-10-18"
            title="管廊南段"
            type="限时"
            render={<RouterLink to="/survey/south" />}
            media={<ScenePlaceholder seed={2} />}
          />
        </ScheduleTrack>
        <ScheduleTrack label="系统" icon={<SlidersIcon />}>
          <ScheduleItem
            variant="system"
            start="2026-10-05"
            end="2026-10-18"
            title="每日巡检签到"
            href="#sign"
          />
        </ScheduleTrack>
      </>
    ),
  },
};

/* 容器窄的时候在自己里面横向滚动，类目竖轨冻结在左边 */
export const Narrow: Story = {
  name: "窄容器：横向滚动并冻结竖轨",
  decorators: [
    (Story) => (
      <div className="max-w-sm">
        <Story />
      </div>
    ),
  ],
};
