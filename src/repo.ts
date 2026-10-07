export type RepoInfo = {
  platform: "github" | "gitee" | "huggingface";
  owner: string;
  repo: string;
  id: string;
  url: string;
  kind?: "model" | "dataset" | "space";
};

export function parseRepository(raw: string): RepoInfo | null {
  try {
    const u = new URL(raw);
    const host = u.hostname.toLowerCase().replace(/^www\./, "");
    const p = u.pathname.split("/").filter(Boolean).map(decodeURIComponent);
    if ((host === "github.com" || host === "gitee.com") && p.length >= 2) {
      const owner = p[0];
      const repo = p[1].replace(/\.git$/i, "");
      const platform = host === "github.com" ? "github" : "gitee";
      return { platform, owner, repo, id: owner + "/" + repo, url: "https://" + host + "/" + owner + "/" + repo };
    }
    if (host === "huggingface.co") {
      let kind: "model" | "dataset" | "space" = "model";
      if (p[0] === "datasets") { kind = "dataset"; p.shift(); }
      else if (p[0] === "spaces") { kind = "space"; p.shift(); }
      if (p.length >= 2) {
        const owner = p[0], repo = p[1];
        const prefix = kind === "dataset" ? "datasets/" : kind === "space" ? "spaces/" : "";
        return { platform:"huggingface", kind, owner, repo, id:owner + "/" + repo, url:"https://huggingface.co/" + prefix + owner + "/" + repo };
      }
    }
  } catch (_) {}
  return null;
}

export function extractRepositories(text: string): RepoInfo[] {
  const out = new Map<string, RepoInfo>();
  const re = /https?:\/\/[^\s<>"'()\[\]{}]+/gi;
  for (const match of String(text || "").matchAll(re)) {
    const repo = parseRepository(match[0].replace(/[.,;:!?]+$/, ""));
    if (repo) out.set(repo.url, repo);
  }
  return [...out.values()];
}

export function repositoryValue(item: any): string {
  const extra = String(item?.getField?.("extra") || "");
  return extra.match(/^repository\s*:\s*(.+)$/im)?.[1]?.trim() || "";
}

export async function setRepositoryValue(item: any, value: string, tagName: string) {
  const lines = String(item.getField("extra") || "").split(/\r?\n/).filter((x:string) => !/^repository\s*:/i.test(x));
  if (value.trim()) lines.push("repository: " + value.trim());
  item.setField("extra", lines.join("\n").trim());
  const hasTag = item.getTags().some((x:any) => x.tag === tagName);
  if (value && !hasTag) item.addTag(tagName, 1);
  if (!value && hasTag) item.removeTag(tagName);
  await item.saveTx();
}

export function platformLabel(repo: RepoInfo | null) {
  if (!repo) return "Repository";
  if (repo.platform === "github") return "GitHub";
  if (repo.platform === "gitee") return "Gitee";
  return repo.kind === "space" ? "HF Space" : repo.kind === "dataset" ? "HF Dataset" : "Hugging Face";
}
