import { extractRepositories, platformLabel } from "./repo";

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
    const rows=win.document.querySelectorAll(
      '.meta-row[data-custom-row-id="repository-detector-repository"]'
    );
    for (const row of rows) {
      const value:any=row.querySelector(".meta-data > .value");
      if (!value || value.dataset.repoClick) continue;
      value.dataset.repoClick="1";
      value.style.cursor="pointer";
      value.addEventListener("dblclick",()=>{
        const repo=extractRepositories(String(value.value||""))[0];
        if (repo) Zotero.launchURL(repo.url);
      });
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
