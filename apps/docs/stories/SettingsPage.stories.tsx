import {
  Accordion,
  AccordionItem,
  Alert,
  Breadcrumb,
  BreadcrumbItem,
  Button,
  Checkbox,
  Combobox,
  Countdown,
  EmptyState,
  Field,
  FileUpload,
  FilterChip,
  Input,
  List,
  ListRow,
  Panel,
  PanelBody,
  PanelHeader,
  Progress,
  Radio,
  RadioGroup,
  Select,
  ResourceChip,
  SectionTitle,
  Segment,
  SegmentedControl,
  Slider,
  Stat,
  Step,
  Steps,
  Switch,
  ToastProvider,
  useToast,
  Tag,
  TagInput,
  Textarea,
} from "@endfield-ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState, type FormEvent } from "react";
import { FuelIcon, OreIcon } from "./_shared/ResourceIcons";
import { stationGroups } from "./_shared/stations";

/**
 * 用表单与反馈类控件搭一个设置页。文案与数据全部虚构。
 * 保存成功只是一句确认，用会自己消失的轻提示；没填对要用户处理，用常驻的提示条。
 */
const meta = {
  title: "示例/设置页",
  parameters: { controls: { disable: true } },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const DAY = 86_400_000;
const opened = Date.now();

const shifts = [
  { id: "a", name: "早班", time: "06:00 – 14:00", people: "4 人" },
  { id: "b", name: "中班", time: "14:00 – 22:00", people: "3 人" },
  { id: "c", name: "夜班", time: "22:00 – 06:00", people: "2 人" },
];

const categories = ["新闻", "公告", "维护", "活动"];

const regions = [
  { value: "valley", label: "四号谷地" },
  { value: "ridge", label: "北岭" },
  { value: "basin", label: "盐湖盆地" },
  { value: "delta", label: "三角洲（未开放）", disabled: true },
];

const channels = [
  { value: "site", label: "站内信" },
  { value: "mail", label: "邮件" },
  { value: "pager", label: "值班呼叫" },
  { value: "radio", label: "无线电（未接入）", disabled: true },
];

const cadences = [
  { value: "shift", label: "每班一次" },
  { value: "daily", label: "每天一次" },
  { value: "weekly", label: "每周一次" },
];

function Settings() {
  const toast = useToast();
  const [codename, setCodename] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [shift, setShift] = useState("a");
  const [subscribed, setSubscribed] = useState(["公告", "维护"]);

  const codenameError =
    submitted && codename.trim() === ""
      ? "代号不能为空，请填写两到十二个字母。"
      : undefined;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (codename.trim() !== "") {
      toast({ message: "设置已保存", tone: "success" });
    }
  };

  return (
    <div className="@container mx-auto flex max-w-3xl flex-col gap-10">
      <header className="flex flex-col gap-6">
        <Breadcrumb>
          <BreadcrumbItem href="#station">站点</BreadcrumbItem>
          <BreadcrumbItem href="#seventh">第七勘探队</BreadcrumbItem>
          <BreadcrumbItem current>设置</BreadcrumbItem>
        </Breadcrumb>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionTitle latin="Settings" level={1}>
            站点设置
          </SectionTitle>
          <div className="flex flex-wrap items-center gap-2">
            <ResourceChip icon={<FuelIcon />} label="燃料 1,280">
              1,280
            </ResourceChip>
            <ResourceChip icon={<OreIcon />} label="矿样 64">
              64
            </ResourceChip>
            <Countdown to={opened + 3 * DAY + 4 * 3_600_000} />
          </div>
        </div>
      </header>

      <section className="flex flex-col gap-6">
        {/* 这个站走到了哪一步；下面的数字是当前这一步的进度 */}
        <Steps aria-label="建站流程" current={1}>
          <Step title="建站" description="选址、供电、通信" />
          <Step title="测绘" description="布设信标，逐段量测" />
          <Step title="复核" description="现场和站里各过一遍" />
          <Step title="归档" description="按站点和月份存放" />
        </Steps>
        <div className="flex flex-wrap items-end gap-x-12 gap-y-6">
          <Stat size="lg" label="采样点" value="128" unit="处" delta="+12" />
          <Stat label="已完成" value="96" unit="处" />
          <Stat label="待复核" value="7" unit="处" delta="−3" trend="down" />
        </div>
        <Progress
          value={96}
          max={128}
          showValue
          formatValue={(value, max) => `${value} / ${max}`}
          aria-label="测绘进度"
        />
      </section>

      <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-10">
        {codenameError && (
          <Alert tone="danger" title="有 1 项没有填对">
            <a
              href="#settings-codename"
              className="underline underline-offset-4"
            >
              代号
            </a>
            不能为空。
          </Alert>
        )}

        <section className="flex flex-col gap-6">
          <SectionTitle variant="plain">基本信息</SectionTitle>
          <p className="text-sm text-ink-secondary">
            带
            <span
              aria-hidden="true"
              className="mx-1.5 inline-block size-1.5 rotate-45 bg-accent-ink align-middle"
            />
            的是必填项。
          </p>
          <div className="grid gap-6 @2xl:grid-cols-2">
            <Field
              label="代号"
              required
              help="两到十二个字母。"
              error={codenameError}
              controlId="settings-codename"
            >
              <Input
                value={codename}
                onChange={(event) => setCodename(event.target.value)}
                placeholder="例如 SEVENTH"
                autoComplete="off"
              />
            </Field>
            <Field label="联络频段" help="三位数字。">
              <Input inputMode="numeric" defaultValue="142" end="MHz" />
            </Field>
            <Field label="所属地区" help="决定默认的补给线。">
              <Select items={regions} defaultValue="ridge" name="region" />
            </Field>
            <Field label="上报周期">
              <Select
                items={cadences}
                placeholder="请选择"
                name="cadence"
                panelVariant="strong"
              />
            </Field>
          </div>
          <Field label="通知渠道" help="可以多选。一个都不选就是不通知。">
            <Select
              multiple
              items={channels}
              defaultValue={["site", "mail"]}
              name="channels"
              placeholder="不通知"
            />
          </Field>

          {/* 二十几个站，下拉里翻不过来：用能打字的组合框 */}
          <Field
            label="常驻站点"
            help="打几个字就能找到，也可以输入编号（N-07）。"
          >
            <Combobox
              items={stationGroups}
              defaultValue="n7"
              name="station"
              placeholder="输入站名或编号"
            />
          </Field>

          {/* 自己打出来的一串短词：回车或逗号加一个 */}
          <Field
            label="站点标签"
            help="回车或逗号分开，最多八个。粘贴一串也行。"
          >
            <TagInput
              name="tags"
              max={8}
              defaultValue={["北岭", "管廊"]}
              placeholder="输入后按回车"
            />
          </Field>

          <Field label="交接备注" help="写给下一班的人看。">
            <Textarea
              showCount
              maxLength={200}
              defaultValue="北段管廊的第二个采样点有渗水，取样前先确认排水泵已经开启。"
            />
          </Field>

          {/* 只管选和列：真要上传时，由页面自己发请求、给每一行进度 */}
          <Field
            label="交接附件"
            help="PDF 或图片，单个不超过 10 MB，最多 3 个。"
          >
            <FileUpload
              multiple
              accept=".pdf,image/*"
              maxSize={10 * 1024 * 1024}
              maxFiles={3}
              name="attachments"
            />
          </Field>
        </section>

        <section className="flex flex-col gap-6">
          <SectionTitle variant="plain">测绘</SectionTitle>
          <div className="grid gap-6 @2xl:grid-cols-2">
            <Field group label="测绘精度" help="精度越高，单点耗时越长。">
              <RadioGroup defaultValue="standard">
                <Radio value="draft">草图</Radio>
                <Radio value="standard">标准</Radio>
                <Radio value="fine">精细</Radio>
              </RadioGroup>
            </Field>
            <Field group label="归档时同时保存">
              <Checkbox defaultChecked>原始读数</Checkbox>
              <Checkbox defaultChecked>现场照片</Checkbox>
              <Checkbox>设备日志</Checkbox>
            </Field>
          </div>
        </section>

        <section className="flex flex-col gap-6">
          <SectionTitle variant="plain">通知</SectionTitle>
          <div className="flex flex-col">
            <Switch defaultChecked>自动同步测绘数据</Switch>
            <Switch>夜间只接收紧急告警</Switch>
            <Switch disabled>向上级站点抄送（需要管理员权限）</Switch>
          </div>
          {/* 两个短选项，一眼看全：分段选择。值随表单提交 */}
          <Field label="时间显示" help="只影响这台终端上的告警时间。">
            <SegmentedControl name="clock" defaultValue="24">
              <Segment value="24">24 小时</Segment>
              <Segment value="12">12 小时</Segment>
            </SegmentedControl>
          </Field>
          <Field label="告警音量" help="0 是静音。值随表单提交。">
            <Slider
              name="volume"
              defaultValue={60}
              step={5}
              showValue
              marks={[
                { value: 0, label: "静音" },
                { value: 50, label: "50" },
                { value: 100, label: "最大" },
              ]}
            />
          </Field>
          <Field group label="订阅的情报类目">
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <FilterChip
                  key={category}
                  selected={subscribed.includes(category)}
                  onSelectedChange={(on) =>
                    setSubscribed((current) =>
                      on
                        ? [...current, category]
                        : current.filter((item) => item !== category),
                    )
                  }
                >
                  {category}
                </FilterChip>
              ))}
            </div>
          </Field>
        </section>

        <section className="flex flex-col gap-6">
          <SectionTitle variant="plain">值守</SectionTitle>
          <div className="grid gap-6 @2xl:grid-cols-2">
            <Panel>
              <PanelHeader
                extra={
                  <Tag
                    variant="accent"
                    size="sm"
                    className="font-tech font-bold"
                  >
                    NOW
                  </Tag>
                }
              >
                当前班次
              </PanelHeader>
              <List aria-label="班次">
                {shifts.map((item) => (
                  <ListRow
                    key={item.id}
                    selected={item.id === shift}
                    onClick={() => setShift(item.id)}
                    description={item.time}
                    end={item.people}
                  >
                    {item.name}
                  </ListRow>
                ))}
              </List>
            </Panel>
            <Panel>
              <PanelHeader variant="line">交接记录</PanelHeader>
              <PanelBody>
                <EmptyState
                  bordered={false}
                  className="py-6"
                  title="暂无交接记录"
                  description="完成第一次交接后，这里会出现记录。"
                />
              </PanelBody>
            </Panel>
          </div>
        </section>

        {/* 不常用的收进折叠面板。收起的内容不在页面里，所以这里面不放要提交的字段 */}
        <section className="flex flex-col gap-6">
          <SectionTitle variant="plain">高级</SectionTitle>
          <Accordion multiple>
            <AccordionItem value="sync" title="同步" extra="2 项">
              <div className="flex flex-col">
                <Switch defaultChecked>只在接入站内网络时同步</Switch>
                <Switch>同步失败时自动重试</Switch>
              </div>
            </AccordionItem>
            <AccordionItem value="cache" title="本地缓存" extra="128 MB">
              <p className="mb-3 text-sm text-ink-secondary">
                缓存的是最近三十天的测绘图。清掉之后下次打开会重新下载。
              </p>
              <Button size="sm" variant="light" type="button">
                清除缓存
              </Button>
            </AccordionItem>
            <AccordionItem value="reset" title="恢复默认">
              <p className="mb-3 text-sm text-ink-secondary">
                把这一页的设置全部改回默认值。站点代号和交接记录不受影响。
              </p>
              <Button size="sm" variant="danger" type="button">
                恢复默认设置
              </Button>
            </AccordionItem>
          </Accordion>
        </section>

        <div className="flex flex-wrap justify-end gap-3 border-t border-line pt-6">
          <Button
            variant="light"
            type="reset"
            onClick={() => {
              setCodename("");
              setSubmitted(false);
            }}
          >
            放弃修改
          </Button>
          <Button type="submit">保存设置</Button>
        </div>
      </form>
    </div>
  );
}

export const Page: Story = {
  name: "站点设置",
  render: () => (
    <ToastProvider>
      <Settings />
    </ToastProvider>
  ),
};
