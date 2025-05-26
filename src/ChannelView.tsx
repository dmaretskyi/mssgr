import type { AutomergeUrl } from "@automerge/automerge-repo";
import { MessageDoc, PageDoc, type ChannelDoc } from "./models";
import {
  useDocument,
  useDocuments,
  useRepo,
} from "@automerge/automerge-repo-react-hooks";
import { useCallback, useMemo, useState } from "react";

export interface ChannelViewProps {
  channelUrl: AutomergeUrl;
}

export function ChannelView({ channelUrl }: ChannelViewProps) {
  const repo = useRepo();
  const [channelDoc, changeChannelDoc] = useDocument<ChannelDoc>(channelUrl);

  const [rootPageDoc, changeRootPageDoc] = useDocument<PageDoc>(
    channelDoc?.rootPage
  );

  const messageUrls = useMemo(
    () => Object.keys(rootPageDoc?.nodes ?? {}) as AutomergeUrl[],
    [rootPageDoc]
  );
  const [messageDocs] = useDocuments<MessageDoc>(messageUrls);

  const postMessage = useCallback(
    (text: string) => {
      const message = repo.create<MessageDoc>(
        MessageDoc.make({
          author: "Anonymous",
          timestamp: Date.now(),
          message: text,
        })
      );

      changeRootPageDoc((rootPageDoc) => {
        PageDoc.addMessage(rootPageDoc, message.url, message.doc().timestamp);
      });
    },
    [changeRootPageDoc, repo]
  );

  const [messageText, setMessageText] = useState("");

  const handleKeyDown = useCallback<
    React.KeyboardEventHandler<HTMLInputElement>
  >(
    (event) => {
      if (event.key === "Enter") {
        postMessage(messageText);
        setMessageText("");
      }
    },
    [messageText, postMessage]
  );

  const postMessages = useCallback(
    (count: number) => {
      for (let i = 0; i < count; i++) {
        postMessage(`Message ${i + 1}`);
      }
    },
    [messageText, postMessage]
  );

  return (
    <div className="flex flex-col h-screen">
      <div className="panel-component mb-4">
        <h1>{channelDoc?.name}</h1>
        <p>Message count: {messageDocs.size}</p>
      </div>
      <div className="flex-1 overflow-y-scroll panel-component mb-4">
        {Array.from(messageDocs.entries()).map(([messageUrl, messageDoc]) => (
          <div key={messageUrl} className="whitespace-pre font-mono mb-4">
            <p className="text-xs">{messageUrl}</p>
            {JSON.stringify(messageDoc, null, 2)}
          </div>
        ))}
      </div>
      <div className="panel-component sticky bottom-0">
        <div className="flex gap-2">
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1"
          />
          <button onClick={() => postMessage(messageText)}>Post</button>
        </div>
        <div>
          <button onClick={() => postMessages(10)}>Post 10</button>
          <button onClick={() => postMessages(100)}>Post 100</button>
          <button onClick={() => postMessages(1000)}>Post 1000</button>
        </div>
      </div>
    </div>
  );
}
