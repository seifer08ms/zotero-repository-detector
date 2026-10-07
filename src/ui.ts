import { extractRepositories, platformLabel } from "./repo";

const LEGACY_ROW_ID="repository-detector-repository";
const ROW_ID="repository-detector-code-repository";

function currentLabel() {
  const locale=String((Zotero as any).locale || "").toLowerCase();
  return locale.startsWith("zh") ? "代码仓库" : "Code Repository";
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
    link.textContent=platformLabel(repo);
    link.setAttribute("title",repo.url);
    link.onclick=(event:any)=>{
      event.stopPropagation();
      Zotero.launchURL(repo.url);
    };
    cell.appendChild(link);
  });
  return cell;
}

export function decorateRepositoryRows() {
  for (const win of Zotero.getMainWindows()) {
    const doc=win.document;

    // Remove the old row that may survive an in-place upgrade.
    for (const oldRow of Array.from(
      doc.querySelectorAll('.meta-row[data-custom-row-id="'+LEGACY_ROW_ID+'"]')
    ) as any[]) {
      try { oldRow.remove(); } catch (_) {}
    }

    const rows=doc.querySelectorAll(
      '.meta-row[data-custom-row-id="'+ROW_ID+'"]'
    );

    for (const row of Array.from(rows) as any[]) {
      const label:any=row.querySelector(".meta-label label, .meta-label .key, .meta-label");
      if (label) label.textContent=currentLabel();

      const data:any=row.querySelector(".meta-data");
      const value:any=row.querySelector(".meta-data > .value");
      if (!value || !data) continue;

      value.style.cursor="text";

      if (!value.dataset.repoClick) {
        value.dataset.repoClick="1";
        value.addEventListener("dblclick",()=>{
          const repo=extractRepositories(String(value.value||""))[0];
          if (repo) Zotero.launchURL(repo.url);
        });
      }

      // Rebuild provider links every refresh so edits are reflected immediately.
      data.querySelector(".repository-detector-link-strip")?.remove();

      const repos=extractRepositories(String(value.value||""));
      if (!repos.length) continue;

      const strip=doc.createElement("span");
      strip.className="repository-detector-link-strip";
      strip.style.display="inline-flex";
      strip.style.alignItems="center";
      strip.style.gap="6px";
      strip.style.marginInlineStart="6px";
      strip.style.whiteSpace="nowrap";

      repos.forEach((repo,index)=>{
        if (index) {
          const sep=doc.createElement("span");
          sep.textContent="·";
          sep.style.opacity="0.65";
          strip.appendChild(sep);
        }

        const link=doc.createElement("span");
        link.className="text-link";
        link.setAttribute("role","link");
        link.setAttribute("title",repo.url);
        link.textContent=repos.length > 1
          ? platformLabel(repo)+" "+(index+1)
          : platformLabel(repo);
        link.addEventListener("click",(event:any)=>{
          event.stopPropagation();
          Zotero.launchURL(repo.url);
        });
        strip.appendChild(link);
      });

      data.appendChild(strip);
    }
  }
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
  found:number, attached:number, errors:number
) {
  if (!progress) return;
  progress.pw.changeHeadline("检测开源项目 "+completed+"/"+progress.total);
  progress.line.setProgress(Math.round(completed/progress.total*100));
  progress.line.setText(
    String(title).slice(0,60)+" · Repo "+found+" · 下载 "+attached+" · 错误 "+errors
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
