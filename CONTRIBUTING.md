# Contributing

Contributions are welcome.

## Development

Requirements:

- Node.js 20 or newer
- Zotero 7.x
- Git

Install dependencies and build:

```bash
npm install
npm run build
```

For live development with a local Zotero profile, configure the environment expected by `zotero-plugin-scaffold`, then run:

```bash
npm start
```

Keep repository-provider logic deterministic where possible. A discovered repository should be normalized to its repository root before it is written to the Zotero item.

## Pull requests

- Keep Zotero 7.0.x compatibility unless a change explicitly raises the minimum supported version.
- Do not send credentials or private tokens to third-party mirrors.
- Avoid adding a repository when confidence is below the configured threshold.
- Preserve the `repository:` Extra-field representation for database compatibility.
