import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Tag } from "./Tag";
import { TagPair } from "./TagPair";

describe("Tag", () => {
  it("渲染内容并带上变体标记", () => {
    render(<Tag variant="outline">限时活动</Tag>);
    expect(screen.getByText("限时活动")).toHaveAttribute(
      "data-variant",
      "outline",
    );
  });

  it("numeric 使用等宽数字", () => {
    render(
      <Tag variant="inverse" numeric>
        10.08
      </Tag>,
    );
    expect(screen.getByText("10.08")).toHaveClass("font-tech", "tabular-nums");
  });
});

describe("TagPair", () => {
  it("名与值紧贴，各自用对应的变体", () => {
    render(<TagPair name="阵营" value="所属机构" />);
    expect(screen.getByText("阵营")).toHaveAttribute("data-variant", "inverse");
    expect(screen.getByText("所属机构")).toHaveAttribute(
      "data-variant",
      "muted",
    );
    expect(screen.getByText("阵营").parentElement).not.toHaveClass("gap-2");
  });

  it("emphasis 把名换成强调变体", () => {
    render(<TagPair name="配音" value="演员姓名" emphasis />);
    expect(screen.getByText("配音")).toHaveAttribute("data-variant", "accent");
  });
});
