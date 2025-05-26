import type { AutomergeUrl, DocHandle } from "@automerge/automerge-repo";
import { ChannelDoc, MessageDoc, PageDoc } from "./models";
import {
  useDocument,
  useDocuments,
  useRepo,
} from "@automerge/automerge-repo-react-hooks";
import {
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { VList, type VListHandle } from "virtua";
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

  const [channelDoc, changeChannelDoc] = useDocument<ChannelDoc>(channelUrl, {
    suspense: true,
  });

  const model = useMemo(
    () => new TreeModel(repo, channelDoc?.rootPage),
    [repo, channelDoc.rootPage]
  );

  const messages = useTreeModelMessages(model);

  const loadPromise = useMemo(() => {
    return (async () => {
      await model?.loadMessages(Date.now(), 30);
    })();
  }, [model]);

  use(loadPromise);

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
    async (count: number) => {
      for (let i = 0; i < count; i++) {
        postMessage(`Message ${i + 1}`);
        await new Promise((resolve) => setTimeout(resolve, 1));
      }
    },
    [messageText, postMessage]
  );

  console.log("ChannelView", { messages, model });

  const ref = useRef<VListHandle>(null);

  const handleScroll = useCallback(async () => {
    if (!ref.current || !model) return;
    if (ref.current.findEndIndex() + 50 > model.messagesCount) {
      await model.loadMessages(
        model.messages[model.messages.length - 1]?.doc().timestamp ??
          Date.now(),
        30
      );
    }
  }, [ref, model]);

  return (
    <div className="flex flex-col h-screen">
      <div className="panel-component mb-4">
        <h1>{channelDoc?.name}</h1>
        <p>Messages loaded: {model?.messagesCount}</p>
        <div className="flex gap-2">
          <button onClick={() => navigator.clipboard.writeText(channelUrl)}>
            Copy channel URL
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-scroll panel-component mb-4">
        <VList ref={ref} onScroll={handleScroll}>
          {messages.map((handle) => (
            <div
              key={handle.documentId}
              className="whitespace-pre font-mono mb-4 border-b border-gray-200 pb-4"
            >
              <p className="text-xs">{handle.documentId}</p>
              <p>
                <span className="text-sm">{handle.doc().author}</span>
                <span className="text-xs">
                  {new Date(handle.doc().timestamp).toLocaleString()}
                </span>
              </p>
              <p>{handle.doc().message}</p>
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
          <button onClick={() => postMessages(300)}>Post 300</button>
          <button onClick={() => postMessages(1000)}>Post 1000</button>
        </div>
      </div>
    </div>
  );
}
