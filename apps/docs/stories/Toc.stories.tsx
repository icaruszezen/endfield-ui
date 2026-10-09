import { SectionTitle, Toc, TocItem } from "@endfield-ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useId, useRef, useState, type ReactNode } from "react";

/* 文案全部虚构 */
const meta = {
  title: "控件/Toc 页内目录",
  component: Toc,
  // 每个 story 都自己摆正文和目录，children 只是为了让类型过得去
  args: { title: "// 本页", offset: 0, children: null },
  argTypes: {
    children: { control: false },
    target: { control: false },
  },
} satisfies Meta<typeof Toc>;

export default meta;
type Story = StoryObj<typeof meta>;

const chapters = [
  [
    "bulletin",
    "最新情报",
    "第七勘探区的首批测绘数据已经归档，补给站的扩建进入第二阶段。",
  ],
  [
    "fieldwork",
    "日常作业",
    "沿着管廊布设信标，把走过的每一段记进图里。没测过的地方在图上是一片斜纹。",
  ],
  [
    "crew",
    "队员",
    "四个人轮三班。交接的时候把没做完的事写在交接单上，不靠口头说。",
  ],
  [
    "schedule",
    "本月排期",
    "上半月测管廊北段，下半月复测第三岩层。补给周在两次测绘之间。",
  ],
  [
    "station",
    "站点档案",
    "站点建在一段废弃的输料管廊上方，每一份记录都按采样日期归档。",
  ],
] as const;

const filler =
  "这一段是编的，用来把这一节撑到够长：滚动的时候能看见目录里亮着的那一项跟着换。";

function Section({
  id,
  title,
  lead,
  short = false,
  className,
}: {
  id: string;
  title: ReactNode;
  lead: string;
  short?: boolean;
  className?: string;
}) {
  return (
    <section className="flex flex-col gap-3">
      <SectionTitle variant="plain" level={3} id={id} className={className}>
        {title}
      </SectionTitle>
      <p className="text-ink-secondary">{lead}</p>
      {!short && (
        <>
          <p className="text-ink-secondary">{filler}</p>
          <p className="text-ink-secondary">{filler}</p>
        </>
      )}
    </section>
  );
}

/* 内容在一个滚动容器里：把容器的 ref 传给 target。两份并排时小节的 id 不能撞，各加一个前缀 */
function InContainerExample({
  levels = false,
  ...props
}: {
  levels?: boolean;
  title?: ReactNode;
  offset?: number;
}) {
  const prefix = useId().replace(/[^a-z0-9]/gi, "");
  const scroller = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<string | null>(null);
  const id = (name: string) => `${prefix}-${name}`;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start gap-8">
        <div
          ref={scroller}
          tabIndex={0}
          role="region"
          aria-label="正文"
          className="flex h-72 min-w-0 flex-1 flex-col gap-8 overflow-auto border border-line p-4 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus"
        >
          {chapters.map(([name, title, lead], index) => (
            <Section
              key={name}
              id={id(name)}
              title={title}
              lead={lead}
              // 最后一节很短：它的顶边到不了容器的上沿
              short={index === chapters.length - 1}
            />
          ))}
        </div>
        <Toc
          {...props}
          target={scroller}
          onActiveChange={setActive}
          className="w-40 shrink-0"
        >
          {chapters.map(([name, title], index) => (
            <TocItem
              key={name}
              href={`#${id(name)}`}
              level={levels && (index === 2 || index === 3) ? 2 : 1}
            >
              {title}
            </TocItem>
          ))}
        </Toc>
      </div>
      <p role="status" className="font-tech text-xs text-ink-secondary">
        {`// ${active ? active.replace(`${prefix}-`, "") : "还没到第一节"}`}
      </p>
    </div>
  );
}

export const Playground: Story = {
  render: (args) => (
    <InContainerExample title={args.title} offset={args.offset} />
  ),
};

export const Levels: Story = {
  name: "两级",
  render: () => <InContainerExample title="// 本页" levels />,
};

export const NoTitle: Story = {
  name: "不带小标",
  render: () => <InContainerExample />,
};

/* 长标题折行，不截断；当前项不加粗，所以亮到哪一项整列都不会跳 */
export const LongTitles: Story = {
  name: "长标题折行",
  render: () => (
    <Toc title="// 本页" className="w-44">
      <TocItem href="#one">第七勘探区的首批测绘数据已经归档</TocItem>
      <TocItem href="#two" level={2}>
        补给站扩建工程进入第二阶段的说明
      </TocItem>
      <TocItem href="#three" level={3}>
        秋季勘探计划公开征集路线建议
      </TocItem>
      <TocItem href="#four">档案检索规则调整</TocItem>
    </Toc>
  ),
};

/* 目录比给它的高度还长：它自己能滚，当前项保持在看得见的范围里 */
function OwnScrollExample() {
  const prefix = useId().replace(/[^a-z0-9]/gi, "");
  const scroller = useRef<HTMLDivElement>(null);
  const items = Array.from({ length: 12 }, (_, index) => ({
    id: `${prefix}-day-${index + 1}`,
    title: `第 ${index + 1} 天的记录`,
  }));

  return (
    <div className="flex items-start gap-8">
      <div
        ref={scroller}
        tabIndex={0}
        role="region"
        aria-label="正文"
        className="flex h-72 min-w-0 flex-1 flex-col gap-8 overflow-auto border border-line p-4 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus"
      >
        {items.map((item) => (
          <Section
            key={item.id}
            id={item.id}
            title={item.title}
            lead={filler}
          />
        ))}
      </div>
      <Toc
        title="// 十二天"
        target={scroller}
        className="max-h-40 w-40 shrink-0 overflow-auto"
      >
        {items.map((item) => (
          <TocItem key={item.id} href={`#${item.id}`}>
            {item.title}
          </TocItem>
        ))}
      </Toc>
    </div>
  );
}

export const OwnScroll: Story = {
  name: "目录自己能滚",
  render: () => <OwnScrollExample />,
};

/*
 * 整页的用法：目录 sticky 在一旁，看的是整个页面的滚动。页面有吸顶的页头时，
 * offset 传页头的高度，各节的标题加同样大小的 scroll-mt
 */
export const Page: Story = {
  name: "整页：吸顶的页头",
  // 看的是整个页面的滚动：并排两份会互相干扰，文档页里是和别的 story 一起滚
  tags: ["!autodocs"],
  parameters: { sideBySide: false, controls: { disable: true } },
  render: () => (
    <div className="mx-auto max-w-3xl">
      <header className="sticky top-0 z-(--z-nav) -mx-4 flex h-14 items-center border-b border-line bg-surface px-4 font-medium">
        第七勘探队
      </header>
      <div className="flex items-start gap-10 pt-8">
        <div className="flex min-w-0 flex-1 flex-col gap-12">
          {chapters.map(([name, title, lead], index) => (
            <Section
              key={name}
              id={name}
              title={title}
              lead={lead}
              short={index === chapters.length - 1}
              className="scroll-mt-20"
            />
          ))}
        </div>
        <Toc
          title="// 本页"
          offset={80}
          className="sticky top-20 w-40 shrink-0"
        >
          {chapters.map(([name, title]) => (
            <TocItem key={name} href={`#${name}`}>
              {title}
            </TocItem>
          ))}
        </Toc>
      </div>
    </div>
  ),
};
