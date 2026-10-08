import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HazardStripe } from "./HazardStripe";

describe("HazardStripe", () => {
  it("是一条对读屏隐藏的窄条", () => {
    render(<HazardStripe data-testid="stripe" />);
    const stripe = screen.getByTestId("stripe");
    expect(stripe).toHaveAttribute("aria-hidden", "true");
    expect(stripe).toHaveClass("hazard", "h-3", "w-full");
  });

  it("细的一档高 6px", () => {
    render(<HazardStripe data-testid="stripe" size="sm" />);
    expect(screen.getByTestId("stripe")).toHaveClass("h-1.5");
    expect(screen.getByTestId("stripe")).not.toHaveClass("h-3");
  });
});
