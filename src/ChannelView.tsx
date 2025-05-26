import type { AutomergeUrl, DocHandle } from "@automerge/automerge-repo";
import { MessageDoc, PageDoc, type ChannelDoc } from "./models";
import {
  useDocument,
  useDocuments,
  useRepo,
} from "@automerge/automerge-repo-react-hooks";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { VList } from "virtua";
import { TreeModel } from "./models/TreeModel";

export interface ChannelViewProps {
  channelUrl: AutomergeUrl;
}

const useTreeModelMessages = (
  model: TreeModel | undefined
): readonly DocHandle<MessageDoc>[] => {
  const { subscribe, getSnapshot } = useMemo(
    () => ({
      subscribe: (callback: () => void) => {
        model?.updatedEvent.on(callback);
        return () => model?.updatedEvent.off(callback);
      },
      getSnapshot: () => model?.messages ?? STABLE_ARRAY,
    }),
    [model]
  );

  return useSyncExternalStore(subscribe, getSnapshot);
};

const STABLE_ARRAY: never[] = [];

export function ChannelView({ channelUrl }: ChannelViewProps) {
  const repo = useRepo();

  const [channelDoc, changeChannelDoc] = useDocument<ChannelDoc>(channelUrl);

  const model = useMemo(
    () => channelDoc?.rootPage && new TreeModel(repo, channelDoc?.rootPage),
    [repo, channelDoc?.rootPage]
  );

  const messages = useTreeModelMessages(model);

  useEffect(() => {
    model?.loadMessages(Date.now(), 100);
  }, [model]);

  const postMessage = useCallback(
    (text: string) => {
      model?.postMessage(text);
    },
    [model]
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

  console.log("ChannelView", { messages });

  return (
    <div className="flex flex-col h-screen">
      <div className="panel-component mb-4">
        <h1>{channelDoc?.name}</h1>
        <p>Message count: {model?.messagesCount}</p>
      </div>
      <div className="flex-1 overflow-y-scroll panel-component mb-4">
        <VList>
          {messages.map((handle) => (
            <div
              key={handle.documentId}
              className="whitespace-pre font-mono mb-4"
            >
              <p className="text-xs">{handle.documentId}</p>
              {JSON.stringify(handle.doc(), null, 2)}
            </div>
          ))}
        </VList>
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
