import RepositoryDetector from "./repositoryDetector";

const addon = {
  data: {
    initialized: false,
  },
  hooks: {
    async onStartup() {
      await Promise.all([
        Zotero.initializationPromise,
        Zotero.unlockPromise,
        Zotero.uiReadyPromise,
      ]);
      await RepositoryDetector.init({ rootURI: (_globalThis as any).rootURI });
      addon.data.initialized = true;
    },
    async onMainWindowLoad(window: any) { RepositoryDetector.addToWindow(window); },
    async onMainWindowUnload(window: any) { RepositoryDetector.removeFromWindow(window); },
    async onShutdown() { await RepositoryDetector.shutdown(); delete (Zptero as any).RepositoryDetectorAddon; },
  },
};
(Zotero as any).RepositoryDetectorAddon = addon;
