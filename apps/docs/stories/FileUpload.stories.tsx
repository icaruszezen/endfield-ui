import {
  Button,
  Field,
  FileItem,
  FileUpload,
  type FileItemStatus,
} from "@endfield-ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useRef, useState, type FormEvent } from "react";

const MB = 1024 * 1024;

/* 文案全部虚构；文件是现编的几个字节 */
const meta = {
  title: "控件/FileUpload 文件上传",
  component: FileUpload,
  args: {
    "aria-label": "交接附件",
    multiple: true,
    accept: ".pdf,image/*",
    maxSize: 10 * MB,
    maxFiles: 5,
    description: "PDF 或图片，单个不超过 10 MB，最多 5 个",
    size: "md",
    disabled: false,
  },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md"] },
    value: { control: false },
    defaultValue: { control: false },
  },
  decorators: [
    (Story) => (
      <div className="max-w-md">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof FileUpload>;

export default meta;
type Story = StoryObj<typeof meta>;

const sample = (name: string, type: string, bytes: number) =>
  new File([new Uint8Array(bytes)], name, { type, lastModified: 1 });

const handover = () => sample("交接单-1009.pdf", "application/pdf", 1.4 * MB);
const photo = () => sample("北段管廊-现场.png", "image/png", 320 * 1024);

export const Playground: Story = {};

export const WithFiles: Story = {
  name: "已经选了几个",
  render: (args) => (
    <FileUpload {...args} defaultValue={[handover(), photo()]} />
  ),
};

export const Sizes: Story = {
  name: "两档尺寸",
  render: () => (
    <div className="flex flex-col gap-4">
      <FileUpload
        aria-label="附件（md）"
        description="PDF 或图片，单个不超过 10 MB"
      />
      <FileUpload
        aria-label="附件（sm）"
        size="sm"
        description="单个不超过 10 MB"
      />
    </div>
  ),
};

/* 只收一个：新选的替掉原来的 */
export const Single: Story = {
  name: "只收一个",
  render: () => (
    <FileUpload
      aria-label="站点平面图"
      accept="image/*"
      description="一张图片。再选一张会替掉这一张"
      defaultValue={[photo()]}
    />
  ),
};

type Upload = { status: FileItemStatus; progress: number };

function UploadingExample() {
  const [files, setFiles] = useState<File[]>(() => [handover(), photo()]);
  // 进度是使用方自己的事：这里用定时器假装在传，名字里带"现场"的那个会失败一次
  const [uploads, setUploads] = useState<Record<string, Upload>>({});
  const retried = useRef(new Set<string>());

  useEffect(() => {
    const timer = setInterval(() => {
      setUploads((current) => {
        const next = { ...current };
        for (const file of files) {
          const now = next[file.name] ?? { status: "uploading", progress: 0 };
          if (now.status !== "uploading") continue;
          const progress = Math.min(now.progress + 20, 100);
          const fails =
            file.name.includes("现场") && !retried.current.has(file.name);
          next[file.name] =
            fails && progress >= 60
              ? { status: "error", progress }
              : { status: progress === 100 ? "done" : "uploading", progress };
        }
        return next;
      });
    }, 600);
    return () => clearInterval(timer);
  }, [files]);

  return (
    <FileUpload
      aria-label="交接附件"
      multiple
      accept=".pdf,image/*"
      description="选了就传。PDF 或图片"
      value={files}
      onValueChange={setFiles}
      renderFile={(file, { remove }) => {
        const upload = uploads[file.name];
        return (
          <FileItem
            name={file.name}
            size={file.size}
            status={upload?.status ?? "uploading"}
            progress={upload?.progress ?? 0}
            error="网络断了，没传完。"
            onRetry={() => {
              retried.current.add(file.name);
              setUploads((current) => ({
                ...current,
                [file.name]: { status: "uploading", progress: 0 },
              }));
            }}
            onRemove={remove}
          />
        );
      }}
    />
  );
}

/* 要显示进度：用 renderFile 自己返回带状态的那一行。发请求是使用方的事 */
export const Uploading: Story = {
  name: "选了就传：每一行带进度",
  // 进度是定时器推的：文档页里同时开着好几个 story，不放进去
  tags: ["!autodocs"],
  render: () => <UploadingExample />,
};

/* 文件行单独用：列"已有的附件" */
export const Items: Story = {
  name: "文件行的几种状态",
  render: () => (
    <ul aria-label="已有的附件" className="flex flex-col gap-1">
      <li>
        <FileItem name="交接单-1008.pdf" size={1.2 * MB} href="#file" />
      </li>
      <li>
        <FileItem
          name="交接单-1009.pdf"
          size={1.4 * MB}
          status="uploading"
          progress={42}
          onRemove={() => {}}
        />
      </li>
      <li>
        <FileItem
          name="设备日志"
          size={48 * 1024}
          status="uploading"
          onRemove={() => {}}
        />
      </li>
      <li>
        <FileItem
          name="北段管廊-现场.png"
          size={320 * 1024}
          status="done"
          onRemove={() => {}}
        />
      </li>
      <li>
        <FileItem
          name="第七勘探区的首批测绘数据-全景拼接-未压缩.tiff"
          size={86 * MB}
          status="error"
          error="网络断了，没传完。"
          onRetry={() => {}}
          onRemove={() => {}}
        />
      </li>
      <li>
        <FileItem
          name="旧版平面图.png"
          size={2.1 * MB}
          disabled
          onRemove={() => {}}
        />
      </li>
    </ul>
  ),
};

function InFieldExample() {
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const files = data
      .getAll("attachments")
      .filter(
        (entry): entry is File => entry instanceof File && entry.size > 0,
      );
    setMissing(files.length === 0);
    setSubmitted(
      files.length === 0
        ? null
        : `attachments=${files.map((file) => file.name).join("|")}`,
    );
  };
  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Field
        label="交接附件"
        required
        help="PDF 或图片，单个不超过 10 MB，最多 3 个。"
        error={missing ? "还没有附件，至少放一个。" : undefined}
      >
        <FileUpload
          multiple
          accept=".pdf,image/*"
          maxSize={10 * MB}
          maxFiles={3}
          name="attachments"
          onValueChange={() => setMissing(false)}
        />
      </Field>
      <div className="flex items-center gap-4">
        <Button type="submit">提交</Button>
        <output className="font-tech text-xs text-ink-secondary">
          {submitted ?? "// 还没提交"}
        </output>
      </div>
    </form>
  );
}

export const InField: Story = {
  name: "放进字段，随表单提交",
  render: () => <InFieldExample />,
};

export const States: Story = {
  name: "状态：错误、禁用",
  render: () => (
    <div className="flex flex-col gap-4">
      <FileUpload aria-label="错误" invalid description="至少放一个文件" />
      <FileUpload
        aria-label="禁用"
        disabled
        description="归档之后不能再改附件"
        defaultValue={[handover()]}
      />
    </div>
  ),
};

export const Narrow: Story = {
  name: "窄容器里不溢出",
  render: () => (
    <div className="w-56 border border-dashed border-line-strong p-3">
      <FileUpload
        aria-label="交接附件"
        multiple
        description="PDF 或图片，单个不超过 10 MB"
        defaultValue={[
          sample(
            "第七勘探区的首批测绘数据-全景拼接.pdf",
            "application/pdf",
            3.2 * MB,
          ),
        ]}
      />
    </div>
  ),
};
