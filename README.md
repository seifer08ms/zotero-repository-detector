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
- Supports multiple repository URLs for one paper; each repository is retained and can be opened independently.
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

Multiple repositories are stored on the same line separated by `; `.

## Development

```bash
npm install
npm run build
```

The built plugin is written under `.scaffold/build`.

## Automatic GitHub Release

Releases are version-driven. Update the version in `package.json` and push to `main`. If `vX.Y.Z` has not already been released, GitHub Actions automatically:

1. builds the plugin;
2. packages the XPI;
3. generates `update.json`;
4. creates the matching `vX.Y.Z` tag;
5. creates a GitHub Release and uploads the XPI and update manifest.

Pushing additional commits without changing the version will not create duplicate releases.

## Project structure

```text
addon/                  Zotero manifest, bootstrap, preferences, locale assets
src/                    TypeScript plugin source
.github/workflows/      CI and automatic release workflows
zotero-plugin.config.ts zotero-plugin-scaffold configuration
```

## License

MIT
