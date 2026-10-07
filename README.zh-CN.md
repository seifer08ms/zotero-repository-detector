# Zotero Repository Detector

Repository Detector 是一个面向 Zotero 7 的开源代码仓库检测插件，用于判断论文是否存在公开代码实现，并把仓库信息直接集成到 Zotero 条目中。

[English](README.md)

## 功能

- 自动检测 **GitHub、Hugging Face、Gitee** 仓库。
- 自动识别条目元数据中已经存在的仓库链接。
- 自动识别论文条目下面的 **Web Link / 网页链接附件**；如果链接指向支持的代码仓库，直接认定为该论文的 Repository。
- 将 GitHub `tree/`、`blob/`、`issues/` 等深层链接规范化为仓库根地址。
- 使用 Zotero `Extra` 中的 `repository:` 保存数据，避免修改 Zotero 数据库 schema。
- 在右侧条目信息区域显示独立的 **代码仓库** 行。
- 在条目列表中提供 **代码仓库** 列。
- 代码仓库行和代码仓库列均可直接点击，在系统默认浏览器中打开仓库网页。
- 自动添加可配置的 `#repository` 标签，便于快速筛选有代码实现的论文。
- 多选条目批量检测时显示实时进度，包括当前论文、完成数量、发现仓库数量、新增附件数量和错误数量。
- 仓库总容量低于阈值时可自动下载快照并作为 ZIP 子附件挂到论文条目下面，默认阈值为 **1 MB**。
- GitHub 和 Hugging Face 优先直连；失败后按照设置中的镜像地址依次回退。
- 镜像只处理公开请求，不主动向第三方镜像转发认证凭据。

## Zotero 版本

当前 manifest 面向 **Zotero 7.0.x**，包含 Zotero 7.0.32。

## 安装

从 GitHub Releases 下载 `.xpi`，然后在 Zotero 中打开：

**工具 → 插件 → 齿轮 → Install Plugin From File / 从文件安装插件**

选择 XPI 即可。

## 使用

选择一个或多个论文条目，在右键菜单或“工具”菜单中执行 **检测开源代码仓库**。

多选时插件会显示 Zotero 原生进度窗口。检测到仓库后，会将类似下面的内容写入条目 Extra：

```text
repository: https://github.com/owner/project
```

同时更新代码仓库 UI 和 `#repository` 标签。

如果论文下面已有指向 GitHub、Hugging Face 或 Gitee 的 Web Link 子附件，插件会优先把该链接识别为 Repository，而不需要依赖标题搜索。

## 检测顺序

识别时优先使用明确证据：

1. 条目中已有的代码仓库 URL。
2. Web Link 子附件中的仓库 URL。
3. arXiv / Hugging Face Papers 等明确关联信息。
4. 根据论文标题在 GitHub、Hugging Face、Gitee 中检索并进行置信度判断。

标题搜索结果只有达到设置中的最低置信度后才会写入条目。

## 自动下载

默认自动下载阈值为 **1 MB**。插件在可获得仓库大小时先进行预检查，并在实际下载时再次按字节限制，避免下载内容超过阈值。

符合条件的代码会保存为 ZIP，并作为论文条目的子附件导入 Zotero。

## 开发

工程采用 `windingwind/zotero-plugin-template` / `zotero-plugin-scaffold` 的项目结构。

```bash
npm install
npm run build
```

构建结果位于 `.scaffold/build`。

开发模式：

```bash
npm start
```

## GitHub 自动发布

项目已经包含 GitHub Actions。推送版本 tag，例如：

```bash
git tag v0.2.3
git push origin v0.2.3
```

Release workflow 会自动构建插件、打包 XPI、生成带 SHA-256 校验值的 Zotero `update.json`，并把两者发布到对应 GitHub Release。

## 目录结构

```text
addon/                  Zotero manifest、bootstrap、设置界面和语言文件
src/                    TypeScript 源码
.github/workflows/      CI 与 Release 自动化
zotero-plugin.config.ts 构建配置
```

## License

MIT
