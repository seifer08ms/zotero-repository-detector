# Changelog

## 0.2.3

- Renamed the item-pane field to **Code Repository** in English and **代码仓库** in Chinese.
- Renamed the item-tree column to **Code Repo** in English and **代码仓库** in Chinese.
- Kept the persisted `repository:` Extra field and `#repository` tag unchanged for compatibility.

## 0.2.2

- Added real-time progress for multi-item repository detection.
- Made Repository entries openable from the item pane using Zotero-style open-link buttons.
- Made Repository column provider labels clickable.
- Preserved automatic Web Link attachment recognition, repository tagging, mirror fallback, and small-snapshot attachment.

## 0.2.1

- Fixed Zotero 7 manifest validation by including a valid `update_url`.
- Locked the packaged compatibility range to Zotero 7.0.x.

## 0.2.0

- Rebuilt the plugin around the Zotero 7 bootstrap/manifest structure.
- Added GitHub, Hugging Face, and Gitee detection.
- Added Repository item-pane row, item-tree column, tag-based filtering, and optional small snapshot downloads.
