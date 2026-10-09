import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Accordion, AccordionItem } from "./Accordion";

function Faq(props: Partial<React.ComponentProps<typeof Accordion>>) {
  return (
    <Accordion {...props}>
      <AccordionItem value="route" title="怎么改派路线">
        在调度台里选中批次，再选新的目的站。
      </AccordionItem>
      <AccordionItem value="delay" title="延误了怎么办" extra="3 条">
        延误超过两小时的批次会自动上报。
      </AccordionItem>
      <AccordionItem value="archive" title="归档之后还能看吗" disabled>
        可以，在档案里。
      </AccordionItem>
    </Accordion>
  );
}

const trigger = (name: string | RegExp) => screen.getByRole("button", { name });

describe("Accordion", () => {
  it("每一节的标题是一个标题元素里的按钮，默认都收着", () => {
    render(<Faq />);
    const headings = screen.getAllByRole("heading", { level: 3 });
    expect(headings).toHaveLength(3);
    expect(headings[0]).toContainElement(trigger("怎么改派路线"));
    for (const button of screen.getAllByRole("button")) {
      expect(button).toHaveAttribute("aria-expanded", "false");
    }
    expect(screen.queryByText(/在调度台里选中批次/)).not.toBeInTheDocument();
  });

  it("level 换标题的层级", () => {
    render(<Faq level={4} />);
    expect(screen.getAllByRole("heading", { level: 4 })).toHaveLength(3);
  });

  it("点标题展开：内容出现，按钮报告展开并指向内容区", async () => {
    const user = userEvent.setup();
    render(<Faq />);
    const button = trigger("怎么改派路线");
    await user.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");
    const panel = screen.getByRole("region", { name: "怎么改派路线" });
    expect(panel).toHaveTextContent("在调度台里选中批次");
    expect(button).toHaveAttribute("aria-controls", panel.id);
  });

  it("默认只开一个：开了这个，那个就收起来", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Faq defaultValue={["route"]} onValueChange={onValueChange} />);
    expect(trigger("怎么改派路线")).toHaveAttribute("aria-expanded", "true");

    await user.click(trigger(/延误了怎么办/));
    expect(onValueChange).toHaveBeenLastCalledWith(["delay"]);
    expect(trigger(/延误了怎么办/)).toHaveAttribute("aria-expanded", "true");
    await waitFor(() =>
      expect(trigger("怎么改派路线")).toHaveAttribute("aria-expanded", "false"),
    );
  });

  it("multiple：可以同时开几个", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <Faq multiple defaultValue={["route"]} onValueChange={onValueChange} />,
    );
    await user.click(trigger(/延误了怎么办/));
    expect(onValueChange).toHaveBeenLastCalledWith(["route", "delay"]);
    expect(trigger("怎么改派路线")).toHaveAttribute("aria-expanded", "true");
  });

  it("受控：展开哪几项由外面决定", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Faq value={["delay"]} onValueChange={onValueChange} />);
    await user.click(trigger("怎么改派路线"));
    expect(onValueChange).toHaveBeenLastCalledWith(["route"]);
    // 外面没改，就还是原来那一项开着
    expect(trigger("怎么改派路线")).toHaveAttribute("aria-expanded", "false");
    expect(trigger(/延误了怎么办/)).toHaveAttribute("aria-expanded", "true");
  });

  it("键盘：回车和空格开合", async () => {
    const user = userEvent.setup();
    render(<Faq />);
    await user.tab();
    expect(trigger("怎么改派路线")).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(trigger("怎么改派路线")).toHaveAttribute("aria-expanded", "true");
    await user.keyboard(" ");
    await waitFor(() =>
      expect(trigger("怎么改派路线")).toHaveAttribute("aria-expanded", "false"),
    );
  });

  it("禁用的一节点不开；它仍然能被聚焦，读屏读得到", async () => {
    const user = userEvent.setup();
    render(<Faq />);
    const button = trigger("归档之后还能看吗");
    expect(button).toHaveAttribute("aria-disabled", "true");
    await user.click(button);
    expect(button).toHaveAttribute("aria-expanded", "false");
  });

  it("extra 在按钮里，记号是装饰", () => {
    render(<Faq />);
    const button = trigger(/延误了怎么办/);
    expect(button).toHaveTextContent("3 条");
    expect(button.querySelector("[aria-hidden=true] svg")).toBeInTheDocument();
  });

  it("searchable：收起的内容留在页面里，等页内查找去找", () => {
    render(<Faq searchable />);
    const hidden = screen.getByText(/在调度台里选中批次/);
    expect(hidden.closest("[hidden]")).toHaveAttribute("hidden", "until-found");
  });

  it("两档尺寸", () => {
    const { rerender } = render(<Faq />);
    expect(trigger("怎么改派路线")).toHaveClass("min-h-12");
    rerender(<Faq size="sm" />);
    expect(trigger("怎么改派路线")).toHaveClass("min-h-10", "text-sm");
  });
});
