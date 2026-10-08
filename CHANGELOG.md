# Changelog

## 0.2.8

- Fixed duplicate snapshot downloads for existing items after Zotero restart.
- Existing child attachments are now loaded with Zotero.Items.getAsync() before duplicate checks.
- Repository snapshot deduplication compares normalized repository identities instead of raw URL strings.
- Added a legacy compatibility fallback using the Repository Snapshot — owner/repo attachment title.
- Preserves the v0.2.7 item-level scan debounce, in-flight scan lock, cooldown, and per-repository download lock.

## 0.2.7

- Debounced rapid Zotero add/modify notifications for newly created items.
- Added an item-level in-flight scan lock and short cooldown to prevent repeated automatic scans caused by the plugin's own writes.
- Added a per-item/per-repository download lock.
- Re-checks existing snapshot attachments immediately before import to prevent duplicate Repository Snapshot ZIPs.
- Deduplicates repository URLs before saving and downloading.
- Explicitly refreshes the Code Repository item-pane section and item list after repository metadata is written.

## 0.2.6

- Replaced the fragile custom Info Row with Zotero 7's official custom Item Pane Section API.
- The right pane now has a dedicated Code Repository / 代码仓库 section with a reliable section title.
- Each repository is rendered on its own row with a clickable URL and browser-open button.
- Multiple repositories are displayed independently instead of being squeezed into one field.
- Legacy blank repository rows from older versions are unregistered and removed during startup.
- Localization is loaded before the section is registered.

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
