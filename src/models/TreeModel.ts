import type {
  AutomergeUrl,
  DocHandle,
  DocumentId,
  Repo,
} from "@automerge/automerge-repo";
import { next as Automerge } from "@automerge/automerge";
import { GrowRange, MessageDoc, PageDoc, type PageEntry } from ".";
import { Event, Mutex, type ReadOnlyEvent } from "@dxos/async";

const PAGE_MESSAGE_THRESHOLD = 50;

export class TreeModel {
  #insertMutex = new Mutex();

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
   * @param startTs The timestamp of the oldest message to load.
   * @param count The number of messages to load. The oldest message will be at the timestamp.
   */
  async loadMessages(timestamp: number, count: number): Promise<void> {
    console.log("loadMessages", { timestamp, count });

    const entries: PageEntry[] = [];

    const loadPage = async (url: AutomergeUrl) => {
      console.log("loadPage", url);
      const page = await this.#load<PageDoc>(url);
      console.log(
        "page",
        page.url,
        PageDoc.getEntryCount(page.doc()),
        "entries"
      );
      await Promise.all(
        PageDoc.getEntries(page.doc()).map(async ([url, node]) => {
          if (GrowRange.getMax(node.range) >= timestamp) {
            return;
          }

          // TODO(dmaretskyi): Trim on message count.
          if (node.type === "message") {
            entries.push([url as AutomergeUrl, node]);
          } else if (node.type === "page") {
            await loadPage(url);
          }
        })
      );
    };

    await loadPage(this.#rootUrl);

    const messages = entries
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

    await this.#insertMessage(message);
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

  async #insertMessage(message: DocHandle<MessageDoc>): Promise<void> {
    using _guard = await this.#insertMutex.acquire();

    const root = await this.#loadRootPage();

    // Handle root page being empty.
    if (PageDoc.getEntryCount(root.doc()) === 0) {
      console.log("insert first child into root");
      const newPage = this.#repo.create<PageDoc>(PageDoc.make());
      root.change((root) => {
        PageDoc.addPage(root, newPage.url, 0, 0);
      });
    }

    const lastPageEntry = PageDoc.getEntries(root.doc())
      .filter(([_, node]) => node.type === "page")
      .sort(
        (a, b) => GrowRange.getMax(b[1].range) - GrowRange.getMax(a[1].range)
      )[0];
    if (!lastPageEntry) {
      throw new Error("No last page");
    }

    // Handle last page being full.
    const lastPage = await this.#load<PageDoc>(lastPageEntry[0]);
    if (PageDoc.getEntryCount(lastPage.doc()) >= PAGE_MESSAGE_THRESHOLD) {
      console.log("last page is full, creating new page");
      const newPage = this.#repo.create<PageDoc>(PageDoc.make());
      root.change((root) => {
        PageDoc.addPage(root, newPage.url, 0, 0);
      });

      await this.#insertIntoPage([root, newPage], message);
    } else {
      console.log("insert into existing page");
      await this.#insertIntoPage([root, lastPage], message);
    }
  }

  /**
   * @param pagePath Path to the final page to insert into. The root page is the first element.
   * @param message
   */
  async #insertIntoPage(
    pagePath: DocHandle<PageDoc>[],
    message: DocHandle<MessageDoc>
  ): Promise<void> {
    pagePath[pagePath.length - 1].change((page) => {
      PageDoc.addMessage(page, message.url, message.doc().timestamp);
    });
    let range = PageDoc.getTimestampRange(pagePath[pagePath.length - 1].doc());

    for (let i = pagePath.length - 2; i >= 0; i--) {
      const page = pagePath[i];
      page.change((page) => {
        PageDoc.updateRangeFor(
          page,
          pagePath[i + 1].url,
          Automerge.getActorId(page),
          range.from,
          range.to
        );
      });
      range = PageDoc.getTimestampRange(page.doc());
    }
  }
}
