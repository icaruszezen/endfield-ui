import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MediaCard } from "./MediaCard";
import { RouterLink } from "../../test/RouterLink";

const media = <img src="cover.png" alt="" />;

describe("MediaCard", () => {
  it("渲染成 article，标题是 h3", () => {
    render(<MediaCard media={media} title="第七勘探区测绘归档" />);
    expect(screen.getByRole("article")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: "第七勘探区测绘归档" }),
    ).toBeInTheDocument();
  });

  it("level 调整标题层级", () => {
    render(<MediaCard media={media} title="标题" level={2} />);
    expect(screen.getByRole("heading", { level: 2 })).toBeInTheDocument();
  });

  it("传 href 时整卡只有一个链接，名称就是标题", () => {
    render(
      <MediaCard
        media={media}
        title="补给站扩建"
        href="/news/2"
        target="_blank"
        rel="noreferrer"
      />,
    );
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAccessibleName("补给站扩建");
    expect(links[0]).toHaveAttribute("href", "/news/2");
    expect(links[0]).toHaveAttribute("target", "_blank");
  });

  it("不传 href 时是静态卡片，没有链接", () => {
    render(<MediaCard media={media} title="补给站扩建" />);
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("微标行：双斜杠是装饰，类目与日期都在", () => {
    render(
      <MediaCard
        media={media}
        title="标题"
        category="新闻"
        date="2026.10.07"
        tag={<span>PV</span>}
      />,
    );
    expect(screen.getByText("//")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByText(/新闻/)).toHaveTextContent(/新闻\s2026\.10\.07/);
    expect(screen.getByText("PV")).toBeInTheDocument();
  });

  it("没有类目、日期、标签时不渲染微标行", () => {
    const { container } = render(<MediaCard media={media} title="标题" />);
    expect(container.querySelector("p")).toBeNull();
  });

  it("宽高比写在媒体区上", () => {
    const { container } = render(
      <MediaCard media={media} title="标题" ratio="1/1" />,
    );
    expect(container.querySelector("img")?.parentElement).toHaveClass(
      "aspect-square",
    );
  });

  it("render：标题里的链接换成路由库的链接组件，整卡仍然可点", () => {
    render(
      <MediaCard
        media={media}
        title="首批测绘数据归档"
        render={<RouterLink to="/news/1" />}
      />,
    );
    const link = screen.getByRole("link", { name: "首批测绘数据归档" });
    expect(link).toHaveAttribute("href", "/app/news/1");
    expect(link).toHaveClass("after:absolute", "after:inset-0");
    expect(link.closest("article")).toHaveClass("has-focus-visible:outline-2");
  });
});
