import { useCallback, useState } from "react";

import { Repo, type AutomergeUrl } from "@automerge/automerge-repo";
import { useDocument } from "@automerge/automerge-repo-react-hooks";
import { IndexedDBStorageAdapter } from "@automerge/automerge-repo-storage-indexeddb";
import { ChannelDoc, PageDoc, ProfileDoc } from "./models";
import { ChannelView } from "./ChannelView";
import { LagDetector } from "./components/LagDetector";

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
    <div className="flex h-screen">
      <div className="w-1/2 panel">
        <div className="panel-component">
          <p className="whitespace-pre font-mono">
            {JSON.stringify(profileDoc, null, 2)}
          </p>
          <div className="flex gap-2 mt-4">
            <button onClick={createChannel}>Create Channel</button>
            <button onClick={reset}>Reset</button>
          </div>
          <LagDetector />
        </div>
      </div>

      <div className="w-1/2 panel overflow-y-hidden">
        {profileDoc.channels.length > 0 ? (
          <ChannelView channelUrl={profileDoc.channels[0]} />
        ) : (
          <div className="panel-component">
            <p>No channels yet. Create one to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
