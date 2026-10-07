import core from "./detectorCore";
import { repositoryValue, setRepositoryValue } from "./repo";
import { renderRepositoryCell, decorateRepositoryRows } from "./ui";

const ID="repository-detector@example.com";

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

    this.columnID=await Zotero.ItemTreeManager.registerColumn({
      pluginID:ID,
      dataKey:"repository-detector-repository",
      label:"Repository",
      dataProvider:(item:any)=>repositoryValue(item),
      renderCell:(_index:any,data:string,column:any,_first:any,doc:any)=>
        renderRepositoryCell(data,column,doc),
    });

    this.rowID=Zotero.ItemPaneManager.registerInfoRow({
      rowID:"repository-detector-repository",
      pluginID:ID,
      label:{l10nID:"repository-detector-info-row-label"},
      position:"afterCreators",
      editable:true,
      multiline:true,
      onGetData:({item}:any)=>{
        setTimeout(decorateRepositoryRows,0);
        return repositoryValue(item);
      },
      onSetData:async({item,value}:any)=>{
        await setRepositoryValue(item,String(value||""),this.tagName());
        setTimeout(decorateRepositoryRows,0);
      },
      onItemChange:()=>setTimeout(decorateRepositoryRows,0),
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
    if (this.rowID) {
      try { Zotero.ItemPaneManager.unregisterInfoRow(this.rowID); } catch (_) {}
      this.rowID=null;
    }
    for (const win of Zotero.getMainWindows()) this.removeFromWindow(win);
  },

  notify(event:string,type:string,ids:any[]) {
    if (type !== "item" || !["add","modify"].includes(event) || !this.prefBool("autoDetectOnAdd",true)) return;
    for (const id of ids || []) {
      let item=Zotero.Items.get(id);
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
    try { win.MozXULElement?.insertFTLIfNeeded("repository-detector.ftl"); } catch (_) {}

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
    add(tools,"repository-detector-download","下载选中条目的 Repository 快照",()=>this.downloadSelected(win));

    const context=win.document.getElementById("zotero-itemmenu");
    add(context,"repository-detector-context","检测开源代码仓库",()=>this.scanSelected(win));
    setTimeout(decorateRepositoryRows,0);
  },

  removeFromWindow(win:any) {
    for (const id of [
      "repository-detector-scan",
      "repository-detector-download",
      "repository-detector-context",
    ]) {
      try { win?.document?.getElementById(id)?.remove(); } catch (_) {}
    }
    this.windows.delete(win);
  },
};

export default RepositoryDetector;
