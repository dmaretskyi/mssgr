import { useEffect, useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";

import {
  DocHandle,
  Repo,
  isValidAutomergeUrl,
  type AutomergeUrl,
} from "@automerge/automerge-repo";
import { IndexedDBStorageAdapter } from "@automerge/automerge-repo-storage-indexeddb";
import { ProfileDoc } from "./models";
import {
  useDocHandle,
  useDocument,
} from "@automerge/automerge-repo-react-hooks";

const repo = new Repo({
  storage: new IndexedDBStorageAdapter("automerge"),
  // network: [new BrowserWebSocketClientAdapter("wss://sync.automerge.org")],
});

function App() {
  const [profileDocUrl, setProfileDocUrl] = useState<AutomergeUrl>(() => {
    const profileUrl = localStorage.getItem("profileUrl");
    if (!profileUrl) {
      const docHandle = repo.create<ProfileDoc>(
        ProfileDoc.make({ name: "John Doe" })
      );
      localStorage.setItem("profileUrl", docHandle.url);
      return docHandle.url;
    }
    return profileUrl as AutomergeUrl;
  });
  const [profileDoc] = useDocument<ProfileDoc>(profileDocUrl);

  if (!profileDoc) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <h1>{profileDoc.name}</h1>
    </>
  );
}

export default App;
