# Changelog

## 0.2.5

- Fixed the built Fluent resource name used by Zotero 7 (repositorydetector-repository-detector.ftl).
- Repeated item-pane decoration after render so Code Repository / 代码仓库 stays visible after upgrading from older versions.
- Preserved multiple-repository clickable links and legacy-row cleanup from v0.2.4.
- Added version-driven automatic GitHub Releases from the main branch.

## 0.2.4

- Fixed a blank Code Repository label when upgrading from older plugin versions.
- Migrated the item-pane row to a new row ID and proactively removes the legacy row registration.
- Added a direct visible label fallback, independent of Fluent loading order.
- Changed the item-pane field from a multiline box to a compact single-line URL-style field.
- Added clickable provider links next to Code Repository; multiple repositories are shown side by side and open independently.

## 0.2.3

- Renamed the item-pane field to **Code Repository** in English and **代码仓库** in Chinese.
- Renamed the item-tree column to **Code Repo** in English and **代码仓库** in Chinese.
- Kept the persisted `repository:` Extra field and `#repository` tag unchanged for compatibility.

## 0.2.2

- Added real-time progress for multi-item repository detection.
- Made Repository entries openable from the item pane using Zotero-style open-link buttons.
- Made Repository column provider labels clickable.
- Preserved automatic Web Link attachment recognition, repository tagging, mirror fallback, and small-snapshot attachment.
