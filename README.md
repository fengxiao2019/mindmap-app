# 学习地图（mindmap-app）

导入 JSON，把每个学习主题变成可展开、可拖动的知识脑图。纯前端、本地优先，可安装为 PWA、离线使用。

```bash
npm install
npm run dev        # 开发：http://localhost:5173
npm test           # 单元测试（导入校验、布局、换边规则、Markdown 导出）
npm run build      # 类型检查 + 打包到 dist/
npm run preview    # 预览打包结果（含 Service Worker）
```

`dist/` 是纯静态文件，资源使用相对路径，可以直接放到任意静态托管（GitHub Pages、Netlify、Vercel、Cloudflare Pages、自己的 Nginx），放在域名根目录或子目录都可以。PWA 需要 HTTPS（`localhost` 除外）。

## 目录

| 路径 | 作用 |
| --- | --- |
| `src/types.ts` | 数据类型：`MindNode`、`Topic`、`TopicDocument` |
| `src/data/sample.ts`、`sample.en.ts` | 内置示例主题（网络安全学习地图，中 / 英两个版本，节点 id 一致） |
| `src/i18n.ts`、`src/locales/` | 多语言（中文 / English）：`t(key)`、静态 HTML 的 `data-i18n`、语言切换 |
| `src/graph/fonts.ts` | 字体栈与加载（自托管的 Inter / 思源黑体 / JetBrains Mono） |
| `src/graph/exportImage.ts` | 右键「导出为图片」：以所选节点为根画成 PNG |
| `test-data/` | 手工导入测试文件：`*-ok-*.json` 应成功，`bad-*.json` 应被拒绝 |
| `src/model/topic.ts` | JSON 校验与规范化、限制、JSON 模板 |
| `src/model/library.ts` | 主题库的 `localStorage` 读写 |
| `src/model/markdown.ts` | Markdown 导出 |
| `src/graph/layout.ts` | 纯函数布局、连线、重叠检测、换边规则 |
| `src/graph/graph.ts` | 画布：渲染、平移缩放、展开收起、拖动换边 |
| `src/ui/*.ts` | 菜单栏、侧边栏、提示条 |
| `src/app.ts` | 把主题库、画布、侧边栏和菜单连起来 |

## JSON 格式

```json
{
  "title": "Docker 入门",
  "intro": "容器基础",
  "sources": [{ "title": "Docs", "url": "https://docs.docker.com" }],
  "tree": {
    "title": "Docker",
    "children": [{ "title": "镜像", "children": [{ "title": "分层" }] }]
  }
}
```

节点字段：`title`（必填）、`detail`、`kicker`、`facts`、`color`、`children`；一级分支还可写 `side`（`left` / `right`）。菜单「文件 → 下载 JSON 模板」可以拿到完整样例。

## 数据存放

所有主题和一级分支的左右位置保存在浏览器的 `localStorage`（键 `mindmap.topics.v1`），展开状态、缩放位置和语言选择也在这里。不同域名、不同浏览器之间互不相通，重要主题请用「导出为 JSON」备份。
