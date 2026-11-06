# 美国政策事件与标普500

可部署的 React 单页网站：108 条 1912—2026 美国政策事件，全部可选、可逐条关闭；标普500主图、政策时间轴和结构化事件解析。

## 本地运行

```powershell
cd "C:\Users\cyh23\OneDrive\Desktop\美股\site"
npm.cmd install
npm.cmd run dev
```

打开终端提示的本地地址（通常是 `http://localhost:5173`）。

## 构建

```powershell
npm.cmd run data:strict
npm.cmd run test
npm.cmd run build
npm.cmd run preview
```

`dist/` 可部署到任意静态托管（Netlify、Vercel、GitHub Pages、Nginx）。

## GitHub Pages

仓库已包含 `.github/workflows/deploy.yml`。推送到 `main` 后：

1. 在仓库 `Settings → Pages` 把 Source 设为 **GitHub Actions**
2. Actions 会自动构建并发布
3. 发布地址通常是 `https://<用户名>.github.io/<仓库名>/`

## 数据

- `source-data/政策事件总表.csv`：108 条事件主表
- `source-data/标普500_1927-2026.csv`：标普500日线
- `content/analysis-*.json`：逐条结构化解析
- `content/taxonomy.json`：结构层与政策工具词典
- `public/data/`：构建产物，运行时读取

## 交互

- 默认 108 条全部开启
- 单个事件独立开关；类别/结构层/年代支持整组开关
- 全部开启、全部关闭、反选
- 预设：核心32、K1—K11
- 搜索、类别/结构层/年代/政策工具筛选
- 选择状态保存到 `localStorage`
- 主图只显示 1927—2026 可映射事件；1927 年前和 2026-06-03 后事件在时间轴展示

## 说明

研究资料整理，不构成投资建议。标普500为价格指数，不含股息；1927—1957 为回溯/重构数据。
