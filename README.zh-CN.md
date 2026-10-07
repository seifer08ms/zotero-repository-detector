# Zotero Repository Detector

Repository Detector 是一个面向 Zotero 7 的开源代码仓库检测插件，用于判断论文是否存在公开代码实现，并把仓库信息直接集成到 Zotero 条目中。

[English](README.md)

## 功能

- 自动检测 **GitHub、Hugging Face、Gitee** 仓库。
- 自动识别条目元数据和 **Web Link / 网页链接附件** 中已经存在的仓库链接。
- 将 GitHub `tree/`、`blob/`、`issues/` 等深层链接规范化为仓库根地址。
- 使用 Zotero `Extra` 中的 `repository:` 保存数据。
- 右侧条目信息区域显示 **代码仓库**。
- 条目列表提供 **代码仓库** 列。
- 支持一篇论文对应多个仓库，每个仓库都保留并可独立点击打开。
- 自动添加可配置的 `#repository` 标签。
- 多选条目检测时显示实时进度。
- 仓库低于阈值时自动下载并作为 ZIP 子附件关联，默认阈值 **1 MB**。
- GitHub 和 Hugging Face 优先直连，失败后使用可配置镜像。

## Zotero 版本

当前版本面向 **Zotero 7.0.x**，包括 Zotero 7.0.32。

## 安装

从 GitHub Releases 下载 XPI，然后在 Zotero 中：

**工具 → 插件 → 齿轮 → Install Plugin From File / 从文件安装插件**

## 数据保存

单个仓库：

```text
repository: https://github.com/owner/project
```

多个仓库使用 `; ` 分隔，仍然保存在同一个 `repository:` 字段中。

## 开发

```bash
npm install
npm run build
```

## GitHub 自动发布

以后不需要手动创建 tag。只需要：

1. 修改 `package.json` 中的版本号，例如从 `0.2.5` 改成 `0.2.6`；
2. push 到 `main`。

GitHub Actions 会自动检查该版本是否已经发布。如果没有，会自动：

- 构建插件；
- 打包 XPI；
- 生成 `update.json`；
- 创建对应的 `vX.Y.Z` tag；
- 创建 GitHub Release；
- 上传 XPI 和 `update.json`。

如果版本号没有变化，后续 push 不会重复发布同一个版本。

## License

MIT
