# 确认提示

`BannerAlert`、`FullWidthAlert` 是 EndfieldMap 确认弹窗的两种外观，属于 [Game 实机风格](README.md)这一类，从 `@endfield-ui/react/game` 引入；名称与主库的页面内提示条 `Alert` 区分。它们使用固定的浅色面板、横幅图片和无音效圆角按钮；不随页面明暗主题反转。模态、焦点、键盘与关闭后返回触发元素由 Base UI 处理，两种外观共用同一套操作回调。

## BannerAlert

紧凑卡片默认宽 30em，即默认字号下 480px；最小高度 10em。390px 视口下宽度收至 358px，正文和按钮仍在卡片中。面板底色 `#FEFEFE`，圆角 0.2em，遮罩为 20% 黑色；顶部是 4.5em 高的重复横幅，背景图落在右下方。

```tsx
import { BannerAlert, RoundedButton } from "@endfield-ui/react/game";

<BannerAlert
  title="保存修改"
  trigger={<RoundedButton showIcon={false}>保存</RoundedButton>}
  cancelText="取消"
  confirmText="确定"
  onConfirm={saveChanges}
>
  <p>是否保存当前修改？</p>
</BannerAlert>;
```

主体从顶部展开，`scaleY(0)` 到 `scaleY(1)` 与淡入持续 150ms。正文和按钮保留 205ms 的有限次透明度闪动。退出时缩回 150ms，透明度在第 70ms 后用 30ms 淡出；减少动态效果时直接切换。

`width`、`height` 可以调整卡片尺寸，`classNames` 可分别调整遮罩、面板和内容区。长正文只在内容区滚动，按钮保持可见。

## FullWidthAlert

通栏面板横贯视口，默认最小高 10em，正文居中；按钮在下沿向外突出 16px，后面保留白色圆角托底。顶部有三色色条和镜像横幅，左下方是本地底图，遮罩为 50% 黑色。（云游戏页也有三色条：品红、薄荷绿、黄三段，多是贴在标题栏或卡片左上缘的竖条，色值和比例都和这里不同，见 [云游戏页](../surfaces/cloud.md#几样母题)，数值在 [measurements-cloud.md](../references/measurements-cloud.md) 第 3.4 节；这里的色条不变。）

```tsx
import { FullWidthAlert, RoundedButton } from "@endfield-ui/react/game";

<FullWidthAlert
  title="确认退出"
  trigger={<RoundedButton variant="default" showIcon={false}>退出</RoundedButton>}
  cancelText="取消"
  confirmText="退出"
  onConfirm={leavePage}
>
  <p>未保存的修改会被放弃。</p>
</FullWidthAlert>;
```

主体以右侧为原点，横向展开或收回 100ms；遮罩过渡 50ms。`height` 可以指定固定高度，超出部分在正文滚动区滚动，按钮不跟随滚动；滚动条沿用细轨与白色滑块。窄屏只裁切装饰，不制造页面横向滚动，也不裁掉突出于面板的按钮。

## 操作与焦点

`title` 是必填的读屏名称，默认不在画面内额外显示一行标题。正文由 `children` 提供；需要单独的读屏说明时传 `description`。传 `trigger` 时点击打开，也可以使用 `defaultOpen`，或通过 `open`、`onOpenChange` 外部控制。

打开后默认聚焦取消按钮，`hideCancel` 时聚焦确认按钮；两者都禁用时焦点落在面板。可以用 `initialFocus`、`finalFocus` 指定其他目标。

确认调用 `onConfirm`，取消调用 `onCancel`，遮罩或 Escape 调用 `onDismiss`。对应操作允许后再调用 `onClose`，然后请求 `onOpenChange(false)`。任一回调返回 `false`、抛错或 Promise 拒绝，都保留当前弹窗。异步操作期间同一实例只接受一次请求；关闭后重新打开，前一次的迟到结果不会关闭新弹窗。

`loading` 或等待回调期间，按钮与外部关闭请求都被禁用，面板标记 `aria-busy`。`dismissible={false}` 禁止遮罩关闭并默认禁止 Escape，`keyboardCloseable` 可单独控制 Escape；确认、取消按钮仍使用各自回调。两个按钮上的字默认是“取消”“确认”，用 `cancelText`、`confirmText` 换。`showIcon={false}` 隐藏按钮图标，`hideCancel` 隐藏取消。`keepMounted` 可以保留关闭后的正文状态。

默认是模态的，弹层挂在 `<body>` 下。`container` 把它挂进指定的元素，`modal={false}` 时不锁焦点、不锁页面滚动——两样合起来，可以把提示嵌在页面的一块区域里展示（设计稿对照、文档里的预览）：那一块要自己定高，并且是里面 `position: fixed` 元素的包含块（`contain: layout`），遮罩就只盖住它；再配上 `dismissible={false}` 和 `initialFocus={false}`，它不关、也不抢焦点。预览站的“示例 / 实机风格”就是这样摆的。

禁用使当前按钮失焦时，焦点落在面板；没有可用控件时 Tab 和 Shift+Tab 都留在面板内。回调否决后，若用户仍停在面板，焦点恢复到原动作按钮。有可用输入框时继续使用正常的键盘导航。

## 本地图片

两种提示共同使用横幅左右两图。紧凑卡片再用 `alert_bg.png`，通栏面板再用 `deco_common_logo_bg.png`。四张 PNG 与源文件字节一致，共 243604 字节，都是官方素材，随包发在 `dist/game/assets`，使用时无需图片外链。其中 `deco_common_logo_bg.png` 里是官方的「终末地 / ENDFIELD INDUSTRIES」标志。

源码图片放在 `packages/ui/src/game/banner-alert/assets`；`build:game` 构建样式时把它们拷到 `dist/game/assets`，并核对样式里的每个地址都指得到文件。来源、权利归属和怎么换掉见[风险与处理](README.md#风险与处理)。

组件不带音效接口、音频资源或播放服务。它们用的按钮就是[圆角控件](rounded-controls.md)里的 `RoundedButton`，不重复实现。
