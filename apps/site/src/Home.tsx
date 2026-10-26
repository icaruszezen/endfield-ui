/*
 * 首页：一句话定位、三个载体、六条原则、全部文档的目录、来源等级怎么读。
 * 目录那一块取自构建时读到的索引（docs/README.md），其余是这一页自己的文案。
 */
import {
  Alert,
  Button,
  GhostText,
  List,
  ListRow,
  SectionTitle,
  Stat,
} from "@endfield-ui/react";
import type { ReactNode } from "react";
import { ExternalIcon } from "./icons.tsx";
import { pageHref } from "./site.ts";
import type { HomePage, SiteData } from "./types.ts";

const principles = [
  {
    title: "纸与墨是主体，颜色是信号",
    text: "大面积只用中性色，信号黄只出现在需要被看见的那一处。",
    route: "foundations/color/",
  },
  {
    title: "主角偏心，信息靠边",
    text: "主角占据偏离中心的大块面积，导航、标签、说明停靠在边缘。",
    route: "foundations/layout/",
  },
  {
    title: "形状有含义",
    text: "直角与切角是机械与行动，圆与弧是人与仪表，胶囊是筛选与短状态。",
    route: "foundations/shape/",
  },
  {
    title: "两种文字，两个层次",
    text: "中文黑体承担阅读，英文承担结构：分节名、编号、微标签。",
    route: "foundations/typography/",
  },
  {
    title: "纹理有预算",
    text: "斜纹、网格、点阵都是可选的，一屏选一到两种。",
    route: "foundations/texture/",
  },
  {
    title: "动得短，动得硬",
    text: "过渡以 0.2 – 0.3 秒为主，用位移、擦入和明暗反转，不弹跳。",
    route: "foundations/motion/",
  },
];

const surfaces: Record<string, string> = {
  "surfaces/website/":
    "纸白为主，几乎全是直角，只有一种信号黄；大图大字，信息密度低。",
  "surfaces/game-ui/":
    "亮暗并存，黄色之外的角色色各司其职；切角、圆弧、胶囊按语义混用。",
  "surfaces/promotional/":
    "版本、角色、地区的主题色可以整页接管；结构跟着体裁走。",
};

const evidence = [
  ["实测", "从官网样式中直接读到的数值"],
  ["观察", "在官方公开页面上看到的现象"],
  ["社区", "开源项目作者的取值或观察，这里没有独立验证"],
  ["推断", "这套文档自己的设计建议，可以被推翻"],
] as const;

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

/*
 * 这一页的分节标题都关了入场（animate={false}）：那个入场要等脚本看到它进了视口才播，
 * 之前标题是透明的——没开脚本、或者脚本还没到的时候，标题就一直看不见。
 * 首屏的三行字用的是纯 CSS 的入场，不等脚本。
 */
const enter = "animate-shift-in [--shift-x:calc(var(--motion-shift-lg)*-1)]";

function Block({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <section id={id} className="mt-20 flex flex-col gap-8">
      {children}
    </section>
  );
}

export function Home({ data, page }: { data: SiteData; page: HomePage }) {
  const { nav, links } = data;
  const routes = new Set(
    nav.flatMap((group) => group.items.map((item) => item.route)),
  );
  const overview = nav.find((group) => group.key === "overview")?.items[0];
  // 只画写了简介的那三个载体；云游戏页是官网底下的一页，从侧栏和官网那篇进
  const surfaceItems = (
    nav.find((group) => group.key === "surfaces")?.items ?? []
  ).filter((item) => item.route in surfaces);

  return (
    <div>
      {/* 首屏：标题偏左，读数靠右下，背后一行被截断的镂空字 */}
      <header className="relative overflow-clip border-b border-line pb-12">
        <GhostText className="absolute right-0 -bottom-5 hidden text-[6.5rem] xl:block">
          DESIGN
        </GhostText>
        <div className="relative flex flex-col gap-6">
          <p className="font-tech text-xs text-ink-secondary">
            {"// ENDFIELD-UI　设计规范　非官方"}
          </p>
          <h1
            className={`max-w-2xl text-3xl leading-tight font-bold wrap-anywhere sm:text-4xl ${enter}`}
          >
            《明日方舟：终末地》风格设计指导文档
          </h1>
          <p
            className={`max-w-xl text-lg leading-relaxed ${enter} [animation-delay:100ms]`}
          >
            <strong className="font-bold">工业编辑风</strong>
            ：把界面当成一份印出来的技术文档——纸白或烟黑的底、墨黑的字、一处高饱和的信号色，再叠上一层克制的测绘与印刷痕迹。
          </p>
          <p className="max-w-xl text-ink-secondary">
            它不是“深色赛博朋克”，也不等于“黑底黄字加切角”。这里把官网、游戏界面和宣传物料的视觉语言拆成能照着做的规范，每条都标了依据。
          </p>
          <div className="flex flex-wrap gap-3">
            {overview && (
              <Button
                variant="action"
                size="lg"
                href={pageHref(data, overview.route)}
              >
                从总纲读起
              </Button>
            )}
            <Button
              variant="control"
              size="lg"
              href={links.storybook}
              target="_blank"
              rel="noopener noreferrer"
            >
              组件预览
            </Button>
          </div>
          <div className="mt-4 flex flex-wrap gap-x-12 gap-y-6">
            <Stat label="DOCS" value={page.stats.docs} unit="篇文档" />
            <Stat
              label="FIGURES"
              value={page.stats.figures}
              unit="张原创图解"
            />
            <Stat label="EVIDENCE" value={evidence.length} unit="档来源等级" />
          </div>
        </div>
      </header>

      <Block>
        <SectionTitle latin="Surfaces" animate={false}>
          三个载体，三种气质
        </SectionTitle>
        <p className="max-w-prose text-ink-secondary">
          同一套语言在不同载体上的侧重不同。做设计前先确认自己在做哪一种。
        </p>
        <ul className="grid gap-px border border-line bg-line md:grid-cols-3">
          {surfaceItems.map((item) => (
            <li key={item.route} className="bg-surface">
              <a
                href={pageHref(data, item.route)}
                className={`flex h-full flex-col gap-3 p-5 transition-colors duration-(--duration-fast) hover:bg-ink/5 ${focusRing} -outline-offset-2`}
              >
                <span className="flex items-baseline justify-between gap-3">
                  <span className="text-xl font-bold">{item.title}</span>
                  {/* 索引里这三篇后面写的是"证据等级：实测"，这里画成正文里同样的小标签 */}
                  <span className="flex shrink-0 gap-1">
                    {item.description
                      .replace(/^证据等级[：:]\s*/, "")
                      .split("+")
                      .map((level) => level.trim())
                      .filter(Boolean)
                      .map((level) => (
                        <span
                          key={level}
                          className="doc-evidence"
                          data-level={level}
                        >
                          {level}
                        </span>
                      ))}
                  </span>
                </span>
                <span className="text-sm text-ink-secondary">
                  {surfaces[item.route]}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </Block>

      <Block>
        <SectionTitle latin="Principles" animate={false}>
          六条核心原则
        </SectionTitle>
        <p className="max-w-prose text-ink-secondary">
          这六条在三个载体上都成立，是判断“像不像”的依据。
        </p>
        <ol className="grid gap-x-10 gap-y-6 md:grid-cols-2">
          {principles.map((item, index) => (
            <li
              key={item.title}
              className="flex gap-4 border-t border-line pt-4"
            >
              <span
                aria-hidden="true"
                className="font-display text-xl leading-7 font-extrabold text-ink-tertiary"
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="flex min-w-0 flex-col gap-1">
                <h3 className="text-lg font-bold">
                  {routes.has(item.route) ? (
                    <a
                      href={pageHref(data, item.route)}
                      className={`underline decoration-line-strong decoration-1 underline-offset-4 hover:decoration-ink ${focusRing}`}
                    >
                      {item.title}
                    </a>
                  ) : (
                    item.title
                  )}
                </h3>
                <p className="text-sm text-ink-secondary">{item.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </Block>

      <Block>
        <SectionTitle latin="Index" animate={false}>
          全部文档
        </SectionTitle>
        <div className="flex flex-col gap-10">
          {nav.map((group) => (
            <section
              key={group.key}
              id={group.key}
              aria-labelledby={`${group.key}-title`}
              className="grid gap-x-10 gap-y-3 border-t border-line pt-6 md:grid-cols-[11rem_minmax(0,1fr)]"
            >
              <div className="flex flex-col gap-1">
                <p className="font-tech text-xs text-ink-secondary">{`// ${group.latin}`}</p>
                <h3 id={`${group.key}-title`} className="text-xl font-bold">
                  {group.title}
                </h3>
                {group.intro && (
                  <p className="text-sm text-ink-secondary">{group.intro}</p>
                )}
              </div>
              <List>
                {group.items.map((item) => (
                  <ListRow
                    key={item.route}
                    href={pageHref(data, item.route)}
                    description={item.description || undefined}
                  >
                    {item.title}
                  </ListRow>
                ))}
              </List>
            </section>
          ))}
        </div>
      </Block>

      <Block>
        <SectionTitle latin="Evidence" animate={false}>
          怎么读这些文档
        </SectionTitle>
        <p className="max-w-prose text-ink-secondary">
          每条规范都标了依据。“实测”和“观察”是事实，“社区”和“推断”是可以被推翻的判断；游戏界面的部分以“社区”为主。
        </p>
        <dl className="grid gap-x-10 gap-y-3 sm:grid-cols-2">
          {evidence.map(([level, meaning]) => (
            <div key={level} className="flex items-baseline gap-3">
              <dt className="shrink-0">
                <span className="doc-evidence" data-level={level}>
                  {level}
                </span>
              </dt>
              <dd className="text-sm text-ink-secondary">{meaning}</dd>
            </div>
          ))}
        </dl>
        <Alert tone="info" title="非官方项目">
          这是爱好者做的设计规范，与鹰角网络（Hypergryph）没有隶属或授权关系，也不代表官方立场。站内的图解都是原创示意，不包含官方截图、立绘、标志与字体。
          <a
            href={links.notice}
            target="_blank"
            rel="noopener noreferrer"
            className={`ml-1 inline-flex items-center gap-1 underline underline-offset-4 ${focusRing}`}
          >
            版权与商标声明
            <ExternalIcon size={12} />
          </a>
        </Alert>
      </Block>
    </div>
  );
}
