import { render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { usePortalScope } from "./usePortalScope";

/** 触发元素在 `children` 的位置上；浮层的容器另外挂到 body 下，像真的浮层那样 */
function Probe({ invertTheme = false }: { invertTheme?: boolean }) {
  const { anchorRef, portalRef } = usePortalScope({ invertTheme });
  return (
    <>
      <button ref={anchorRef} type="button">
        触发
      </button>
      <PortalHost portalRef={portalRef} />
    </>
  );
}

function PortalHost({
  portalRef,
}: {
  portalRef: (node: HTMLElement | null) => void;
}) {
  // 触发元素先挂上，容器后挂：和基元里"打开时才渲染 Portal"的顺序一样
  return <div data-testid="portal" ref={portalRef} />;
}

/** 渲染一次，读出浮层容器上的主题，再卸掉（一个用例里会连着问几次） */
function portalTheme(ui: React.ReactNode) {
  const view = render(ui);
  const theme = view.getByTestId("portal").dataset.theme;
  view.unmount();
  return theme;
}

afterEach(() => {
  delete document.documentElement.dataset.theme;
});

describe("usePortalScope", () => {
  it("最近的主题就是 <html> 时不抄：浮层本来就继承它", () => {
    document.documentElement.dataset.theme = "dark";
    expect(portalTheme(<Probe />)).toBeUndefined();
  });

  it("触发元素在局部主题里：抄到浮层的容器上", () => {
    expect(
      portalTheme(
        <div data-theme="dark">
          <Probe />
        </div>,
      ),
    ).toBe("dark");
  });

  it("触发元素在反转块里：抄的是算出来的那个主题，不是 inverse 本身", () => {
    // 页面没写主题，默认亮色：反转块实际是暗的
    expect(
      portalTheme(
        <div data-theme="inverse">
          <Probe />
        </div>,
      ),
    ).toBe("dark");
  });

  it("反转块反的是最近那个写明的主题，不是页面", () => {
    document.documentElement.dataset.theme = "light";
    expect(
      portalTheme(
        <div data-theme="dark">
          <div data-theme="inverse">
            <Probe />
          </div>
        </div>,
      ),
    ).toBe("light");
  });

  it("暗色页面上的反转块实际是亮的", () => {
    document.documentElement.dataset.theme = "dark";
    expect(
      portalTheme(
        <div data-theme="inverse">
          <Probe />
        </div>,
      ),
    ).toBe("light");
  });

  it("invertTheme：浮层用和触发元素所在处相反的主题", () => {
    expect(portalTheme(<Probe invertTheme />)).toBe("dark");
    document.documentElement.dataset.theme = "dark";
    expect(portalTheme(<Probe invertTheme />)).toBe("light");
  });

  it("invertTheme 遇到反转块：反转块里是暗的，提示就是亮的", () => {
    expect(
      portalTheme(
        <div data-theme="inverse">
          <Probe invertTheme />
        </div>,
      ),
    ).toBe("light");
  });

  it("data-choice 照抄", () => {
    const { getByTestId } = render(
      <div data-choice="diamond">
        <Probe />
      </div>,
    );
    expect(getByTestId("portal").dataset.choice).toBe("diamond");
  });
});
