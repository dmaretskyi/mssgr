import type {
  AutomergeUrl,
  DocHandle,
  DocumentId,
  Repo,
} from "@automerge/automerge-repo";
import { GrowRange, MessageDoc, PageDoc } from ".";
import { Event, type ReadOnlyEvent } from "@dxos/async";

export class TreeModel {
  #repo: Repo;
  #rootUrl: AutomergeUrl;

  #docPromiseCache = new Map<AutomergeUrl, Promise<DocHandle<unknown>>>();

  #messages = new Map<DocumentId, DocHandle<MessageDoc>>();
  #messagesArray: readonly DocHandle<MessageDoc>[] = [];

  #updatedEvent = new Event();

  constructor(repo: Repo, rootUrl: AutomergeUrl) {
    this.#repo = repo;
    this.#rootUrl = rootUrl;
  }

  /**
   * All loaded messages.
   * Ordered in reverse chronological order.
   */
  get messages(): readonly DocHandle<MessageDoc>[] {
    return this.#messagesArray;
  }

  get messagesCount(): number {
    return this.#messages.size;
  }

  get updatedEvent(): ReadOnlyEvent {
    return this.#updatedEvent;
  }

  /**
   * @param startTs The timestamp of the first message to load.
   * @param count The number of messages to load. The oldest message will be at the timestamp.
   */
  async loadMessages(timestamp: number, count: number): Promise<void> {
    console.log("loadMessages", { timestamp, count });
    const root = await this.#loadRootPage();
    const messages = Object.entries(root.doc().nodes ?? {})
      .filter(
        ([_, node]) =>
          node.type === "message" && GrowRange.getMax(node.range) <= timestamp
      )
      .sort(
        (a, b) => GrowRange.getMax(b[1].range) - GrowRange.getMax(a[1].range)
      )
      .slice(0, count);

    await Promise.all(
      messages.map(async ([url, node]) => {
        const doc = await this.#load<MessageDoc>(url as AutomergeUrl);
        this.#messages.set(doc.documentId, doc);
      })
    );

    this.#messagesArray = [...this.#messages.values()].sort(
      (a, b) => b.doc().timestamp - a.doc().timestamp
    );
    this.#updatedEvent.emit();
  }

  async postMessage(text: string): Promise<void> {
    console.log("postMessage", { text });
    const message = this.#repo.create<MessageDoc>(
      MessageDoc.make({
        author: "Anonymous",
        timestamp: Date.now(),
        message: text,
      })
    );

    this.#messages.set(message.documentId, message);
    this.#messagesArray = [message, ...this.#messagesArray];
    this.#updatedEvent.emit();

    const root = await this.#loadRootPage();
    root.change((root) => {
      PageDoc.addMessage(root, message.url, message.doc().timestamp);
    });
  }

  #load<T>(url: AutomergeUrl): Promise<DocHandle<T>> {
    if (this.#docPromiseCache.has(url)) {
      return this.#docPromiseCache.get(url) as Promise<DocHandle<T>>;
    }

    const promise = this.#repo.find(url);
    this.#docPromiseCache.set(url, promise);
    return promise as any;
  }

  #loadRootPage(): Promise<DocHandle<PageDoc>> {
    return this.#load<PageDoc>(this.#rootUrl);
  }
}
