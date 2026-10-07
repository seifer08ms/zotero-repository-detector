import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const [xpiPathArg] = process.argv.slice(2);
if (!xpiPathArg) {
  throw new Error("Usage: node scripts/generate-update.mjs <xpi-path>");
}

const repo = process.env.GITHUB_REPOSITORY;
if (!repo || !repo.includes("/")) {
  throw new Error("GITHUB_REPOSITORY must be set to owner/repository");
}

const pkg = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
const version = pkg.version;
const xpiPath = path.resolve(xpiPathArg);
const xpiName = path.basename(xpiPath);
const bytes = await readFile(xpiPath);
const hash = createHash("sha256").update(bytes).digest("hex");

const data = {
  addons: {
    [pkg.config.addonID]: {
      updates: [
        {
          version,
          update_link: `https://github.com/${repo}/releases/download/v${version}/${xpiName}`,
          update_hash: `sha256:${hash}`,
          applications: {
            zotero: {
              strict_min_version: "7.0",
              strict_max_version: "7.0.*",
            },
          },
        },
      ],
    },
  },
};

await writeFile(
  new URL("../update.json", import.meta.url),
  JSON.stringify(data, null, 2) + "\n",
  "utf8",
);
