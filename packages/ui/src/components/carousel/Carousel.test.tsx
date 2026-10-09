import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Carousel, CarouselSlide } from "./Carousel";

const slides = [
  { title: "线路测绘", description: "沿着管廊布设信标。" },
  { title: "物资调度", description: "把批次派往各个站点。" },
  { title: "站点维护", description: "定期更换滤芯与电池。" },
];

function Gallery(props: Partial<React.ComponentProps<typeof Carousel>>) {
  return (
    <Carousel aria-label="玩法介绍" {...props}>
      {slides.map((slide, position) => (
        <CarouselSlide
          key={slide.title}
          title={slide.title}
          description={slide.description}
        >
          <img src={`/shot-${position}.png`} alt="" />
          {position === 1 && <a href="#more">了解调度</a>}
        </CarouselSlide>
      ))}
    </Carousel>
  );
}

const button = (name: string) => screen.getByRole("button", { name });
const slideAt = (position: number) =>
  screen
    .getAllByRole("group", { hidden: true })
    .filter((group) => group.matches("[aria-roledescription=幻灯片]"))[
    position
  ]!;

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("Carousel", () => {
  it("是一个有名称的分组，角色描述是轮播；每一张报告自己是第几张", () => {
    render(<Gallery />);
    const carousel = screen.getByRole("group", { name: "玩法介绍" });
    expect(carousel).toHaveAttribute("aria-roledescription", "轮播");
    expect(slideAt(0)).toHaveAttribute("aria-label", "第 1 张，共 3 张");
    expect(slideAt(2)).toHaveAttribute("aria-label", "第 3 张，共 3 张");
  });

  it("媒体下面是计数和当前这一张的标题、正文", () => {
    render(<Gallery />);
    // 看得见的计数只给眼睛：同样的话说明区里有一句隐藏的
    expect(
      screen.getByText("1 / 3").closest("[aria-hidden=true]"),
    ).not.toBeNull();
    expect(screen.getByText("线路测绘")).toBeVisible();
    expect(screen.getByText("沿着管廊布设信标。")).toBeVisible();
    expect(screen.queryByText("物资调度")).not.toBeInTheDocument();
  });

  it("翻页钮换张：计数、标题跟着换，说明区会播报第几张", async () => {
    const user = userEvent.setup();
    const onIndexChange = vi.fn();
    render(<Gallery onIndexChange={onIndexChange} />);
    await user.click(button("下一张"));
    expect(onIndexChange).toHaveBeenLastCalledWith(1);
    expect(screen.getByText("2 / 3")).toBeInTheDocument();

    const live = screen.getByText("物资调度").parentElement!;
    expect(live).toHaveAttribute("aria-live", "polite");
    expect(within(live).getByText("第 2 张，共 3 张")).toHaveClass("sr-only");
    expect(within(live).getByText("把批次派往各个站点。")).toBeInTheDocument();
  });

  it("到头时对应的翻页钮禁用", async () => {
    const user = userEvent.setup();
    render(<Gallery />);
    expect(button("上一张")).toBeDisabled();
    expect(button("下一张")).toBeEnabled();
    await user.click(button("下一张"));
    expect(button("上一张")).toBeEnabled();
    await user.click(button("下一张"));
    expect(button("下一张")).toBeDisabled();
    expect(screen.getByText("3 / 3")).toBeInTheDocument();
  });

  it("翻到头：刚按的翻页钮要禁用了，焦点交给媒体，键盘还能接着翻", async () => {
    const user = userEvent.setup();
    render(<Gallery defaultIndex={1} />);
    await user.click(button("下一张"));
    const track = slideAt(0).parentElement!;
    expect(track).toHaveFocus();
    await user.keyboard("{ArrowLeft}");
    expect(screen.getByText("2 / 3")).toBeInTheDocument();
  });

  it("loop：到头之后绕回另一头", async () => {
    const user = userEvent.setup();
    render(<Gallery loop defaultIndex={2} />);
    expect(button("下一张")).toBeEnabled();
    await user.click(button("下一张"));
    expect(screen.getByText("1 / 3")).toBeInTheDocument();
    await user.click(button("上一张"));
    expect(screen.getByText("3 / 3")).toBeInTheDocument();
  });

  it("键盘：焦点在媒体上时方向键翻页，Home / End 到两头", async () => {
    const user = userEvent.setup();
    render(<Gallery />);
    const track = slideAt(0).parentElement!;
    track.focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByText("2 / 3")).toBeInTheDocument();
    await user.keyboard("{End}");
    expect(screen.getByText("3 / 3")).toBeInTheDocument();
    await user.keyboard("{Home}");
    expect(screen.getByText("1 / 3")).toBeInTheDocument();
    await user.keyboard("{ArrowLeft}");
    expect(screen.getByText("1 / 3")).toBeInTheDocument();
  });

  it("不在眼前的那几张是 inert 的", async () => {
    const user = userEvent.setup();
    render(<Gallery />);
    expect(slideAt(0)).not.toHaveAttribute("inert");
    expect(slideAt(1)).toHaveAttribute("inert");
    expect(slideAt(2)).toHaveAttribute("inert");

    await user.click(button("下一张"));
    expect(slideAt(0)).toHaveAttribute("inert");
    expect(slideAt(1)).not.toHaveAttribute("inert");
  });

  it("受控：第几张由外面决定", async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [index, setIndex] = useState(2);
      return (
        <>
          <Gallery index={index} onIndexChange={setIndex} />
          <button type="button" onClick={() => setIndex(0)}>
            回到开头
          </button>
        </>
      );
    }
    render(<Controlled />);
    expect(screen.getByText("3 / 3")).toBeInTheDocument();
    await user.click(button("回到开头"));
    expect(screen.getByText("1 / 3")).toBeInTheDocument();
    expect(screen.getByText("线路测绘")).toBeInTheDocument();
  });

  it("下标变了轨道滚过去", async () => {
    const user = userEvent.setup();
    const scrollTo = vi.fn();
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(400);
    HTMLElement.prototype.scrollTo = scrollTo;
    try {
      render(<Gallery />);
      await user.click(button("下一张"));
      expect(scrollTo).toHaveBeenLastCalledWith({
        left: 400,
        behavior: "smooth",
      });
    } finally {
      delete (HTMLElement.prototype as { scrollTo?: unknown }).scrollTo;
    }
  });

  it("用户自己滑：滚动停稳之后由停下的位置定下标", () => {
    vi.useFakeTimers();
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(400);
    const onIndexChange = vi.fn();
    render(<Gallery onIndexChange={onIndexChange} />);
    const track = slideAt(0).parentElement!;

    // 滑的途中路过第二张：还没停，不改
    track.scrollLeft = 380;
    fireEvent.scroll(track);
    act(() => {
      vi.advanceTimersByTime(60);
    });
    expect(onIndexChange).not.toHaveBeenCalled();

    track.scrollLeft = 800;
    fireEvent.scroll(track);
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(onIndexChange).toHaveBeenLastCalledWith(2);
    expect(screen.getByText("3 / 3")).toBeInTheDocument();
  });

  it("indicator：计数旁边多一排短横，同样只给眼睛看", () => {
    const { container, rerender } = render(<Gallery />);
    expect(container.querySelector("[data-current].w-8")).toBeNull();
    rerender(<Gallery indicator />);
    const dash = container.querySelector(".w-8");
    expect(dash).not.toBeNull();
    expect(dash!.closest("[aria-hidden=true]")).not.toBeNull();
  });

  it("宽高比写在轨道上", () => {
    const { rerender } = render(<Gallery />);
    const track = () => slideAt(0).parentElement!;
    expect(track()).toHaveClass("aspect-video");
    rerender(<Gallery ratio="21/9" />);
    expect(track()).toHaveClass("aspect-21/9");
  });

  it("CarouselSlide 放在外面会报错", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() =>
      render(
        <CarouselSlide>
          <img alt="" />
        </CarouselSlide>,
      ),
    ).toThrow(/Carousel/);
    error.mockRestore();
  });
});
