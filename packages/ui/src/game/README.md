# game

Game 实机风格：照游戏内界面复刻的一组控件，外加一个带官方图片的官网开屏页，独立入口（`@endfield-ui/react/game` + `@endfield-ui/react/game.css`）。是什么、怎么用、带了哪些官方图片和有什么风险，见 [docs/design/game](../../../../docs/design/game/README.md)。

| 目录 | 导出 | 规范 |
| --- | --- | --- |
| `animated-dialog/` | `AnimatedDialog` | [动画弹窗与圆角下拉](../../../../docs/design/game/dialog-and-select.md) |
| `rounded-select/` | `RoundedSelect` | [动画弹窗与圆角下拉](../../../../docs/design/game/dialog-and-select.md#roundedselect) |
| `rounded-button/` | `RoundedButton`、`RoundedIconButton` | [圆角控件](../../../../docs/design/game/rounded-controls.md) |
| `rounded-toggle/` | `RoundedToggle`（圆角分段选择） | [圆角控件](../../../../docs/design/game/rounded-controls.md#roundedtoggle) |
| `rounded-switch/` | `RoundedSwitch`（ON / OFF 文字开关） | [圆角控件](../../../../docs/design/game/rounded-controls.md#roundedswitch) |
| `banner-alert/` | `BannerAlert`（紧凑确认卡片） | [确认提示](../../../../docs/design/game/confirmation-alerts.md) |
| `full-width-alert/` | `FullWidthAlert`（通栏确认面板） | [确认提示](../../../../docs/design/game/confirmation-alerts.md#fullwidthalert) |
| `item-icon/` | `ItemIcon`（分层物品图标）和它的几个取值工具 | [物品卡片](../../../../docs/design/game/item-cards.md#itemicon-与图层) |
| `item-card/` | `ItemCard`（稀有度卡片与库存） | [物品卡片](../../../../docs/design/game/item-cards.md) |
| `item-tooltip-card/` | `ItemTooltipCard`（物品详情） | [物品悬浮卡](../../../../docs/design/game/item-hover-cards.md) |
| `item-hover-card/` | `ItemHoverCard`、`ItemHoverCardLayer`（单个控件与网格的悬浮预览） | [物品悬浮卡](../../../../docs/design/game/item-hover-cards.md) |
| `splash-screen/` | `EndfieldSplashScreen`（官网开屏页：主入口的 `SplashScreen` 填上官方的标志、底图和微标） | [官网开屏页](../../../../docs/design/game/splash-screen.md) |

几个控件共用的内部模块（不导出）：

| 文件 | 谁在用 |
| --- | --- |
| `lib/core.ts` | 这一类用到的主库的东西，都从这里过。开屏页整个就是主库的 `SplashScreen`，也从这里取 |
| `lib/first-focusable.ts` | `AnimatedDialog` 打开时焦点落在哪 |
| `banner-alert/AlertModal.tsx`、`useAlertActions.ts`、`types.ts`、`AlertIcons.tsx` | `BannerAlert`、`FullWidthAlert` 共用的模态外壳、确认 / 取消 / 关闭的处理和两个按钮图标 |
| `banner-alert/banner-alert.css` 里的 `.ef-alert-modal-*` | 同上：两种提示共用的视口、读屏文字，和四张图的变量 |
| `rounded-toggle/spring-highlight.ts`、`keyboard.ts` | `RoundedToggle`、`RoundedSwitch` 的选中片弹簧动画与 Home / End |

## 和主库不一样的约定

目录怎么分、测试放哪、stories 放在 [apps/docs/stories/game](../../../../apps/docs/README.md)，这些和 [components](../components/README.md) 一样。不一样的是下面几条：

- **和主库只有一个方向的关系。** 主库（`components/`、`hooks/`、`lib/`、`styles/`、`index.ts`）不许引这个目录里的任何东西。这个目录用主库的东西只经 [`lib/core.ts`](lib/core.ts) 一处，并且只用主入口公开导出的名字。两个入口在同一次 unbundle 构建中共用内部模块（见 [`tsdown.config.ts`](../../tsdown.config.ts)），`Field` 的上下文只有一份，使用方也能按模块剔除未使用的组件。
- **样式是每个控件一份纯 CSS**，不用工具类，由 [`styles.css`](styles.css) 汇总进 `components` 层。主样式入口不扫这个目录（`@source not`）。
- **固定配色，可以写十六进制色值。** 这一类复刻的是游戏里的样子，不随主题变；"只用令牌"在这里不适用。会落在页面底色上的东西（控件外面的焦点环）仍然取主题的令牌，并且带回退值。
- **类名以 `ef-` 开头，私有变量以 `--ef-game-` 开头，`@keyframes` 以 `ef-` 开头。** 顶层规则只许以 `.ef-` 类起头；唯一的例外是主题范围上的那几条（`:root`、`[data-theme]`），它们只许声明 `--ef-game-*` 变量——亮暗两套图要"最近的主题说了算"，只能靠继承。
- **每个控件自己写高对比模式和减少动态效果的降级**（`@media (forced-colors: active)`、`(prefers-reduced-motion: reduce)`）：主样式末尾那条统一降级的规则管得到这里，但脚本驱动的动效（悬停闪动、弹簧）要自己看系统设置。
- **官方图片只许放在这个目录里**，跟着用它的控件放在 `<控件>/assets/`，并且逐张登记在 [`resource-provenance.json`](resource-provenance.json)（路径、尺寸、字节数、SHA256、来源）。样式里经变量引用，图没了控件也要成形。构建时被样式引用的那些拷到 `dist/game/assets/`；只有预览站在用的示例图不进包。
- **内置的文字用中文**，和主库一样（"关闭""取消""确认"），都能用属性换掉。

以上几条有测试守着：[`isolation.test.ts`](isolation.test.ts)、[`assets.test.ts`](assets.test.ts)。
