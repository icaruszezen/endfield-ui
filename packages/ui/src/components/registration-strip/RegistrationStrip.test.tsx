import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RegistrationStrip } from "./RegistrationStrip";

describe("RegistrationStrip", () => {
  it("三段色条，整体对读屏隐藏", () => {
    render(<RegistrationStrip data-testid="strip" />);
    const strip = screen.getByTestId("strip");
    expect(strip).toHaveAttribute("aria-hidden", "true");
    expect(strip.children).toHaveLength(3);
    expect(strip.children[0]).toHaveClass("bg-reg-magenta");
    expect(strip.children[1]).toHaveClass("bg-reg-cyan");
    expect(strip.children[2]).toHaveClass("bg-reg-yellow");
  });

  it("rule 在横条后面接一段灰线", () => {
    render(<RegistrationStrip data-testid="strip" rule />);
    const strip = screen.getByTestId("strip");
    expect(strip.children).toHaveLength(4);
    expect(strip.children[3]).toHaveClass("flex-1", "bg-line");
    expect(strip).toHaveClass("w-full");
  });

  it("竖条是三段叠放，没有灰线", () => {
    render(<RegistrationStrip data-testid="strip" orientation="vertical" rule />);
    const strip = screen.getByTestId("strip");
    expect(strip).toHaveAttribute("data-orientation", "vertical");
    expect(strip).toHaveClass("flex-col");
    expect(strip.children).toHaveLength(3);
  });
});
