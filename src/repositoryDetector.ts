import core from "./detectorCore";
import { repositoryValue } from "./repo";
import { renderRepositoryCell, renderRepositorySection } from "./ui";

const ID="repository-detector@example.com";
const LEGACY_ROW_IDS=[
  "repository-detector-repository",
  "repository-detector-code-repository",
];
const SECTION_ID="repository-detector-code-repositories";
const FTL_FILE="repositorydetector-repository-detector.ftl";

const RepositoryDetector:any = {
  ...core,
  rootURI:"",
  columnID:null,
  sectionID:null,
  notifierID:null,
  windows:new Set<any>(),

  ensureLocalization(win:any) {
    try { win?.MozXULElement?.insertFTLIfNeeded(FTL_FILE); } catch (_) {}
  },

  cleanupLegacyRows(win:any) {
    if (!win?.document) return;
    for (const rowID of LEGACY_ROW_IDS) {
      try {
        for (const row of Array.from(
          win.document.querySelectorAll(
            '.meta-row[data-custom-row-id="'+rowID+'"]'
          )
        ) as any[]) row.remove();
      } catch (_) {}
    }
  },

  async init({rootURI}:any) {
    this.rootURI=rootURI;

    // Localization must be present before Zotero renders plugin UI.
    for (const win of Zotero.getMainWindows()) this.ensureLocalization(win);

    try {
      Zotero.PreferencePanes.register({
        pluginID:ID,
        src:rootURI+"content/preferences.xhtml",
        label:"Repository Detector",
      });
    } catch (_) {}

    for (const rowID of LEGACY_ROW_IDS) {
      try { Zotero.ItemPaneManager.unregisterInfoRow(rowID); } catch (_) {}
    }
    try { Zotero.ItemPaneManager.unregisterSection(SECTION_ID); } catch (_) {}

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

    this.sectionID=Zotero.ItemPaneManager.registerSection({
      paneID:SECTION_ID,
      pluginID:ID,
      header:{
        l10nID:"repository-detector-section-header",
        icon:"chrome://zotero/skin/16/universal/book.svg",
      },
      sidenav:{
        l10nID:"repository-detector-section-sidenav",
        icon:"chrome://zotero/skin/20/universal/save.svg",
      },
      onItemChange:({item,setEnabled}:any)=>{
        setEnabled(!!item?.isRegularItem?.());
        return true;
      },
      onRender:({body,item,setSectionSummary}:any)=>{
        renderRepositorySection(body,item,setSectionSummary);
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
    if (this.sectionID) {
      try { Zotero.ItemPaneManager.unregisterSection(SECTION_ID); } catch (_) {}
      this.sectionID=null;
    }
    for (const rowID of LEGACY_ROW_IDS) {
      try { Zotero.ItemPaneManager.unregisterInfoRow(rowID); } catch (_) {}
    }
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
    this.ensureLocalization(win);
    this.cleanupLegacyRows(win);

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
  },

  removeFromWindow(win:any) {
    for (const id of [
      "repository-detector-scan",
      "repository-detector-download",
      "repository-detector-context",
    ]) {
      try { win?.document?.getElementById(id)?.remove(); } catch (_) {}
    }
    this.cleanupLegacyRows(win);
    this.windows.delete(win);
  },
};

export default RepositoryDetector;
