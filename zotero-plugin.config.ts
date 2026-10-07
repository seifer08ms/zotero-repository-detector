import { defineConfig } from "zotero-plugin-scaffold";
import pkg from "./package.json";

export default defineConfig({
  source: ["src", "addon"],
  dist: ".scaffold/build",
  name: pkg.config.addonName,
  id: pkg.config.addonID,
  namespace: pkg.config.addonRef,
  updateURL: "https://github.com/seifer08ms/zotero-repository-detector/releases/latest/download/update.json",
  xpiDownloadLink:
    "https://github.com/seifer08ms/zotero-repository-detector/releases/download/v{{version}}/{{xpiName}}.xpi",
  build: {
    assets: ["addon/**/*.*"],
    define: {
      ...pkg.config,
      author: pkg.author,
      description: pkg.description,
      buildVersion: pkg.version,
    },
    prefs: {prefix: pkg.config.prefsPrefix},
    esbuildOptions: [{
      entryPoints: ["src/index.ts"],
      bundle: true,
      target: "firefox115",
      outfile: `.scaffold/build/addon/content/scripts/${pkg.config.addonRef}.js`,
    }],
  },
});
