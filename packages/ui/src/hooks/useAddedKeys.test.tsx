import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useAddedKeys } from "./useAddedKeys";

function Probe({ keys }: { keys: string[] }) {
  const added = useAddedKeys(keys);
  return (
    <ul>
      {keys.map((key) => (
        <li key={key} data-added={added.has(key) ? "" : undefined}>
          {key}
        </li>
      ))}
    </ul>
  );
}

const added = () =>
  screen
    .getAllByRole("listitem")
    .filter((item) => item.hasAttribute("data-added"))
    .map((item) => item.textContent);

describe("useAddedKeys", () => {
  it("一开始就在的不算", () => {
    render(<Probe keys={["甲", "乙"]} />);
    expect(added()).toEqual([]);
  });

  it("后来加的算；一次加几个都算；已经在的不受影响", () => {
    const { rerender } = render(<Probe keys={["甲"]} />);
    rerender(<Probe keys={["甲", "乙"]} />);
    expect(added()).toEqual(["乙"]);

    rerender(<Probe keys={["甲", "乙", "丙", "丁"]} />);
    expect(added()).toEqual(["乙", "丙", "丁"]);
  });

  it("删了别的，新来的那几个还是新来的；内容没变（只是换了个数组）不重算", () => {
    const { rerender } = render(<Probe keys={["甲"]} />);
    rerender(<Probe keys={["甲", "乙", "丙"]} />);
    rerender(<Probe keys={["乙", "丙"]} />);
    expect(added()).toEqual(["乙", "丙"]);

    rerender(<Probe keys={["乙", "丙"]} />);
    expect(added()).toEqual(["乙", "丙"]);
  });

  it("一开始就在的，删掉之后又加回来：这回算新来的", () => {
    const { rerender } = render(<Probe keys={["甲", "乙"]} />);
    rerender(<Probe keys={["乙"]} />);
    rerender(<Probe keys={["乙", "甲"]} />);
    expect(added()).toEqual(["甲"]);
  });
});
