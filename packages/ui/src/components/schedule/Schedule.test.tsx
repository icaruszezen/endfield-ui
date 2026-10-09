import { render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RouterLink } from "../../test/RouterLink";
import { Schedule, ScheduleItem, ScheduleTrack } from "./Schedule";

function October(props: Partial<React.ComponentProps<typeof Schedule>>) {
  return (
    <Schedule label="十月排期" start="2026-10-01" end="2026-10-31" {...props}>
      <ScheduleTrack label="活动" icon={<svg data-testid="icon" />}>
        <ScheduleItem
          start="2026-10-03"
          end="2026-10-12"
          title="管廊北段测绘"
          type="限时"
        />
        <ScheduleItem
          start="2026-10-10"
          end="2026-10-20"
          title="南岸补给周"
          href="#supply"
        />
      </ScheduleTrack>
      <ScheduleTrack label="系统">
        <ScheduleItem
          variant="system"
          start="2026-10-01"
          end="2026-10-31"
          title="每日签到"
        />
      </ScheduleTrack>
    </Schedule>
  );
}

const item = (name: RegExp) =>
  screen
    .getAllByRole("listitem")
    .find((element) => name.test(element.textContent ?? ""))!;

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("Schedule", () => {
  it("是一个有名称的分组；每条轨是一个以类目命名的区域，里面是列表", () => {
    render(<October />);
    expect(screen.getByRole("group", { name: "十月排期" })).toBeInTheDocument();
    const track = screen.getByRole("region", { name: "活动" });
    expect(within(track).getAllByRole("listitem")).toHaveLength(2);
    expect(
      within(screen.getByRole("region", { name: "系统" })).getAllByRole(
        "listitem",
      ),
    ).toHaveLength(1);
  });

  it("条目的位置由起止日算出来：从起始日那一列到结束日的下一列", () => {
    render(<October />);
    expect(item(/管廊北段测绘/).style.gridColumn).toBe("3 / 13");
    expect(item(/南岸补给周/).style.gridColumn).toBe("10 / 21");
    expect(item(/每日签到/).style.gridColumn).toBe("1 / 32");
  });

  it("一共几天、一天多宽写成变量，交给网格", () => {
    const { container } = render(<October dayWidth={40} />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.style.getPropertyValue("--schedule-days")).toBe("31");
    expect(root.style.getPropertyValue("--schedule-day")).toBe("40px");
  });

  it("位置读不出来：每个条目的名称后面有一句隐藏的起止日期", () => {
    render(<October />);
    const hidden = item(/管廊北段测绘/).querySelector(".sr-only")!;
    expect(hidden.textContent).toBe("，10月3日至10月12日");
    // 只有一天的条目只说那一天
    render(
      <Schedule label="一天" start="2026-10-01" end="2026-10-07">
        <ScheduleTrack label="检修">
          <ScheduleItem start="2026-10-05" end="2026-10-05" title="换滤芯" />
        </ScheduleTrack>
      </Schedule>,
    );
    expect(item(/换滤芯/).querySelector(".sr-only")!.textContent).toBe(
      "，10月5日",
    );
  });

  it("超出范围的条目被裁到范围内，隐藏的日期仍然是真的；整个在范围外的不画", () => {
    render(
      <Schedule label="第二周" start="2026-10-05" end="2026-10-11">
        <ScheduleTrack label="活动">
          <ScheduleItem
            start="2026-10-01"
            end="2026-10-07"
            title="早就开始了"
          />
          <ScheduleItem start="2026-10-10" end="2026-10-20" title="还没结束" />
          <ScheduleItem start="2026-09-01" end="2026-09-30" title="上个月的" />
          <ScheduleItem start="2026-10-12" end="2026-10-13" title="下周的" />
        </ScheduleTrack>
      </Schedule>,
    );
    const early = item(/早就开始了/);
    expect(early.style.gridColumn).toBe("1 / 4");
    expect(early).toHaveAttribute("data-clipped-start");
    expect(early.querySelector(".sr-only")!.textContent).toMatch(/10月1日/);

    const late = item(/还没结束/);
    expect(late.style.gridColumn).toBe("6 / 8");
    expect(late).toHaveAttribute("data-clipped-end");
    expect(screen.queryByText("上个月的")).not.toBeInTheDocument();
    expect(screen.queryByText("下周的")).not.toBeInTheDocument();
  });

  it("日期锚默认是第一天和每个月的 1 号，写成 MM.DD；轴对读屏隐藏", () => {
    const { container } = render(
      <Schedule label="跨月" start="2026-10-20" end="2026-11-10" />,
    );
    const anchors = [...container.querySelectorAll("[data-anchor]")];
    expect(anchors.map((anchor) => anchor.textContent)).toEqual([
      "10.20",
      "11.01",
    ]);
    expect(anchors[0]).toHaveAttribute("data-marked");
    expect(anchors[0]!.closest("[aria-hidden=true]")).not.toBeNull();
  });

  it("anchors 自己指定日期锚", () => {
    const { container } = render(
      <October anchors={["2026-10-03", "2026-10-10", "2026-10-24"]} />,
    );
    expect(
      [...container.querySelectorAll("[data-anchor]")].map(
        (anchor) => anchor.textContent,
      ),
    ).toEqual(["10.03", "10.10", "10.24"]);
  });

  it("today 在范围里才画那条竖线", () => {
    const { container, rerender } = render(<October />);
    expect(container.querySelector("[data-today]")).toBeNull();
    rerender(<October today="2026-10-09" />);
    const line = container.querySelector<HTMLElement>("[data-today]")!;
    expect(line.style.gridColumn).toBe("9");
    expect(line.closest("[aria-hidden=true]")).not.toBeNull();
    rerender(<October today="2026-11-02" />);
    expect(container.querySelector("[data-today]")).toBeNull();
  });

  it("两种条目：活动有名称块和类型标签，系统类是炭灰底不带标签", () => {
    render(<October />);
    const banner = item(/管廊北段测绘/);
    expect(banner).toHaveAttribute("data-variant", "banner");
    expect(within(banner).getByText("限时")).toHaveAttribute(
      "data-variant",
      "outline",
    );
    const system = item(/每日签到/);
    expect(system).toHaveAttribute("data-variant", "system");
    expect(system).toHaveClass("bg-control", "text-on-control");
  });

  it("media 垫在条目下面，是装饰", () => {
    render(
      <Schedule label="一周" start="2026-10-05" end="2026-10-11">
        <ScheduleTrack label="活动">
          <ScheduleItem
            start="2026-10-05"
            end="2026-10-08"
            title="测绘"
            media={<img alt="" data-testid="media" />}
          />
        </ScheduleTrack>
      </Schedule>,
    );
    expect(screen.getByTestId("media").parentElement).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  it("传 href：名称是链接；render 交给路由库的链接组件", () => {
    render(
      <Schedule label="一周" start="2026-10-05" end="2026-10-11">
        <ScheduleTrack label="活动">
          <ScheduleItem
            start="2026-10-05"
            end="2026-10-08"
            title="测绘"
            href="#survey"
          />
          <ScheduleItem
            start="2026-10-09"
            end="2026-10-10"
            title="补给"
            render={<RouterLink to="/supply" />}
          />
        </ScheduleTrack>
      </Schedule>,
    );
    expect(screen.getByRole("link", { name: "测绘" })).toHaveAttribute(
      "href",
      "#survey",
    );
    expect(screen.getByRole("link", { name: "补给" })).toHaveAttribute(
      "href",
      "/app/supply",
    );
    expect(screen.queryByRole("link", { name: /每日/ })).toBeNull();
  });

  it("类目竖轨是装饰：名称在这条轨的可访问名称里", () => {
    render(<October />);
    const track = screen.getByRole("region", { name: "活动" });
    const rail = screen.getByTestId("icon").closest("[aria-hidden=true]")!;
    expect(track).toContainElement(rail as HTMLElement);
    expect(rail).toHaveTextContent("活动");
    expect(rail).toHaveClass("sticky", "left-0");
  });

  it("不溢出时不占 Tab 停靠点；横向溢出时是一个有名称、能聚焦的区域", () => {
    const { container, unmount } = render(<October />);
    expect(container.firstElementChild).not.toHaveAttribute("tabindex");
    unmount();

    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        disconnect() {}
      },
    );
    vi.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockReturnValue(1040);
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(320);
    render(<October />);
    const region = screen.getByRole("region", { name: "十月排期" });
    expect(region).toHaveAttribute("tabindex", "0");
    expect(region).toHaveAttribute("data-overflowing");
    // 名称挪到了滚动的那一层上，里面不再重复一个同名的分组
    expect(screen.queryByRole("group", { name: "十月排期" })).toBeNull();
  });

  it("部件放在外面会报错", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<ScheduleTrack label="活动" />)).toThrow(/Schedule/);
    error.mockRestore();
  });
});
