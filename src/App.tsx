import { useCallback, useState } from "react";

import { Repo, type AutomergeUrl } from "@automerge/automerge-repo";
import { useDocument } from "@automerge/automerge-repo-react-hooks";
import { IndexedDBStorageAdapter } from "@automerge/automerge-repo-storage-indexeddb";
import { ChannelDoc, PageDoc, ProfileDoc } from "./models";

const repo = new Repo({
  storage: new IndexedDBStorageAdapter("automerge"),
  // network: [new BrowserWebSocketClientAdapter("wss://sync.automerge.org")],
});

function App() {
  const [profileDocUrl] = useState<AutomergeUrl>(() => {
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
  const [profileDoc, changeProfileDoc] = useDocument<ProfileDoc>(profileDocUrl);

  const createChannel = useCallback(() => {
    console.log("createChannel");

    const rootPage = repo.create<PageDoc>(PageDoc.make());

    const docHandle = repo.create<ChannelDoc>(
      ChannelDoc.make({ name: "New Channel", rootPage: rootPage.url })
    );

    console.log("docHandle", docHandle);

    changeProfileDoc((profileDoc) => {
      console.log("changeProfileDoc", profileDoc);
      ProfileDoc.addChannel(profileDoc, docHandle.url);
    });

    return docHandle.url;
  }, [profileDoc, changeProfileDoc]);

  const reset = useCallback(() => {
    localStorage.removeItem("profileUrl");
    window.location.reload();
  }, []);

  if (!profileDoc) {
    return <div>Loading...</div>;
  }

  console.log(profileDoc);

  return (
    <>
      <p className="whitespace-pre font-mono">
        {JSON.stringify(profileDoc, null, 2)}
      </p>
      <button onClick={createChannel}>Create Channel</button>
      <button onClick={reset}>Reset</button>
    </>
  );
}

export default App;
