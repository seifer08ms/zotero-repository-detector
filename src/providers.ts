import { RepoInfo, parseRepository } from "./repo";

export type Candidate = RepoInfo & { score: number; name?: string; description?: string };

function words(text: string) {
  return String(text || "").toLowerCase().normalize("NFKD")
    .replace(/[^\p{L}\p{N}]+/gu, " ").trim().split(/\s+/).filter(x => x.length > 1);
}

function score(title: string, candidate: any) {
  const a = words(title);
  const b = new Set(words([candidate.name, candidate.id, candidate.description].join(" ")));
  if (!a.length) return 0;
  const compact = (s:string) => words(s).join("");
  if (compact(candidate.name || "") === compact(title)) return 0.98;
  const coverage = a.filter(x => b.has(x)).length / a.length;
  return 0.56 + 0.42 * coverage;
}

async function fetchJSON(url: string, timeoutMs: number) {
  const win:any = Zotero.getMainWindow?.();
  const fetchFn = win?.fetch?.bind(win) || globalThis.fetch;
  const Abort:any = win?.AbortController || globalThis.AbortController;
  const controller = Abort ? new Abort() : null;
  const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
  try {
    const response = await fetchFn(url, { credentials:"omit", redirect:"follow", cache:"no-store", signal:controller?.signal });
    if (!response.ok) throw new Error("HTTP " + response.status);
    return JSON.parse(await response.text());
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function query(title: string) {
  return words(title).filter(x => x.length > 2).slice(0, 8).join(" ") || title.slice(0, 100);
}

export async function searchGitHub(title:string, timeoutMs:number, mirrors:string[]): Promise<Candidate[]> {
  const original = "https://api.github.com/search/repositories?q=" +
    encodeURIComponent(query(title) + " in:name,description") + "&sort=stars&per_page=5";
  const urls = [original, ...mirrors.map(m => (m.endsWith("/") ? m : m + "/") + original)];
  let data:any = null;
  for (const url of urls) {
    try { data = await fetchJSON(url, timeoutMs); break; } catch (_) {}
  }
  if (!data) return [];
  return (data.items || []).flatMap((x:any) => {
    const repo = parseRepository(x.html_url);
    return repo ? [{ ...repo, name:x.name, description:x.description, score:score(title, x) }] : [];
  });
}

export async function searchGitee(title:string, timeoutMs:number): Promise<Candidate[]> {
  try {
    const data:any = await fetchJSON("https://gitee.com/api/v5/search/repositories?q=" +
      encodeURIComponent(query(title)) + "&per_page=5", timeoutMs);
    const rows = Array.isArray(data) ? data : data.items || [];
    return rows.flatMap((x:any) => {
      const repo = parseRepository(x.html_url || x.url);
      return repo ? [{ ...repo, name:x.name, description:x.description, score:score(title, x) }] : [];
    });
  } catch (_) { return []; }
}

export async function searchHuggingFace(title:string, timeoutMs:number, mirror:string): Promise<Candidate[]> {
  const out: Candidate[] = [];
  const endpoints = [["models",""],["datasets","datasets/"],["spaces","spaces/"]];
  for (const [endpoint,prefix] of endpoints) {
    const official = "https://huggingface.co/api/" + endpoint + "?search=" + encodeURIComponent(query(title)) + "&limit=5";
    const urls = [official];
    if (mirror) {
      const u = new URL(official);
      urls.push(mirror.replace(/\/$/,"") + u.pathname + u.search);
    }
    let data:any = null;
    for (const url of urls) { try { data = await fetchJSON(url, timeoutMs); break; } catch (_) {} }
    for (const x of Array.isArray(data) ? data : []) {
      const id = x.id || x.modelId;
      if (!id) continue;
      const repo = parseRepository("https://huggingface.co/" + prefix + id);
      if (repo) out.push({ ...repo, name:String(id).split("/").pop(), description:x.description, score:score(title, x) });
    }
  }
  return out;
}

export async function detectByTitle(
  title:string,
  prefs:{github:boolean; gitee:boolean; hf:boolean; timeoutMs:number; mirrors:string[]; hfMirror:string; minScore:number}
) {
  const jobs:Promise<Candidate[]>[] = [];
  if (prefs.github) jobs.push(searchGitHub(title, prefs.timeoutMs, prefs.mirrors));
  if (prefs.gitee) jobs.push(searchGitee(title, prefs.timeoutMs));
  if (prefs.hf) jobs.push(searchHuggingFace(title, prefs.timeoutMs, prefs.hfMirror));
  const out:Candidate[] = [];
  for (const result of await Promise.allSettled(jobs)) {
    if (result.status === "fulfilled") out.push(...result.value.filter(x => x.score >= prefs.minScore));
  }
  const seen = new Map<string,Candidate>();
  for (const c of out.sort((a,b) => b.score-a.score)) if (!seen.has(c.url)) seen.set(c.url,c);
  return [...seen.values()];
}
