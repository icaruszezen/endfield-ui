import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Viewfinder } from "./Viewfinder";

describe("Viewfinder", () => {
  it("包住内容，取景角是装饰", () => {
    render(
      <Viewfinder data-testid="frame">
        <img alt="地形图" src="data:," />
      </Viewfinder>,
    );
    const frame = screen.getByTestId("frame");
    expect(screen.getByRole("img", { name: "地形图" })).toBeInTheDocument();

    const brackets = frame.querySelector(".corner-brackets");
    expect(brackets).toHaveAttribute("aria-hidden", "true");
    expect(brackets).toHaveClass("pointer-events-none");
  });

  it("默认没有准星，打开后是一个隐藏的图形", () => {
    const { rerender } = render(<Viewfinder data-testid="frame" />);
    expect(screen.getByTestId("frame").querySelector("svg")).toBeNull();

    rerender(<Viewfinder data-testid="frame" crosshair />);
    expect(screen.getByTestId("frame").querySelector("svg")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  it("读数是可读的文字，只渲染给了值的角", () => {
    render(
      <Viewfinder
        data-testid="frame"
        readouts={{ topLeft: "X 128 / Y 64", bottomRight: "1 : 500" }}
      />,
    );
    const frame = screen.getByTestId("frame");
    expect(frame.querySelectorAll("[data-corner]")).toHaveLength(2);

    const readout = screen.getByText("X 128 / Y 64");
    expect(readout).toHaveAttribute("data-corner", "topLeft");
    expect(readout).not.toHaveAttribute("aria-hidden");
    expect(screen.getByText("1 : 500")).toHaveAttribute(
      "data-corner",
      "bottomRight",
    );
  });

  it("两档臂长", () => {
    const { rerender } = render(<Viewfinder data-testid="frame" />);
    const brackets = () =>
      screen.getByTestId("frame").querySelector(".corner-brackets");
    expect(brackets()).toHaveClass("[--bracket-arm:16px]");

    rerender(<Viewfinder data-testid="frame" size="md" />);
    expect(brackets()).toHaveClass("[--bracket-arm:24px]");
  });
});
