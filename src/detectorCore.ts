import { extractRepositories, repositoryValue, setRepositoryValue } from "./repo";
import { detectByTitle } from "./providers";
import { downloadSnapshot } from "./downloader";
import { createProgress, updateProgress, toast } from "./ui";

const PREF="extensions.repositoryDetector.";

const core:any = {
  pref(name:string,fallback:any) {
    try { const v=Zotero.Prefs.get(PREF+name,true); return v ?? fallback; }
    catch (_) { return fallback; }
  },
  prefBool(name:string,fallback=true) {
    const v=this.pref(name,fallback);
    return typeof v === "boolean" ? v : String(v).toLowerCase() === "true";
  },
  prefNumber(name:string,fallback:number) {
    const n=Number(this.pref(name,fallback));
    return Number.isFinite(n) ? n : fallback;
  },
  tagName() {
    return String(this.pref("tagName","#repository") || "#repository").trim() || "#repository";
  },
  maxDownloadBytes() {
    return Math.max(1,this.prefNumber("maxDownloadMB",1)*1024*1024);
  },
  requestTimeout() {
    return Math.max(3000,this.prefNumber("requestTimeoutSeconds",15)*1000);
  },
  githubMirrors() {
    return String(this.pref("githubMirrors","https://ghfast.top/\nhttps://ghproxy.net/"))
      .split(/\r?\n/).map((x:string)=>x.trim()).filter(Boolean);
  },
  hfMirror() {
    return String(this.pref("hfMirror","https://hf-mirror.com") || "").replace(/\/$/,"");
  },

  selectedItems(win:any) {
    const out:any[]=[];
    const seen=new Set<number>();
    for (let item of win?.ZoteroPane?.getSelectedItems?.() || []) {
      if (item?.isAttachment?.() && item.parentItemID) item=Zotero.Items.get(item.parentItemID);
      if (item?.isRegularItem?.() && !seen.has(item.id)) {
        seen.add(item.id);
        out.push(item);
      }
    }
    return out;
  },

  async detectRepositories(item:any, options:{excludeStoredRepository?:boolean}={}) {
    const direct=new Map<string,any>();
    const extra=String(item.getField("extra") || "");
    // When explicitly refreshing a known repository, do not mistake the saved
    // result for new detection evidence.
    const searchableExtra=options.excludeStoredRepository
      ? extra.split(/\r?\n/).filter((line:string)=>!/^\s*repository\s*:/i.test(line)).join("\n")
      : extra;
    const text=[item.getField("url") || "",searchableExtra,item.getField("abstractNote") || ""].join("\n");
    for (const repo of extractRepositories(text)) direct.set(repo.url,repo);

    for (const id of item.getAttachments?.() || []) {
      let attachment:any;
      try { attachment=await Zotero.Items.getAsync(id); }
      catch (e) { Zotero.logError(e); continue; }
      if (!attachment?.isAttachment?.()) continue;
      // Snapshot attachments are old output, not a source of fresh results.
      const title=String(attachment.getField("title") || "");
      if (options.excludeStoredRepository && title.startsWith("Repository Snapshot")) continue;
      for (const repo of extractRepositories(String(attachment.getField("url") || ""))) {
        direct.set(repo.url,repo);
      }
    }
    if (direct.size) return [...direct.values()];
    if (!this.prefBool("searchByTitle",true)) return [];

    const title=String(item.getField("title") || "").trim();
    if (title.length < 6) return [];
    return detectByTitle(title,{
      github:this.prefBool("useGitHub",true),
      gitee:this.prefBool("useGitee",true),
      hf:this.prefBool("useHuggingFace",true),
      timeoutMs:this.requestTimeout(),
      mirrors:this.githubMirrors(),
      hfMirror:this.hfMirror(),
      minScore:this.prefNumber("minConfidence",0.84),
    });
  },

  async scanItem(item:any,manual=true) {
    // One policy for ALL entry points: manual, batch, and Zotero notifier.
    // Existing repository metadata is immutable by default, and no network or
    // snapshot download must happen in the skip branch.
    const stored=repositoryValue(item).trim();
    const force=this.prefBool("forceUpdateExisting",false);
    if (stored && !force) {
      return {urls:[],attached:0,skipped:true};
    }

    const detected=await this.detectRepositories(item,{
      excludeStoredRepository:!!stored,
    });
    const newUrls:string[]=[...new Set<string>(
      detected.map((x:any)=>String(x.url)).filter(Boolean)
    )];
    const oldUrls:string[]=stored
      ? extractRepositories(stored).map(repo=>repo.url)
      : [];

    // Force-refresh discovers new repos but never silently drops existing ones.
    const urls:string[]=[...new Set<string>([...oldUrls,...newUrls])];
    const shouldSave=urls.length>0 && (
      !stored || newUrls.some(url=>!oldUrls.includes(url))
    );
    if (shouldSave) {
      await setRepositoryValue(item,urls.join("; "),this.tagName());
      try { await this.refreshRepositoryUI?.(item.id); }
      catch (e) { Zotero.logError(e); }
    }

    let attached=0;
    if (urls.length && this.prefBool("autoDownload",true)) {
      for (const url of urls) {
        const result=await downloadSnapshot(item,url,{
          maxBytes:this.maxDownloadBytes(),
          timeoutMs:this.requestTimeout(),
          mirrors:this.githubMirrors(),
        });
        if (result === "attached") attached++;
      }
    }
    if (manual && !urls.length) {
      toast("未检测到 Repository："+(item.getField("title")||""));
    }
    return {urls,attached,skipped:false};
  },

  async scanSelected(win:any) {
    const items=this.selectedItems(win);
    if (!items.length) return toast("请选择论文条目");

    const progress=createProgress(items.length);
    let found=0,attached=0,errors=0,skipped=0;
    for (let i=0;i<items.length;i++) {
      const item=items[i];
      const title=item.getField("title") || "未命名条目";
      updateProgress(progress,i,title,found,attached,errors,skipped);
      try {
        const result=await this.scanItem(item,true);
        if (result.skipped) skipped++;
        else if (result.urls.length) found++;
        attached+=result.attached;
      } catch (e) {
        errors++;
        Zotero.logError(e);
      }
      updateProgress(progress,i+1,title,found,attached,errors,skipped);
    }
    if (progress) {
      progress.line.setProgress(100);
      progress.pw.startCloseTimer(4500);
    } else if (skipped) {
      toast("已跳过 "+skipped+" 个已有 Repository 的条目；需要重检请开启“强制更新已有 Repository”");
    } else {
      toast(found ? "检测到 "+found+" 个有 Repository 的条目" : "未检测到 Repository");
    }
  },

  async downloadSelected(win:any) {
    let attached=0;
    for (const item of this.selectedItems(win)) {
      for (const repo of extractRepositories(repositoryValue(item))) {
        const result=await downloadSnapshot(item,repo.url,{
          maxBytes:this.maxDownloadBytes(),
          timeoutMs:this.requestTimeout(),
          mirrors:this.githubMirrors(),
        });
        if (result === "attached") attached++;
      }
    }
    toast("新增 "+attached+" 个 Repository 快照附件");
  },
};

export default core;
