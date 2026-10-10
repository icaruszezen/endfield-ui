import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import {
  ImageViewer,
  ImageViewerItem,
  type ImageViewerProps,
} from "./ImageViewer";

const shots = [
  { title: "三号管廊入口", description: "北段复测当天拍的。" },
  { title: "信标 B-12", description: "装在管壁的高处。" },
  { title: "滤芯入库", description: "十二件，分两箱。" },
  { title: "夜班交接", description: "交接单贴在终端旁边。" },
];

function Photos({
  count = shots.length,
  ...props
}: Partial<ImageViewerProps> & { count?: number }) {
  return (
    <ImageViewer aria-label="现场照片" {...props}>
      {shots.slice(0, count).map((shot, position) => (
        <ImageViewerItem
          key={shot.title}
          title={shot.title}
          description={shot.description}
        >
          <img src={`/photo-${position}.jpg`} alt="" />
        </ImageViewerItem>
      ))}
    </ImageViewer>
  );
}

const thumb = (title: string) =>
  screen.getByRole("button", { name: `查看大图：${title}` });
const viewer = () => screen.findByRole("dialog", { name: "现场照片" });
const count = (dialog: HTMLElement) =>
  dialog.querySelector("[data-count]")?.textContent ?? null;

describe("ImageViewer", () => {
  it("原地是一个有名称的缩略图列表，每张是一个带名称的按钮", () => {
    render(<Photos />);
    const list = screen.getByRole("list", { name: "现场照片" });
    const buttons = within(list).getAllByRole("button");
    expect(buttons).toHaveLength(4);
    expect(buttons[0]).toHaveAccessibleName("查看大图：三号管廊入口");
    expect(buttons[0]).toHaveAttribute("aria-haspopup", "dialog");
    expect(buttons[0]!.querySelector("img")).toHaveAttribute(
      "src",
      "/photo-0.jpg",
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("没有文字标题时按钮报第几张；也可以自己起名", () => {
    render(
      <ImageViewer aria-label="测绘图" viewLabel="放大">
        <ImageViewerItem>
          <img src="/a.jpg" alt="" />
        </ImageViewerItem>
        <ImageViewerItem aria-label="放大第十五幅">
          <img src="/b.jpg" alt="" />
        </ImageViewerItem>
      </ImageViewer>,
    );
    const buttons = screen.getAllByRole("button");
    expect(buttons[0]).toHaveAccessibleName("放大：第 1 张，共 2 张");
    expect(buttons[1]).toHaveAccessibleName("放大第十五幅");
  });

  it("点第几张，大图层就开在第几张：计数、标题、说明都是它的", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const onIndexChange = vi.fn();
    render(
      <Photos onOpenChange={onOpenChange} onIndexChange={onIndexChange} />,
    );
    await user.click(thumb("滤芯入库"));
    const dialog = await viewer();
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    expect(onIndexChange).toHaveBeenLastCalledWith(2);
    expect(count(dialog)).toBe("3 / 4");
    expect(within(dialog).getByText("滤芯入库")).toBeInTheDocument();
    expect(within(dialog).getByText("十二件，分两箱。")).toBeInTheDocument();
    // 整层是深色的局部主题
    expect(dialog).toHaveAttribute("data-theme", "dark");
  });

  it("翻页钮换张，说明区会播报第几张；到头时对应的钮禁用", async () => {
    const user = userEvent.setup();
    render(<Photos />);
    await user.click(thumb("三号管廊入口"));
    const dialog = await viewer();
    const previous = within(dialog).getByRole("button", { name: "上一张" });
    const next = within(dialog).getByRole("button", { name: "下一张" });
    expect(previous).toBeDisabled();

    await user.click(next);
    expect(count(dialog)).toBe("2 / 4");
    const live = within(dialog).getByText("信标 B-12").parentElement!;
    expect(live).toHaveAttribute("aria-live", "polite");
    expect(within(live).getByText("第 2 张，共 4 张")).toHaveClass("sr-only");
    expect(previous).toBeEnabled();

    await user.click(next);
    await user.click(next);
    expect(count(dialog)).toBe("4 / 4");
    expect(next).toBeDisabled();
  });

  it("翻到头：刚按的钮要禁用了，焦点交还给这一层，键盘还能接着翻", async () => {
    const user = userEvent.setup();
    render(<Photos count={2} />);
    await user.click(thumb("三号管廊入口"));
    const dialog = await viewer();
    await user.click(within(dialog).getByRole("button", { name: "下一张" }));
    expect(dialog).toHaveFocus();
    await user.keyboard("{ArrowLeft}");
    expect(count(dialog)).toBe("1 / 2");
  });

  it("loop：到头之后绕回另一头", async () => {
    const user = userEvent.setup();
    render(<Photos loop />);
    await user.click(thumb("夜班交接"));
    const dialog = await viewer();
    const next = within(dialog).getByRole("button", { name: "下一张" });
    expect(next).toBeEnabled();
    await user.click(next);
    expect(count(dialog)).toBe("1 / 4");
    await user.click(within(dialog).getByRole("button", { name: "上一张" }));
    expect(count(dialog)).toBe("4 / 4");
  });

  it("打开时焦点在这一层自己身上，方向键、Home、End 翻页；Tab 先到关闭钮", async () => {
    const user = userEvent.setup();
    render(<Photos />);
    await user.click(thumb("信标 B-12"));
    const dialog = await viewer();
    await waitFor(() => expect(dialog).toHaveFocus());
    await user.keyboard("{ArrowRight}");
    expect(count(dialog)).toBe("3 / 4");
    await user.keyboard("{End}");
    expect(count(dialog)).toBe("4 / 4");
    await user.keyboard("{Home}");
    expect(count(dialog)).toBe("1 / 4");
    await user.keyboard("{ArrowLeft}");
    expect(count(dialog)).toBe("1 / 4");

    // 舞台自己不占 Tab 停靠点
    expect(
      dialog.querySelector("[data-image-viewer-track]"),
    ).not.toHaveAttribute("tabindex");
    await user.tab();
    expect(within(dialog).getByRole("button", { name: "关闭" })).toHaveFocus();
  });

  it("焦点在关闭钮上时方向键也能翻", async () => {
    const user = userEvent.setup();
    render(<Photos />);
    await user.click(thumb("三号管廊入口"));
    const dialog = await viewer();
    within(dialog).getByRole("button", { name: "关闭" }).focus();
    await user.keyboard("{ArrowRight}");
    expect(count(dialog)).toBe("2 / 4");
  });

  it("Esc 关掉，焦点回到当前这一张的缩略图，不是当初点的那一张", async () => {
    const user = userEvent.setup();
    render(<Photos />);
    await user.click(thumb("三号管廊入口"));
    const dialog = await viewer();
    await user.click(within(dialog).getByRole("button", { name: "下一张" }));
    await user.click(within(dialog).getByRole("button", { name: "下一张" }));
    expect(count(dialog)).toBe("3 / 4");

    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    await waitFor(() => expect(thumb("滤芯入库")).toHaveFocus());
  });

  it("关闭钮关掉；点舞台上图以外的空处也关，点图不关", async () => {
    const user = userEvent.setup();
    render(<Photos />);

    await user.click(thumb("三号管廊入口"));
    let dialog = await viewer();
    await user.click(within(dialog).getByRole("button", { name: "关闭" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );

    await user.click(thumb("三号管廊入口"));
    dialog = await viewer();
    const slide = dialog.querySelector<HTMLElement>("[data-current]")!;
    await user.click(slide.querySelector("img")!);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await user.click(slide);
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });

  it("只渲染当前这张和左右各一张；不在眼前的是 inert 的", async () => {
    const user = userEvent.setup();
    render(<Photos />);
    await user.click(thumb("三号管廊入口"));
    const dialog = await viewer();
    const slides = [
      ...dialog.querySelectorAll<HTMLElement>("[aria-roledescription=幻灯片]"),
    ];
    expect(slides).toHaveLength(4);
    const rendered = () =>
      slides.map((slide) => slide.querySelector("img") !== null);
    expect(rendered()).toEqual([true, true, false, false]);
    // jsdom 不认 inert 这个属性，看标签上有没有写
    expect(slides.map((slide) => slide.hasAttribute("inert"))).toEqual([
      false,
      true,
      true,
      true,
    ]);
    expect(slides[1]).toHaveAttribute("aria-label", "第 2 张，共 4 张");

    await user.click(within(dialog).getByRole("button", { name: "下一张" }));
    await user.click(within(dialog).getByRole("button", { name: "下一张" }));
    expect(rendered()).toEqual([false, true, true, true]);
    expect(slides[2]).not.toHaveAttribute("inert");
  });

  it("大图取到之前是透明的，取到了才露出来；取不到的也露出来", async () => {
    const user = userEvent.setup();
    render(<Photos />);
    await user.click(thumb("三号管廊入口"));
    const dialog = await viewer();
    const [first, second] = [
      ...dialog.querySelectorAll<HTMLElement>("[aria-roledescription=幻灯片]"),
    ];

    expect(first).not.toHaveAttribute("data-loaded");
    expect(first).toHaveClass(
      "not-data-loaded:[&>img]:opacity-0",
      "[&>img]:transition-opacity",
    );
    // load 不冒泡：这一层是在捕获阶段听到的
    fireEvent.load(first!.querySelector("img")!);
    expect(first).toHaveAttribute("data-loaded");

    // 旁边那一张是它自己的事；取不到也要露出来，替代文字在那里
    expect(second).not.toHaveAttribute("data-loaded");
    fireEvent.error(second!.querySelector("img")!);
    expect(second).toHaveAttribute("data-loaded");
  });

  it("舞台的取景角在打开时落位，等整层淡入完了再动", async () => {
    const user = userEvent.setup();
    render(<Photos />);
    await user.click(thumb("三号管廊入口"));
    const dialog = await viewer();
    const brackets = dialog.querySelector(".corner-brackets")!;
    expect(brackets).toHaveClass("after:animate-bracket-in");
    expect(brackets.parentElement).toHaveClass(
      "[--bracket-delay:var(--duration-fast)]",
    );
  });

  it("只有一张：没有翻页钮和计数", async () => {
    const user = userEvent.setup();
    render(<Photos count={1} />);
    await user.click(thumb("三号管廊入口"));
    const dialog = await viewer();
    expect(count(dialog)).toBeNull();
    expect(
      within(dialog).queryByRole("button", { name: "下一张" }),
    ).not.toBeInTheDocument();
    expect(within(dialog).getByText("三号管廊入口")).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "关闭" })).toBeVisible();
  });

  it("thumbnail 是另给的小图：列表里用它，大图层里用子元素", async () => {
    const user = userEvent.setup();
    render(
      <ImageViewer aria-label="测绘图">
        <ImageViewerItem
          title="第十四幅"
          thumbnail={<img src="/small.jpg" alt="" />}
        >
          <img src="/large.jpg" alt="测绘图第十四幅" />
        </ImageViewerItem>
      </ImageViewer>,
    );
    const button = screen.getByRole("button", { name: "查看大图：第十四幅" });
    expect(button.querySelector("img")).toHaveAttribute("src", "/small.jpg");
    await user.click(button);
    const dialog = await screen.findByRole("dialog", { name: "测绘图" });
    expect(within(dialog).getByRole("img")).toHaveAttribute(
      "src",
      "/large.jpg",
    );
  });

  it("受控：开没开、开在第几张由外面决定", async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [open, setOpen] = useState(false);
      const [index, setIndex] = useState(0);
      return (
        <>
          <button
            type="button"
            onClick={() => {
              setIndex(3);
              setOpen(true);
            }}
          >
            看最后一张
          </button>
          <Photos
            open={open}
            onOpenChange={setOpen}
            index={index}
            onIndexChange={setIndex}
          />
        </>
      );
    }
    render(<Controlled />);
    await user.click(screen.getByRole("button", { name: "看最后一张" }));
    const dialog = await viewer();
    expect(count(dialog)).toBe("4 / 4");
    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });

  it("ratio 写在列表和每张缩略图上；className 和其余属性给列表", () => {
    render(<Photos ratio="1/1" className="grid-cols-4" id="photos" />);
    const list = screen.getByRole("list");
    expect(list).toHaveAttribute("data-ratio", "1/1");
    expect(list).toHaveAttribute("id", "photos");
    expect(list).toHaveClass("grid-cols-4");
    expect(thumb("三号管廊入口")).toHaveClass("aspect-square");
  });

  it("标签可以换", async () => {
    const user = userEvent.setup();
    render(
      <Photos
        viewLabel="View"
        previousLabel="Previous"
        nextLabel="Next"
        closeLabel="Close"
      />,
    );
    await user.click(
      screen.getByRole("button", { name: "View：三号管廊入口" }),
    );
    const dialog = await viewer();
    for (const name of ["Previous", "Next", "Close"]) {
      expect(within(dialog).getByRole("button", { name })).toBeInTheDocument();
    }
  });

  it("ImageViewerItem 放在外面会报错", () => {
    const quiet = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() =>
      render(
        <ImageViewerItem>
          <img src="/a.jpg" alt="" />
        </ImageViewerItem>,
      ),
    ).toThrow("ImageViewerItem 要直接放在 ImageViewer 里面");
    quiet.mockRestore();
  });
});
