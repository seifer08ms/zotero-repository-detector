import { extractRepositories, platformLabel, repositoryValue, RepoInfo } from "./repo";

function showProviderIcons() {
  try {
    const pref=Zotero.Prefs.get("extensions.repositoryDetector.showProviderIcons",true);
    return pref === undefined || pref === null ? true : pref === true || String(pref) === "true";
  } catch (_) { return true; }
}

function providerIcon(doc:any,repo:RepoInfo) {
  const icon=doc.createElement("img");
  icon.className="repository-detector-provider-icon";
  icon.src="chrome://repositorydetector/content/icons/"+repo.platform+".svg";
  icon.alt=platformLabel(repo);
  icon.style.width="15px";
  icon.style.height="15px";
  icon.style.objectFit="contain";
  icon.style.flexShrink="0";
  return icon;
}


function localeIsChinese() {
  return String((Zotero as any).locale || "").toLowerCase().startsWith("zh");
}

export function renderRepositoryCell(data:string,column:any,doc:any) {
  const cell=doc.createElement("span");
  cell.className="cell "+(column.className||"");
  cell.style.display="flex";
  cell.style.gap="6px";
  cell.style.alignItems="center";

  extractRepositories(data).forEach((repo,i)=>{
    if (i) {
      const separator=doc.createElement("span");
      separator.textContent="·";
      cell.appendChild(separator);
    }
    const link=doc.createElement("span");
    link.className="text-link";
    link.setAttribute("role","link");
    if (showProviderIcons()) {
      link.style.display="inline-flex";
      link.style.alignItems="center";
      link.style.gap="4px";
      link.appendChild(providerIcon(doc,repo));
    }
    link.appendChild(doc.createTextNode(platformLabel(repo)));
    link.setAttribute("title",repo.url);
    link.onclick=(event:any)=>{
      event.stopPropagation();
      Zotero.launchURL(repo.url);
    };
    cell.appendChild(link);
  });
  return cell;
}

export function renderRepositorySection(
  body:any,
  item:any,
  setSectionSummary:(summary:string)=>void
) {
  while (body.firstChild) body.firstChild.remove();

  const doc=body.ownerDocument;
  const repos=extractRepositories(repositoryValue(item));

  setSectionSummary(
    repos.length
      ? (localeIsChinese() ? repos.length+" 个仓库" : repos.length+" repositor"+(repos.length===1?"y":"ies"))
      : ""
  );

  const wrapper=doc.createElement("div");
  wrapper.className="repository-detector-section";
  wrapper.style.display="grid";
  wrapper.style.gap="6px";
  wrapper.style.padding="2px 0 6px";

  if (!repos.length) {
    const empty=doc.createElement("div");
    empty.textContent=localeIsChinese()
      ? "当前条目尚未检测到代码仓库"
      : "No code repository detected for this item";
    empty.style.opacity="0.7";
    wrapper.appendChild(empty);
    body.appendChild(wrapper);
    return;
  }

  repos.forEach((repo,index)=>{
    const row=doc.createElement("div");
    row.className="repository-detector-repository-row";
    row.style.display="grid";
    row.style.gridTemplateColumns="max-content minmax(0, 1fr) max-content";
    row.style.alignItems="center";
    row.style.columnGap="8px";
    row.style.minWidth="0";

    const provider=doc.createElement("span");
    if (showProviderIcons()) {
      provider.style.display="inline-flex";
      provider.style.alignItems="center";
      provider.style.gap="5px";
      provider.appendChild(providerIcon(doc,repo));
    }
    provider.appendChild(doc.createTextNode(platformLabel(repo)));
    provider.style.fontWeight="600";
    provider.style.whiteSpace="nowrap";
    row.appendChild(provider);

    const link=doc.createElement("span");
    link.className="text-link";
    link.setAttribute("role","link");
    link.setAttribute("title",repo.url);
    link.textContent=repo.url;
    link.style.overflow="hidden";
    link.style.textOverflow="ellipsis";
    link.style.whiteSpace="nowrap";
    link.style.cursor="pointer";
    link.addEventListener("click",(event:any)=>{
      event.stopPropagation();
      Zotero.launchURL(repo.url);
    });
    row.appendChild(link);

    const open=doc.createElement("button");
    open.type="button";
    open.textContent="↗";
    open.setAttribute(
      "title",
      localeIsChinese() ? "在浏览器中打开" : "Open in browser"
    );
    open.style.cursor="pointer";
    open.addEventListener("click",(event:any)=>{
      event.stopPropagation();
      Zotero.launchURL(repo.url);
    });
    row.appendChild(open);

    wrapper.appendChild(row);
  });

  body.appendChild(wrapper);
}

export function createProgress(total:number) {
  if (total < 2) return null;
  try {
    const pw=new Zotero.ProgressWindow();
    pw.changeHeadline("检测开源项目 0/"+total);
    const line=new pw.ItemProgress(null,"准备检测…");
    line.setProgress(0);
    pw.show();
    return {pw,line,total};
  } catch (_) {
    return null;
  }
}

export function updateProgress(
  progress:any, completed:number, title:string,
  found:number, attached:number, errors:number, skipped=0
) {
  if (!progress) return;
  progress.pw.changeHeadline("检测开源项目 "+completed+"/"+progress.total);
  progress.line.setProgress(Math.round(completed/progress.total*100));
  progress.line.setText(
    String(title).slice(0,60)+" · Repo "+found+" · 下载 "+attached+" · 跳过 "+skipped+" · 错误 "+errors
  );
}

export function toast(text:string) {
  try {
    const p=new Zotero.ProgressWindow();
    p.changeHeadline("Repository Detector");
    p.addDescription(text);
    p.show();
    p.startCloseTimer(3500);
  } catch (_) {}
}
