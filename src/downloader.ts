import { parseRepository } from "./repo";

const downloadLocks = new Map<string, Promise<string>>();

async function response(url:string, timeoutMs:number) {
  const win:any = Zotero.getMainWindow?.();
  const fetchFn = win?.fetch?.bind(win) || globalThis.fetch;
  const Abort:any = win?.AbortController || globalThis.AbortController;
  const controller = Abort ? new Abort() : null;
  const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
  try {
    const r = await fetchFn(url, { credentials:"omit", redirect:"follow", cache:"no-store", signal:controller?.signal });
    if (!r.ok) throw new Error("HTTP " + r.status);
    return r;
  } finally { if (timer) clearTimeout(timer); }
}

async function jsonWithFallback(urls:string[], timeoutMs:number) {
  let last:any;
  for (const u of urls) {
    try { return JSON.parse(await (await response(u, timeoutMs)).text()); }
    catch (e) { last=e; }
  }
  throw last || new Error("Request failed");
}

async function findExistingSnapshot(item:any, repoURL:string) {
  for (const id of item.getAttachments?.() || []) {
    let a:any;
    try { a = Zotero.Items.get(id); } catch (_) { continue; }
    if (!a) continue;
    const url = String(a.getField?.("url") || "");
    const title = String(a.getField?.("title") || "");
    if (url === repoURL || (title.startsWith("Repository Snapshot — ") && url === repoURL)) {
      return true;
    }
  }
  return false;
}

export async function downloadSnapshot(
  item:any,
  repoURL:string,
  opts:{maxBytes:number; timeoutMs:number; mirrors:string[]}
) {
  const repo = parseRepository(repoURL);
  if (!repo || repo.platform === "huggingface") return "unsupported";

  const key = item.id + "|" + repo.url;
  const existingLock = downloadLocks.get(key);
  if (existingLock) return existingLock;

  const task = (async () => {
    if (await findExistingSnapshot(item, repo.url)) return "exists";

    try {
    const api = repo.platform === "github"
      ? "https://api.github.com/repos/" + repo.id
      : "https://gitee.com/api/v5/repos/" + repo.id;
    const metaURLs = repo.platform === "github"
      ? [api, ...opts.mirrors.map(m => (m.endsWith("/")?m:m+"/") + api)]
      : [api];
    const meta:any = await jsonWithFallback(metaURLs, opts.timeoutMs);
    const bytes = Number(meta.size) * 1024;
    if (!Number.isFinite(bytes) || bytes > opts.maxBytes) return "too-large";

    const branch = meta.default_branch || (repo.platform === "github" ? "main" : "master");
    const archive = repo.platform === "github"
      ? "https://github.com/" + repo.id + "/archive/refs/heads/" + encodeURIComponent(branch) + ".zip"
      : "https://gitee.com/" + repo.id + "/repository/archive/" + encodeURIComponent(branch) + ".zip";
    const urls = repo.platform === "github"
      ? [archive, ...opts.mirrors.map(m => (m.endsWith("/")?m:m+"/") + archive)]
      : [archive];

    let data:Uint8Array|null = null;
    for (const u of urls) {
      try {
        const ab = await (await response(u, opts.timeoutMs)).arrayBuffer();
        if (ab.byteLength > opts.maxBytes) continue;
        data = new Uint8Array(ab); break;
      } catch (_) {}
    }
    if (!data) return "failed";

    // A concurrent or earlier run may have attached the snapshot while we were downloading.
    if (await findExistingSnapshot(item, repo.url)) return "exists";

    const file = Zotero.getTempDirectory().clone();
    file.append(("repo-" + repo.owner + "-" + repo.repo + ".zip").replace(/[^\w.-]/g,"_"));
    file.createUnique(Ci.nsIFile.NORMAL_FILE_TYPE, 0o600);
    await IOUtils.write(file.path, data);
    const attachment = await Zotero.Attachments.importFromFile({
      file, parentItemID:item.id,
      title:"Repository Snapshot — " + repo.id,
      contentType:"application/zip",
    });
    attachment.setField("url", repo.url);
    await attachment.saveTx();
    try { file.remove(false); } catch (_) {}
    return "attached";
    } catch (e) {
      Zotero.logError(e);
      return "failed";
    }
  })();

  downloadLocks.set(key, task);
  try {
    return await task;
  } finally {
    if (downloadLocks.get(key) === task) downloadLocks.delete(key);
  }
}
