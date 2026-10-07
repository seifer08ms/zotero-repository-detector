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

    // v0.2.3 and older could leave a blank legacy row after an in-place update.
    for (const oldRow of Array.from(
      doc.querySelectorAll('.meta-row[data-custom-row-id="'+LEGACY_ROW_ID+'"]')
    ) as any[]) {
      try { oldRow.remove(); } catch (_) {}
    }

    const rows=doc.querySelectorAll(
      '.meta-row[data-custom-row-id="'+ROW_ID+'"]'
    );

    for (const row of Array.from(rows) as any[]) {
      // Do not rely solely on Fluent: explicitly provide the visible label as a fallback.
      const label:any=row.querySelector(".meta-label label, .meta-label .key, .meta-label");
      if (label) label.textContent=currentLabel();

      const data:any=row.querySelector(".meta-data");
      const value:any=row.querySelector(".meta-data > .value");
      if (!value) continue;

      value.style.cursor="text";

      if (!value.dataset.repoClick) {
        value.dataset.repoClick="1";
        value.addEventListener("dblclick",()=>{
          const repo=extractRepositories(String(value.value||""))[0];
          if (repo) Zotero.launchURL(repo.url);
        });
      }

      const repos=extractRepositories(String(value.value||""));
      let button:any=data?.querySelector?.(".repository-detector-open-link");
      if (!button && data) {
        button=doc.createXULElement("toolbarbutton");
        button.className="zotero-clicky zotero-clicky-open-link show-on-hover repository-detector-open-link";
        button.setAttribute("data-l10n-id","item-button-view-online");
        button.addEventListener("click",(event:any)=>{
          event.stopPropagation();
          const repo=extractRepositories(String(value.value||""))[0];
          if (repo) Zotero.launchURL(repo.url);
        });
        data.appendChild(button);
      }
      if (button) button.hidden=repos.length===0;
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
