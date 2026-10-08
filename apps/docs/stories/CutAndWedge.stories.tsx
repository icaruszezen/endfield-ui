import type { Meta, StoryObj } from "@storybook/react-vite";

/*
 * 切角与斜楔没有对应的组件：它们是工具类（cut-* / wedge-*），由控件按需取用。
 * 这里演示画法，以及"可聚焦的元素怎么切才不会裁掉焦点环"。
 */
const meta = {
  title: "母题/切角与斜楔",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const box =
  "flex items-center justify-center bg-surface-inverse font-tech text-xs text-ink-inverse";
const lg = "h-14 w-36";

export const Cuts: Story = {
  name: "切角",
  render: () => (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-4">
        <div className={`${box} ${lg} cut-tr`}>cut-tr</div>
        <div className={`${box} ${lg} cut-br`}>cut-br</div>
        <div className={`${box} ${lg} cut-diagonal`}>cut-diagonal</div>
      </div>
      <div className="flex flex-wrap items-end gap-4">
        <div className={`${box} cut-tr cut-sm h-7 w-24`}>cut-sm</div>
        <div className={`${box} cut-tr cut-md h-10 w-28`}>cut-md</div>
        <div className={`${box} ${lg} cut-tr cut-lg`}>cut-lg</div>
      </div>
      <p className="max-w-prose text-sm text-ink-secondary">
        切口约为元素高度的四分之一。一个元素只切一个角；对角各切一个用于更强的机械感，四角全切不用。
      </p>
    </div>
  ),
};

export const Wedges: Story = {
  name: "斜楔",
  render: () => (
    <div className="flex flex-wrap gap-4">
      <div className={`${box} ${lg} wedge`}>wedge</div>
      <div className={`${box} ${lg} wedge-l`}>wedge-l</div>
      <div className={`${box} ${lg} wedge-r`}>wedge-r</div>
    </div>
  ),
};

export const Focusable: Story = {
  name: "可聚焦的元素：切在伪元素上",
  render: () => (
    <div className="flex flex-col items-start gap-4">
      <div className="flex flex-wrap gap-6">
        <button
          type="button"
          className="relative isolate h-10 px-8 font-medium text-on-action before:absolute before:inset-0 before:-z-10 before:bg-action before:cut-tr before:content-[''] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          确认出发
        </button>
        <button
          type="button"
          className="relative isolate h-10 px-8 font-medium text-ink-inverse before:absolute before:inset-0 before:-z-10 before:bg-surface-inverse before:wedge before:content-[''] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          权限等级
        </button>
      </div>
      <p className="max-w-prose text-sm text-ink-secondary">
        用 Tab 聚焦这两个按钮：焦点环是完整的矩形。按钮本身没有被裁切，切角和斜楔画在
        <code className="mx-1 font-mono text-xs">::before</code>
        的底上。
      </p>
    </div>
  ),
};

export const Outlined: Story = {
  name: "带描边的切角",
  render: () => (
    // 两层：外层是描边色，内层缩进 1px 是填充色，用同一个切角
    <div className="flex flex-wrap gap-4">
      <div className="cut-br bg-line-strong p-px">
        <div className="cut-br flex h-14 w-40 items-center justify-center bg-surface text-sm text-ink">
          描边的面板
        </div>
      </div>
      <span className="cut-br cut-sm inline-flex h-5 items-center bg-action pr-2.5 pl-1.5 text-xs font-medium text-on-action">
        NEW
      </span>
    </div>
  ),
};
