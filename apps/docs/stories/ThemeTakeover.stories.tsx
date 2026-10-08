import {
  Button,
  IconButton,
  Panel,
  PanelHeader,
  PanelRow,
  PanelRows,
  Plus,
  SectionTitle,
  Tag,
  TagPair,
} from "@endfield-ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";

/**
 * 版本、角色、地区可以把强调色换成自己的主题色。
 * 做法是在局部覆盖语义变量；危险、成功等语义色不动。
 */
const meta = {
  title: "示例/主题色接管",
  parameters: { controls: { disable: true } },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/*
 * 一套完整的接管：行动色两档 + 强调文字的两个档位。
 * 文字档按所在表面的明暗取值，所以暗色主题下要对调。
 * 青色取值出自 docs/design/foundations/color.md 的示例（社区）。
 */
const tealTheme = `
.demo-theme-teal {
  --ef-action: #14d0d0;
  --ef-action-pressed: #10b8b8;
  --ef-accent-ink: #006a6a;
  --ef-accent-ink-inverse: #14d0d0;
}
[data-theme="dark"] .demo-theme-teal {
  --ef-accent-ink: #14d0d0;
  --ef-accent-ink-inverse: #006a6a;
}
`;

function Sample() {
  return (
    <div className="flex flex-col gap-6">
      <SectionTitle variant="band" subtitle="Region">
        Wetland
      </SectionTitle>
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="action">进入区域</Button>
        <Button>更多情报</Button>
        <IconButton aria-label="收藏" variant="accent" pressed>
          <Plus />
        </IconButton>
        <Tag variant="accent">推荐</Tag>
        <TagPair name="地区" value="湿地" emphasis />
      </div>
      <Panel className="max-w-sm">
        <PanelHeader>区域概况</PanelHeader>
        <PanelRows>
          <PanelRow label="站点">12</PanelRow>
          <PanelRow label="路线">31</PanelRow>
        </PanelRows>
      </Panel>
    </div>
  );
}

export const Takeover: Story = {
  name: "默认黄 与 青色接管",
  render: () => (
    // 按画布自身的宽度分栏（容器查询）：并排模式下每个主题只占半个视口
    <div className="@container">
      <style>{tealTheme}</style>
      <div className="grid gap-10 @3xl:grid-cols-2">
        <Sample />
        <div className="demo-theme-teal">
          <Sample />
        </div>
      </div>
    </div>
  ),
};
