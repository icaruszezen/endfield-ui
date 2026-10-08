import { Button, Countdown } from "@endfield-ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

const SECOND = 1000;
const HOUR = 3600 * SECOND;
const DAY = 24 * HOUR;

// 相对"打开页面的那一刻"取截止时间，演示才一直有效
const opened = Date.now();

const meta = {
  title: "控件/Countdown 倒计时",
  component: Countdown,
  args: { to: opened + 3 * DAY + 4 * HOUR },
  argTypes: {
    to: { control: false },
    size: { control: "inline-radio", options: ["sm", "md"] },
  },
} satisfies Meta<typeof Countdown>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const States: Story = {
  name: "充裕、紧迫、已结束",
  render: () => (
    <div className="flex flex-col gap-4">
      {(["md", "sm"] as const).map((size) => (
        <div key={size} className="flex flex-wrap items-center gap-3">
          <Countdown size={size} to={opened + 3 * DAY + 4 * HOUR} />
          <Countdown size={size} to={opened + 2 * HOUR + 14 * 60 * SECOND} />
          <Countdown size={size} to={opened - SECOND} />
        </div>
      ))}
    </div>
  ),
};

function Expiring() {
  const [deadline, setDeadline] = useState(() => Date.now() + 6 * SECOND);
  const [expired, setExpired] = useState(false);
  return (
    <div className="flex flex-col items-start gap-4">
      <Countdown
        to={deadline}
        urgentWithin={3 * SECOND}
        onExpire={() => setExpired(true)}
      />
      <p className="text-sm text-ink-secondary">
        {expired
          ? "onExpire 已触发。"
          : "剩 3 秒时进入紧迫态，到点后触发 onExpire。"}
      </p>
      <Button
        variant="light"
        size="sm"
        onClick={() => {
          setExpired(false);
          setDeadline(Date.now() + 6 * SECOND);
        }}
      >
        重新开始
      </Button>
    </div>
  );
}

export const Expire: Story = {
  name: "到期",
  render: () => <Expiring />,
};
