import { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

import { Repo } from "@automerge/automerge-repo";
import { RepoContext } from "@automerge/automerge-repo-react-hooks";
import { IndexedDBStorageAdapter } from "@automerge/automerge-repo-storage-indexeddb";
import { BrowserWebSocketClientAdapter } from "@automerge/automerge-repo-network-websocket";

const repo = new Repo({
  storage: new IndexedDBStorageAdapter("automerge"),
  network: [new BrowserWebSocketClientAdapter("wss://sync.automerge.org")],
  sharePolicy: async () => true,
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RepoContext.Provider value={repo}>
      <Suspense fallback={<div>Loading...</div>}>
        <App />
      </Suspense>
    </RepoContext.Provider>
  </StrictMode>
);
