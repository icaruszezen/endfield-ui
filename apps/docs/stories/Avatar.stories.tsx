import {
  Avatar,
  AvatarSwitcher,
  AvatarSwitcherItem,
  Lock,
  TagPair,
} from "@endfield-ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { crew, portrait } from "./_shared/Portraits";

/* 人名全部虚构；头像是原创的几何剪影，不对应任何人 */
const meta = {
  title: "控件/Avatar 头像与头像切换",
  component: Avatar,
  args: {
    name: "陈知远",
    src: portrait(0),
    size: "lg",
    selected: false,
  },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md", "lg", "xl"] },
    children: { control: false },
  },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Sizes: Story = {
  name: "尺寸",
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex items-end gap-4">
      <Avatar size="sm" name="陈知远" src={portrait(0)} />
      <Avatar size="md" name="林澈" src={portrait(1)} />
      <Avatar size="lg" name="Mira Kessel" src={portrait(2)} />
      <Avatar size="xl" name="苏禾" src={portrait(3)} />
    </div>
  ),
};

/* 没有图、图没加载出来时是名字的首字；也可以换成一个图标 */
export const Fallback: Story = {
  name: "没有图",
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex items-center gap-4">
      <Avatar size="lg" name="陈知远" />
      <Avatar size="lg" name="Mira Kessel" />
      <Avatar size="lg" name="加载失败的图" src="/no-such-portrait.png" />
      <Avatar size="lg" name="未授权的访客">
        <Lock />
      </Avatar>
    </div>
  ),
};

export const Selected: Story = {
  name: "选中环",
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex items-center gap-6 p-2">
      <Avatar size="lg" name="陈知远" src={portrait(0)} />
      <Avatar size="lg" name="林澈" src={portrait(1)} selected />
      <Avatar size="lg" name="苏禾" selected />
    </div>
  ),
};

/* 旁边已经写了名字：头像是装饰，alt 传空串 */
export const WithName: Story = {
  name: "配着名字",
  parameters: { controls: { disable: true } },
  render: () => (
    <ul className="flex flex-col gap-3">
      {crew.slice(0, 3).map((person) => (
        <li key={person.value} className="flex items-center gap-3">
          <Avatar name={person.label} src={person.src} alt="" />
          <div className="flex flex-col">
            <span className="font-medium">{person.label}</span>
            <span className="text-xs text-ink-secondary">{person.role}</span>
          </div>
        </li>
      ))}
    </ul>
  ),
};

function CrewSwitcher({
  orientation = "vertical",
  count = 4,
  className,
}: {
  orientation?: "vertical" | "horizontal";
  count?: number;
  className?: string;
}) {
  const people = crew.slice(0, count);
  const [current, setCurrent] = useState("lin");
  const person = people.find((item) => item.value === current)!;

  return (
    <div
      className={
        orientation === "vertical"
          ? "flex items-start gap-6"
          : "flex flex-col items-start gap-4"
      }
    >
      <AvatarSwitcher
        aria-label="值班人员"
        orientation={orientation}
        value={current}
        onValueChange={setCurrent}
        className={className}
      >
        {people.map((item) => (
          <AvatarSwitcherItem
            key={item.value}
            value={item.value}
            label={item.label}
            src={item.src}
          />
        ))}
      </AvatarSwitcher>
      <div aria-live="polite" className="flex min-w-40 flex-col gap-2 pt-10">
        <p className="text-2xl font-bold">
          <span aria-hidden="true" className="text-line-strong">
            [{" "}
          </span>
          {person.label}
          <span aria-hidden="true" className="text-line-strong">
            {" "}
            ]
          </span>
        </p>
        <TagPair name="岗位" value={person.role} />
      </div>
    </div>
  );
}

export const Switcher: Story = {
  name: "头像切换",
  parameters: { controls: { disable: true } },
  render: () => <CrewSwitcher />,
};

export const SwitcherHorizontal: Story = {
  name: "头像切换：横排",
  parameters: { controls: { disable: true } },
  render: () => <CrewSwitcher orientation="horizontal" />,
};

/* 头像多到放不下：给整个控件一个高度上限，头像在两个翻页钮之间滚动 */
export const SwitcherScrolling: Story = {
  name: "头像切换：放不下时滚动",
  parameters: { controls: { disable: true } },
  render: () => <CrewSwitcher count={6} className="max-h-80" />,
};
