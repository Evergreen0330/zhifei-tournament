# 知飞赛事管理系统（zhifei-tournament）

面向无人机足球、POP 穿越、翼客虚拟飞行、FPV 竞速等赛事的一站式办赛 SaaS 平台（前端模块一：赛事基础管理）。

## 技术栈

- 纯静态站点：HTML + CSS + 原生 JavaScript
- 数据持久化：浏览器 localStorage（内置种子数据）
- 无后端依赖、无需构建，可直接静态托管

## 在线预览

https://evergreen0330.github.io/zhifei-tournament/

## 本地运行

直接用浏览器打开 `index.html`，或起一个静态服务器：

```bash
python3 -m http.server 8000
```

然后访问 http://localhost:8000

## 目录结构

| 文件 | 说明 |
|---|---|
| `index.html` | 页面结构 + SEO 元信息 |
| `styles.css` | 样式 |
| `app.js` | SPA 逻辑（localStorage 持久化 + 视图路由） |
| `og-cover.svg` / `robots.txt` / `sitemap.xml` | SEO 资源 |
