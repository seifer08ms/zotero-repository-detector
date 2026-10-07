# Repository Detector for Zotero

Repository Detector is a Zotero 7 plugin that detects whether a paper has a public code repository, stores the result as a repository field, makes it easy to filter papers with code, and can automatically attach small repository snapshots.

[中文说明](README.zh-CN.md)

## Features

- Detects repositories hosted on **GitHub**, **Hugging Face**, and **Gitee**.
- Recognizes repository URLs already present in item metadata and **Web Link child attachments**.
- Normalizes deep links such as GitHub `tree/`, `blob/`, and `issues/` URLs back to the repository root.
- Stores repository URLs in Zotero `Extra` as `repository: ...` for database compatibility.
- Adds a **Code Repository** row to the item pane and a **Code Repo** column to the item list.
- Opens repository pages directly from the Code Repository row and Code Repo column.
- Adds a configurable `#repository` tag for quick filtering.
- Shows live progress when scanning multiple selected items.
- Optionally downloads a repository snapshot and attaches it to the Zotero item when the total size is under the configured threshold (default: **1 MB**).
- Tries the official GitHub/Hugging Face endpoint first, then configurable mirror endpoints if direct access fails.
- Does not intentionally forward credentials to third-party mirrors.

## Supported Zotero versions

The current manifest targets **Zotero 7.0.x**, including Zotero 7.0.32.

## Installation

Download the XPI from the GitHub Releases page, then open Zotero:

**Tools → Plugins → gear icon → Install Plugin From File…**

Select the downloaded `.xpi` file.

## Usage

Select one or more regular Zotero items and choose **Detect Open-Source Repository** from the item context menu or Tools menu. For multiple items, a Zotero progress window shows the current item, completed count, repositories found, attachments added, and errors.

When a repository is found, the plugin writes a `repository:` line into the item's Extra field and adds the configured repository tag. A Code Repository row appears in the item pane, and the Code Repo column can be enabled in the item list.

If a child Web Link attachment points to a supported repository, the parent bibliographic item is treated as having that repository even when no search is required.

## Detection strategy

The detector prioritizes explicit evidence over fuzzy search:

1. Existing repository URLs in item metadata.
2. Repository URLs in Web Link child attachments.
3. arXiv/Hugging Face paper associations when available.
4. GitHub, Hugging Face, and Gitee title search with confidence scoring.

Title-search results are only accepted when they exceed the configured confidence threshold.

## Repository storage

Zotero does not expose an API for plugins to add arbitrary permanent database fields. Repository Detector therefore persists the value in `Extra`:

```text
repository: https://github.com/owner/project
```

The plugin presents this value as a dedicated Code Repository row and Code Repo column in the UI.

## Automatic snapshot download

The default download threshold is **1 MB**. The plugin checks reported repository size where possible and also enforces a byte limit while downloading. Oversized or unknown-size repositories are skipped automatically.

Downloaded snapshots are attached as child ZIP attachments of the bibliographic item.

## GitHub/Hugging Face mirrors

Official endpoints are always tried first. Mirror prefixes are configurable in the plugin preferences. Mirrors are only used for public requests; authentication headers are not intentionally sent to mirror endpoints.

## Development

This repository follows the build layout used by [`windingwind/zotero-plugin-template`](https://github.com/windingwind/zotero-plugin-template) and `zotero-plugin-scaffold`.

```bash
npm install
npm run build
```

The built plugin is written under `.scaffold/build`.

For development mode:

```bash
npm start
```

## Release workflow

Push a version tag such as:

```bash
git tag v0.2.3
git push origin v0.2.3
```

The included GitHub Actions release workflow builds the plugin, packages the XPI, generates Zotero `update.json` metadata with a SHA-256 hash, and publishes both files to the tagged GitHub Release.

## Project structure

```text
addon/                  Zotero manifest, bootstrap, preferences, locale assets
src/                    TypeScript plugin source
.github/workflows/      CI build and tagged release workflows
zotero-plugin.config.ts zotero-plugin-scaffold configuration
```

## License

MIT
