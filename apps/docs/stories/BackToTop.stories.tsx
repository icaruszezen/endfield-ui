import { BackToTop, SectionTitle } from "@endfield-ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useRef } from "react";

/* 文案全部虚构 */
const meta = {
  title: "控件/BackToTop 回到顶部",
  component: BackToTop,
  parameters: { controls: { disable: true } },
} satisfies Meta<typeof BackToTop>;

export default meta;
type Story = StoryObj<typeof meta>;

const paragraphs = [
  "第七勘探区的测绘从北侧的管廊开始，沿主干线一路向南。",
  "每隔两百米布设一枚信标，信标的编号写在图上，也写在实地的桩上。",
  "没测过的地方在图上是一片斜纹，测过之后斜纹退掉，露出下面的等高线。",
  "夜间只做复核，不开新线：白天量错的点，夜里的温差会把它放大。",
  "归档之前要过三遍：现场一遍，站里一遍，交给下一班之前再一遍。",
  "滤芯、电池、信标都有寿命。到期前三天，站点会出现在待办里。",
  "补给车每周二、周五各来一趟，错过了就要等下一趟。",
  "到站满三十天的批次进档案，按站点和月份分开存放。",
];

function Article({ sections = 3 }: { sections?: number }) {
  return (
    <div className="flex flex-col gap-8">
      {Array.from({ length: sections }, (_, section) => (
        <section key={section} className="flex flex-col gap-3">
          <h3 className="text-base font-bold">{`第 ${section + 1} 节`}</h3>
          {paragraphs.map((text) => (
            <p key={text} className="text-sm text-ink-secondary">
              {text}
            </p>
          ))}
          <a
            href={`#section-${section + 1}`}
            className="self-start text-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            {`第 ${section + 1} 节的原始记录`}
          </a>
        </section>
      ))}
    </div>
  );
}

/** 放进一个滚动容器：传 `target`，位置改成相对那个容器 */
function Frame({ size }: { size?: "sm" | "md" }) {
  const scroller = useRef<HTMLDivElement>(null);
  return (
    <div className="relative w-80 max-w-full border border-line">
      <div ref={scroller} className="h-80 overflow-y-auto p-4">
        <Article sections={2} />
      </div>
      <BackToTop
        target={scroller}
        threshold={120}
        size={size}
        aria-label="回到这一栏的顶部"
        className="absolute right-3 bottom-3"
      />
    </div>
  );
}

export const InContainer: Story = {
  name: "在滚动容器里",
  render: () => <Frame />,
};

export const Small: Story = {
  name: "小一档（40px）",
  render: () => <Frame size="sm" />,
};

export const Page: Story = {
  name: "整页（钉在视口右下角）",
  // 钉在视口上：不并排（两份会叠在一起），也不进文档页（会浮到文档页上）
  tags: ["!autodocs"],
  parameters: { sideBySide: false },
  render: () => (
    <div className="mx-auto flex max-w-xl flex-col gap-8">
      <SectionTitle latin="Field Notes" level={1}>
        测绘手记
      </SectionTitle>
      <p className="text-sm text-ink-secondary">
        往下滚四百像素，右下角会出现一个钮。点了回到这里，焦点也跟着回来：再按{" "}
        <kbd className="font-tech">Tab</kbd> 是从页面的头上开始。
      </p>
      <Article sections={4} />
      <BackToTop />
    </div>
  ),
};

export const Sticky: Story = {
  name: "跟着一栏走（sticky）",
  // 看的是整页的滚动：放进文档页会跟着文档页的滚动出现
  tags: ["!autodocs"],
  render: () => (
    <div className="mx-auto flex max-w-xl flex-col gap-8">
      <p className="text-sm text-ink-secondary">
        页面被分成几栏、或者祖先上有{" "}
        <code className="font-tech">transform</code>
        、容器查询的时候，<code className="font-tech">fixed</code>{" "}
        不再相对视口。这时把它放在这一栏的最后，位置改成{" "}
        <code className="font-tech">sticky</code>。
      </p>
      <Article sections={4} />
      <BackToTop className="sticky bottom-4 self-end" />
    </div>
  ),
};
