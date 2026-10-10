import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { Field } from "../field/Field";
import { FileItem } from "./FileItem";
import { FileUpload, type FileUploadProps } from "./FileUpload";

const KB = 1024;
const MB = 1024 * KB;

const file = (name: string, type: string, size = 2 * KB, lastModified = 1) => {
  const made = new File(["x"], name, { type, lastModified });
  Object.defineProperty(made, "size", { value: size });
  return made;
};

const pdf = file("交接单.pdf", "application/pdf", 1.5 * MB);
const png = file("现场.png", "image/png", 300 * KB);
const exe = file("工具.exe", "application/x-msdownload");
const big = file("全景.png", "image/png", 12 * MB);

const input = () =>
  document.querySelector<HTMLInputElement>("input[type=file]")!;
const zone = () => document.querySelector<HTMLElement>("[data-dropzone]")!;
const names = () =>
  screen.queryByRole("list", { name: "已选的文件" })
    ? within(screen.getByRole("list", { name: "已选的文件" }))
        .getAllByRole("listitem")
        .map((item) => item.querySelector("[title]")!.textContent)
    : [];

/** jsdom 没有 DataTransfer：拖放事件里带一个够用的假的 */
const transfer = (files: File[]) => ({
  dataTransfer: { files, types: ["Files"] },
});

function Example(props: Partial<FileUploadProps>) {
  return <FileUpload aria-label="交接附件" {...props} />;
}

describe("FileUpload", () => {
  it("里面是一个真的文件输入框：名称、accept、multiple、name 都在它上面", () => {
    render(<Example multiple accept=".pdf,image/*" name="attachments" />);
    const field = input();
    expect(field).toHaveAccessibleName("交接附件");
    expect(field).toHaveAttribute("accept", ".pdf,image/*");
    expect(field).toHaveAttribute("name", "attachments");
    expect(field.multiple).toBe(true);
    // 看不见，但铺满投放区：点哪儿都是它
    expect(field).toHaveClass("absolute", "inset-0", "opacity-0");
    expect(zone()).toContainElement(field);
  });

  it("投放区的字：一行说明加带下划线的几个字，下面是限制", () => {
    render(<Example description="PDF 或图片，单个不超过 10 MB" />);
    expect(zone()).toHaveTextContent("把文件拖到这里，或者选择文件");
    expect(screen.getByText("选择文件")).toHaveClass("underline");
    expect(screen.getByText("PDF 或图片，单个不超过 10 MB")).toHaveClass(
      "text-ink-secondary",
    );
    expect(zone()).toHaveClass("border-dashed", "bg-surface-sunken");
  });

  it("选文件：列出来，每个文件一行，带扩展名和大小", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Example multiple onValueChange={onValueChange} />);
    expect(screen.queryByRole("list")).not.toBeInTheDocument();

    await user.upload(input(), [pdf, png]);
    expect(onValueChange).toHaveBeenLastCalledWith([pdf, png]);
    expect(names()).toEqual(["交接单.pdf", "现场.png"]);
    const [first] = screen.getAllByRole("listitem");
    expect(first).toHaveTextContent("PDF");
    expect(first).toHaveTextContent("1.5 MB");
    expect(screen.getByText("已选 2 个文件")).toHaveAttribute(
      "aria-live",
      "polite",
    );
  });

  it("再选一次是接着加；同一个文件不重复加", async () => {
    const user = userEvent.setup();
    render(<Example multiple />);
    await user.upload(input(), [pdf]);
    await user.upload(input(), [
      png,
      file("交接单.pdf", "application/pdf", 1.5 * MB),
    ]);
    expect(names()).toEqual(["交接单.pdf", "现场.png"]);
    expect(document.querySelector("[data-rejections]")).toBeEmptyDOMElement();
  });

  it("不是 multiple：新选的替掉原来的", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Example onValueChange={onValueChange} />);
    await user.upload(input(), pdf);
    expect(names()).toEqual(["交接单.pdf"]);
    await user.upload(input(), png);
    expect(names()).toEqual(["现场.png"]);
    expect(onValueChange).toHaveBeenLastCalledWith([png]);
  });

  it("拖进来：拖到上面时线变实、出取景角、字换一句；放下就加进去", () => {
    render(<Example multiple />);
    fireEvent.dragEnter(zone(), transfer([pdf]));
    expect(zone()).toHaveAttribute("data-dragging");
    expect(zone()).toHaveClass("border-solid", "border-ink");
    expect(zone()).not.toHaveClass("border-dashed");
    expect(zone().querySelector("[data-brackets]")).toHaveClass(
      "corner-brackets",
      "after:animate-bracket-in",
    );
    expect(zone()).toHaveTextContent("松开，放进来");

    fireEvent.drop(zone(), transfer([pdf, png]));
    expect(zone()).not.toHaveAttribute("data-dragging");
    expect(zone().querySelector("[data-brackets]")).toBeNull();
    expect(zone()).toHaveTextContent("把文件拖到这里，或者选择文件");
    expect(names()).toEqual(["交接单.pdf", "现场.png"]);
  });

  it("拖过里面的子元素不会闪：进了两层、出了一层，还算在上面", () => {
    render(<Example />);
    fireEvent.dragEnter(zone(), transfer([pdf]));
    fireEvent.dragEnter(input(), transfer([pdf]));
    fireEvent.dragLeave(zone(), transfer([pdf]));
    expect(zone()).toHaveAttribute("data-dragging");
    fireEvent.dragLeave(input(), transfer([pdf]));
    expect(zone()).not.toHaveAttribute("data-dragging");
  });

  it("拖的不是文件（一段文字）：不理", () => {
    render(<Example />);
    fireEvent.dragEnter(zone(), {
      dataTransfer: { files: [], types: ["text/plain"] },
    });
    expect(zone()).not.toHaveAttribute("data-dragging");
  });

  it("文件夹不收", () => {
    render(<Example multiple />);
    const item = (entry: File, isDirectory: boolean) => ({
      kind: "file",
      getAsFile: () => entry,
      webkitGetAsEntry: () => ({ isDirectory }),
    });
    fireEvent.drop(zone(), {
      dataTransfer: {
        types: ["Files"],
        files: [],
        items: [item(pdf, false), item(file("照片", ""), true)],
      },
    });
    expect(names()).toEqual(["交接单.pdf"]);
  });

  it("把关：类型不对、太大、个数超了的不加，下面出一行说明，onReject 拿到原因", () => {
    const onReject = vi.fn();
    render(
      <Example
        multiple
        accept=".pdf,image/*"
        maxSize={10 * MB}
        maxFiles={2}
        onReject={onReject}
      />,
    );
    const third = file("草图.png", "image/png");
    fireEvent.drop(zone(), transfer([exe, big, pdf, png, third]));

    expect(names()).toEqual(["交接单.pdf", "现场.png"]);
    expect(onReject).toHaveBeenCalledTimes(1);
    expect(onReject.mock.calls[0]![0]).toEqual([
      { file: exe, reason: "type" },
      { file: big, reason: "size" },
      { file: third, reason: "count" },
    ]);
    const line = document.querySelector("[data-rejections]")!;
    expect(line).toHaveAttribute("aria-live", "polite");
    expect(line).toHaveTextContent(
      "3 个文件没有加进来：工具.exe 类型不对；全景.png 超过 10 MB；草图.png 超出个数上限（最多 2 个）",
    );
    expect(line.querySelector("p")).toHaveClass("text-danger");
  });

  it("下一次加文件时那一行换掉；都合格就没有了", () => {
    render(<Example multiple accept=".pdf" />);
    fireEvent.drop(zone(), transfer([exe]));
    const line = document.querySelector("[data-rejections]")!;
    expect(line).toHaveTextContent("1 个文件没有加进来");
    fireEvent.drop(zone(), transfer([pdf]));
    expect(line).toBeEmptyDOMElement();
  });

  it("只收一个时一次拖进来几个：第一个合格的留下，其余算超了；一个合格的都没有时原来的留着", () => {
    const onReject = vi.fn();
    render(<Example accept=".pdf,image/*" onReject={onReject} />);
    fireEvent.drop(zone(), transfer([exe, pdf, png]));
    expect(names()).toEqual(["交接单.pdf"]);
    expect(onReject.mock.calls[0]![0]).toEqual([
      { file: exe, reason: "type" },
      { file: png, reason: "count" },
    ]);

    fireEvent.drop(zone(), transfer([exe]));
    expect(names()).toEqual(["交接单.pdf"]);
  });

  it("移除：焦点落到下一行的移除钮，没有下一行就是上一行，一个不剩回到投放区", async () => {
    const user = userEvent.setup();
    const third = file("草图.png", "image/png");
    render(<Example multiple defaultValue={[pdf, png, third]} />);
    const remove = (name: string) =>
      screen.getByRole("button", { name: `移除${name}` });

    await user.click(remove("现场.png"));
    expect(names()).toEqual(["交接单.pdf", "草图.png"]);
    expect(remove("草图.png")).toHaveFocus();

    await user.click(remove("草图.png"));
    expect(remove("交接单.pdf")).toHaveFocus();

    await user.click(remove("交接单.pdf"));
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
    expect(input()).toHaveFocus();
  });

  it("受控：只报告，列的是传进来的值", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    function Controlled() {
      const [value, setValue] = useState<File[]>([pdf]);
      return (
        <Example
          multiple
          value={value}
          onValueChange={(next) => {
            onValueChange(next);
            // 只留 PDF
            setValue(next.filter((item) => item.name.endsWith(".pdf")));
          }}
        />
      );
    }
    render(<Controlled />);
    await user.upload(input(), png);
    expect(onValueChange).toHaveBeenLastCalledWith([pdf, png]);
    expect(names()).toEqual(["交接单.pdf"]);
  });

  it("新加进来的那一行淡入；一开始就有的不动", async () => {
    const user = userEvent.setup();
    render(<Example multiple defaultValue={[pdf]} />);
    const rows = () => screen.getAllByRole("listitem");
    expect(rows()[0]).not.toHaveClass("animate-fade-in");

    await user.upload(input(), png);
    expect(rows()[0]).not.toHaveClass("animate-fade-in");
    expect(rows()[1]).toHaveClass(
      "animate-fade-in",
      "[animation-duration:var(--duration-fast)]",
    );
  });

  it("只收一个：替上来的那一个也是新来的；自己画的行同样淡入", async () => {
    const user = userEvent.setup();
    render(
      <Example
        defaultValue={[pdf]}
        renderFile={(item) => <FileItem name={item.name} />}
      />,
    );
    expect(screen.getByRole("listitem")).not.toHaveClass("animate-fade-in");

    await user.upload(input(), png);
    expect(names()).toEqual(["现场.png"]);
    // 淡入写在列表的那一层上，不在使用方画的那一行里
    expect(screen.getByRole("listitem")).toHaveClass("animate-fade-in");
  });

  it("renderFile：自己画那一行，带上进度；remove 仍然管用", async () => {
    const user = userEvent.setup();
    render(
      <Example
        multiple
        defaultValue={[pdf, png]}
        renderFile={(item, { remove, index }) => (
          <FileItem
            name={item.name}
            size={item.size}
            status="uploading"
            progress={index === 0 ? 40 : undefined}
            onRemove={remove}
          />
        )}
      />,
    );
    const bars = screen.getAllByRole("progressbar");
    expect(bars[0]).toHaveAccessibleName("交接单.pdf的上传进度");
    expect(bars[0]).toHaveAttribute("aria-valuenow", "40");
    // 不传 progress 就是不确定进度
    expect(bars[1]).not.toHaveAttribute("aria-valuenow");

    await user.click(screen.getByRole("button", { name: "移除交接单.pdf" }));
    expect(names()).toEqual(["现场.png"]);
  });

  it("禁用：选不了、拖进来不收，线和字降一档", () => {
    render(<Example disabled defaultValue={[pdf]} />);
    expect(input()).toBeDisabled();
    expect(zone()).toHaveClass("border-line", "text-ink-disabled");
    fireEvent.dragEnter(zone(), transfer([png]));
    expect(zone()).not.toHaveAttribute("data-dragging");
    fireEvent.drop(zone(), transfer([png]));
    expect(names()).toEqual(["交接单.pdf"]);
    expect(
      screen.getByRole("button", { name: "移除交接单.pdf" }),
    ).toBeDisabled();
  });

  it("放进 Field：标签、帮助、错误、必填都跟着字段", () => {
    const { rerender } = render(
      <Field label="交接附件" help="PDF 或图片。" required>
        <FileUpload />
      </Field>,
    );
    const field = input();
    expect(field).toHaveAccessibleName("交接附件");
    expect(field).toHaveAccessibleDescription("PDF 或图片。");
    expect(field).toBeRequired();
    expect(zone()).toHaveClass("border-line-strong");

    rerender(
      <Field label="交接附件" error="至少放一个文件。">
        <FileUpload />
      </Field>,
    );
    expect(field).toBeInvalid();
    expect(zone()).toHaveClass("border-danger", "border-dashed");
  });

  it("两档尺寸；className 给最外层，ref 给文件输入框", () => {
    const ref = { current: null as HTMLInputElement | null };
    const { rerender } = render(<Example ref={ref} className="max-w-md" />);
    expect(ref.current).toBe(input());
    expect(zone().parentElement).toHaveClass("max-w-md");
    expect(zone()).toHaveClass("py-4");
    rerender(<Example size="sm" />);
    expect(zone()).toHaveClass("min-h-10", "py-2");
  });

  it("那几句话可以换", () => {
    render(
      <Example
        accept=".pdf"
        title="Drop files here, or"
        browseLabel="browse"
        labels={{
          list: "Files",
          rejected: (count) => `${count} not added`,
          type: "wrong type",
        }}
        removeLabel={(name) => `Remove ${name}`}
        defaultValue={[pdf]}
      />,
    );
    expect(zone()).toHaveTextContent("Drop files here, orbrowse");
    expect(screen.getByRole("list", { name: "Files" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Remove 交接单.pdf" }),
    ).toBeInTheDocument();
    fireEvent.drop(zone(), transfer([exe]));
    expect(document.querySelector("[data-rejections]")).toHaveTextContent(
      "1 not added：工具.exe wrong type",
    );
  });
});

describe("FileItem", () => {
  it("只是列出来：扩展名标签是装饰，文件名过长时完整的在 title 里", () => {
    render(<FileItem name="第七勘探区测绘记录.final.PDF" size={1536} />);
    const name = screen.getByText("第七勘探区测绘记录.final.PDF");
    expect(name).toHaveAttribute("title", "第七勘探区测绘记录.final.PDF");
    expect(name).toHaveClass("truncate");
    const tag = screen.getByText("PDF");
    expect(tag).toHaveAttribute("aria-hidden", "true");
    expect(tag).toHaveAttribute("data-variant", "inverse");
    expect(tag).toHaveAttribute("data-extension");
    expect(screen.getByText("1.5 KB")).toHaveClass("font-tech", "tabular-nums");
    // 没传 onRemove 就没有移除钮
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("没有扩展名的写 FILE", () => {
    render(<FileItem name="README" />);
    expect(screen.getByText("FILE")).toBeInTheDocument();
  });

  it("uploading：行底一条进度条，大小的位置换成百分比", () => {
    const { container } = render(
      <FileItem name="a.pdf" size={2048} status="uploading" progress={41.6} />,
    );
    expect(container.firstElementChild).toHaveAttribute(
      "data-status",
      "uploading",
    );
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "41.6",
    );
    expect(container.querySelector("[data-meta]")).toHaveTextContent("42%");
    expect(screen.queryByText("2 KB")).not.toBeInTheDocument();
  });

  it("done：一个成功图标，读屏多听到一句", () => {
    render(<FileItem name="a.pdf" size={2048} status="done" />);
    expect(screen.getByText("已上传")).toHaveClass("sr-only");
    expect(screen.getByText("2 KB")).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("error：文件名下面一行说明；传了 onRetry 多一个重试", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    const { rerender } = render(
      <FileItem name="a.pdf" status="error" error="网络断了，没传完。" />,
    );
    expect(screen.getByText("网络断了，没传完。").parentElement).toHaveClass(
      "text-danger",
    );
    expect(screen.queryByRole("button")).not.toBeInTheDocument();

    rerender(
      <FileItem
        name="a.pdf"
        status="error"
        error="网络断了，没传完。"
        onRetry={onRetry}
      />,
    );
    await user.click(screen.getByRole("button", { name: "重试" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("移除钮有名称；点了触发 onRemove", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    render(<FileItem name="a.pdf" onRemove={onRemove} />);
    await user.click(screen.getByRole("button", { name: "移除a.pdf" }));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it("传了 href 文件名是链接；render 换成你给的元素", () => {
    const { rerender } = render(
      <FileItem name="a.pdf" href="/files/a.pdf" target="_blank" />,
    );
    const link = screen.getByRole("link", { name: "a.pdf" });
    expect(link).toHaveAttribute("href", "/files/a.pdf");
    expect(link).toHaveAttribute("target", "_blank");

    rerender(
      <FileItem name="a.pdf" render={<a href="/routed" data-router="" />} />,
    );
    expect(screen.getByRole("link", { name: "a.pdf" })).toHaveAttribute(
      "data-router",
    );
  });
});
