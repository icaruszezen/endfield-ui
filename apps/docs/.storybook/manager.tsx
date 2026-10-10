import { GithubIcon } from "@storybook/icons";
// 这个文件由 Storybook 自己打包，JSX 走的是旧式转换（React.createElement），
// 所以 React 要在作用域里——看着没人用，删了工具栏就报 "React is not defined"
import React from "react";
import { Button } from "storybook/internal/components";
import { addons, types } from "storybook/manager-api";

const REPO_URL = "https://github.com/icaruszezen/endfield-ui";

// 画布上方那条工具栏的右端常驻一个到仓库的链接：单个 story 和文档页都看得到。
// 带文字，不只放图标——右边那一排全是图标，只放一个猫头认不出来是出口
addons.register("endfield-ui/repo-link", () => {
  addons.add("endfield-ui/repo-link/tool", {
    type: types.TOOLEXTRA,
    title: "GitHub 仓库",
    render: () => (
      <Button
        asChild
        padding="small"
        variant="ghost"
        ariaLabel="在 GitHub 上查看源码"
      >
        <a href={REPO_URL} target="_blank" rel="noreferrer">
          <GithubIcon />
          GitHub
        </a>
      </Button>
    ),
  });
});
