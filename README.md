# 汉诺塔实验室 · Hanoi Lab

一个可以直接玩的网页版汉诺塔，同时把「为什么这样搬、为什么 2ⁿ−1 步就是最少」完整展示出来。

## 功能

- **可玩棋盘**：点击柱子拿起顶部圆盘，再点击目标柱放下；自动校验「一次一个」「大盘不能压小盘」。
- **3–15 个圆盘**：切换盘数会立即重开，并重新生成对应的最优解；15 盘共 32,767 步。
- **大数量优化**：步骤列表采用窗口化渲染，15 盘的完整步骤也能流畅滚动；演示过程不逐条复制步骤日志，避免长时间演示拖慢页面。
- **手动计时 / 步数**：记录完成用时，并与理论最优步数对比。
- **完整参考解**：经典递归解法生成每一步，包含动作、递归任务、子问题结构与单步理由。
- **最优性证明**：用最大盘的下界论证 + 递归构造说明 `T(n) = 2T(n−1) + 1 = 2ⁿ − 1`。
- **自动演示**：播放、暂停、上一步、下一步、回到起点、点击任意步骤跳转。
- **每一步移动时间可调**：`0.12s–2.00s` 滑杆与快捷档位，同时作用于自动演示和手动移动动画。
- **完成状态**：区分「手动完成」「完美最优解」「自动演示完成」，并显示步数统计。
- **响应式与可访问性**：桌面双栏、移动端单栏；原生按钮、键盘可操作、`aria-live` 状态提示、`prefers-reduced-motion` 支持。
- **轻量音效**：纯 Web Audio 合成，可随时静音。

## 本地运行

要求 Node.js 22+。

```bash
pnpm install
pnpm dev
```

生产构建与预览：

```bash
pnpm build
pnpm preview
```

## 验证

```bash
pnpm test   # 规则、最优解与 15 盘配色测试
pnpm lint   # Oxlint
pnpm build  # TypeScript + Vite 生产构建
```

单元测试会针对 1–8 与 15 个圆盘逐一验证：

1. 解法长度严格等于 `2ⁿ − 1`；
2. 每一步都符合汉诺塔规则；
3. 执行完后所有圆盘都在 C 柱；
4. 任意前缀重放得到相同局面；
5. 每一步都带有可读的递归理由。

## 递归解法

要把 `n` 个盘从起点 `from` 搬到终点 `to`：

1. 先把上面 `n−1` 个盘从 `from` 搬到辅助柱 `via`；
2. 把第 `n` 号盘从 `from` 搬到 `to`；
3. 再把 `n−1` 个盘从 `via` 搬到 `to`。

最大盘在整局中至少移动一次；移动它之前，上面 `n−1` 个盘必须全部让到辅助柱，移动之后又必须全部搬到终点。因此：

```text
T(n) = 2·T(n−1) + 1
T(1) = 1
T(n) = 2ⁿ − 1
```

递归策略恰好达到这个下界，所以它既可行，也一定是最优解。

## 部署到 GitHub Pages

这个项目是纯前端静态站点，没有后端、数据库、接口或环境变量。构建产物只有 `dist/` 下的 HTML、CSS、JS 和图标，因此可以直接托管在 GitHub Pages。

仓库已包含 GitHub Actions 工作流：

```text
.github/workflows/deploy.yml
```

推送代码后，Actions 会自动执行 `pnpm install`、`pnpm lint`、`pnpm test`、`pnpm build`，然后把 `dist/` 发布到 GitHub Pages。

首次部署前，在 GitHub 仓库中设置一次：

1. 打开 **Settings → Pages**；
2. 在 **Build and deployment → Source** 中选择 **GitHub Actions**；
3. 推送代码到 `main` 或 `master` 分支；
4. 在 **Actions** 页面等待 `Deploy to GitHub Pages` 完成。

部署地址通常是：

```text
https://<你的用户名>.github.io/<仓库名>/
```

`vite.config.ts` 已使用相对资源路径 `base: './'`，因此部署在仓库子路径下也不会出现 JS/CSS/图标 404。若使用其他默认分支，修改工作流顶部的 `branches` 即可；也可以在 Actions 页面手动运行 `workflow_dispatch`。

## 技术栈

- Vite 8 + React 19 + TypeScript
- Motion for React：跨柱子共享布局动画
- Lucide React：界面图标
- Vitest：纯函数与解法生成测试
- 原生 CSS：深色星港控制台视觉、响应式布局、动画与可访问性

## 目录

```text
src/
  components/
    Board.tsx           棋盘、柱子、圆盘与撒花
    SolutionPanel.tsx   速度控制、演示控制、步骤详情与证明
  hooks/
    useHanoiGame.ts     游戏状态机与自动演示调度
  lib/
    hanoi.ts            规则、最优解生成、局面重放
    diskThemes.ts       圆盘配色与尺寸
    audio.ts            Web Audio 音效
  App.tsx               页面结构与操作区
  App.css               组件与响应式样式
  index.css             全局主题与基础样式
```

## 说明

标准三柱汉诺塔的最少步数固定为 `2ⁿ − 1`。页面展示的是最经典的递归解，并会在每一步说明它属于哪个递归子任务、为何合法、下一步会如何收尾。
