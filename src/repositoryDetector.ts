import core from "./detectorCore";
import { repositoryValue, setRepositoryValue } from "./repo";
import { renderRepositoryCell, decorateRepositoryRows } from "./ui";

const ID="repository-detector@example.com";
const LEGACY_ROW_ID="repository-detector-repository";
const ROW_ID="repository-detector-code-repository";

const RepositoryDetector:any = {
  ...core,
  rootURI:"",
  columnID:null,
  rowID:null,
  notifierID:null,
  windows:new Set<any>(),

  async init({rootURI}:any) {
    this.rootURI=rootURI;
    try {
      Zotero.PreferencePanes.register({
        pluginID:ID,
        src:rootURI+"content/preferences.xhtml",
        label:"Repository Detector",
      });
    } catch (_) {}

    // Remove stale registrations from older versions before registering v0.2.4.
    for (const rowID of [LEGACY_ROW_ID, ROW_ID]) {
      try { Zotero.ItemPaneManager.unregisterInfoRow(rowID); } catch (_) {}
    }

    const locale=String((Zotero as any).locale || "").toLowerCase();
    const codeRepoLabel=locale.startsWith("zh") ? "代码仓库" : "Code Repo";

    this.columnID=await Zotero.ItemTreeManager.registerColumn({
      pluginID:ID,
      dataKey:"repository-detector-repository",
      label:codeRepoLabel,
      dataProvider:(item:any)=>repositoryValue(item),
      renderCell:(_index:any,data:string,column:any,_first:any,doc:any)=>
        renderRepositoryCell(data,column,doc),
    });

    this.rowID=Zotero.ItemPaneManager.registerInfoRow({
      rowID:ROW_ID,
      pluginID:ID,
      label:{l10nID:"repository-detector-info-row-label"},
      position:"afterCreators",
      editable:true,
      multiline:false,
      nowrap:true,
      onGetData:({item}:any)=>{
        setTimeout(decorateRepositoryRows,0);
        setTimeout(decorateRepositoryRows,100);
        return repositoryValue(item);
      },
      onSetData:async({item,value}:any)=>{
        await setRepositoryValue(item,String(value||""),this.tagName());
        setTimeout(decorateRepositoryRows,0);
        setTimeout(decorateRepositoryRows,100);
      },
      onItemChange:()=>{
        setTimeout(decorateRepositoryRows,0);
        setTimeout(decorateRepositoryRows,100);
      },
    });

    this.notifierID=Zotero.Notifier.registerObserver(this,["item"],"repository-detector");
    for (const win of Zotero.getMainWindows()) this.addToWindow(win);
  },

  async shutdown() {
    if (this.notifierID) {
      try { Zotero.Notifier.unregisterObserver(this.notifierID); } catch (_) {}
      this.notifierID=null;
    }
    if (this.columnID) {
      try { await Zotero.ItemTreeManager.unregisterColumn(this.columnID); } catch (_) {}
      this.columnID=null;
    }
    for (const rowID of [this.rowID, ROW_ID, LEGACY_ROW_ID]) {
      if (!rowID) continue;
      try { Zotero.ItemPaneManager.unregisterInfoRow(rowID); } catch (_) {}
    }
    this.rowID=null;
    for (const win of Zotero.getMainWindows()) this.removeFromWindow(win);
  },

  notify(event:string,type:string,ids:any[]) {
    if (type !== "item" || !["add","modify"].includes(event) || !this.prefBool("autoDetectOnAdd",true)) return;
    for (const id of ids || []) {
      let item:any=Zotero.Items.get(id);
      if (item?.isAttachment?.() && item.parentItemID) item=Zotero.Items.get(item.parentItemID);
      if (item?.isRegularItem?.()) {
        Zotero.Promise.delay(900)
          .then(()=>this.scanItem(item,false))
          .catch((e:any)=>Zotero.logError(e));
      }
    }
  },

  addToWindow(win:any) {
    if (!win?.document || this.windows.has(win)) return;
    this.windows.add(win);
    try { win.MozXULElement?.insertFTLIfNeeded("repositorydetector-repository-detector.ftl"); } catch (_) {}

    const add=(parent:any,id:string,label:string,callback:any)=>{
      if (!parent || win.document.getElementById(id)) return;
      const item=win.document.createXULElement("menuitem");
      item.id=id;
      item.setAttribute("label",label);
      item.addEventListener("command",callback);
      parent.appendChild(item);
    };

    const tools=win.document.getElementById("menu_ToolsPopup");
    add(tools,"repository-detector-scan","检测选中论文的开源代码仓库",()=>this.scanSelected(win));
    add(tools,"repository-detector-download","下载选中条目的 Code Repository 快照",()=>this.downloadSelected(win));

    const context=win.document.getElementById("zotero-itemmenu");
    add(context,"repository-detector-context","检测开源代码仓库",()=>this.scanSelected(win));
    setTimeout(decorateRepositoryRows,0);
    setTimeout(decorateRepositoryRows,100);
    setTimeout(decorateRepositoryRows,500);
  },

  removeFromWindow(win:any) {
    for (const id of [
      "repository-detector-scan",
      "repository-detector-download",
      "repository-detector-context",
    ]) {
      try { win?.document?.getElementById(id)?.remove(); } catch (_) {}
    }
    // Remove stale legacy rows that can survive a hot plugin update.
    try {
      for (const row of win?.document?.querySelectorAll?.(
        '.meta-row[data-custom-row-id="'+LEGACY_ROW_ID+'"]'
      ) || []) row.remove();
    } catch (_) {}
    this.windows.delete(win);
  },
};

export default RepositoryDetector;
