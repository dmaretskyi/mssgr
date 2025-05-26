import type { AutomergeUrl } from "@automerge/automerge-repo";

export interface ProfileDoc {
  name: string;

  channels: AutomergeUrl[];
}

export const ProfileDoc = Object.freeze({
  make: ({ name }: { name: string }): ProfileDoc => ({
    name,
    channels: [],
  }),

  addChannel: (profile: ProfileDoc, channel: AutomergeUrl) => {
    profile.channels.push(channel);
  },
});

export interface ChannelDoc {
  name: string;

  rootPage: AutomergeUrl;
}

export const ChannelDoc = Object.freeze({
  make: ({
    name,
    rootPage,
  }: {
    name: string;
    rootPage: AutomergeUrl;
  }): ChannelDoc => ({
    name,
    rootPage,
  }),
});

export interface PageDoc {
  /**
   * Links to sub-pages or messages.
   * The keys are the url to a subpage or message.
   */
  nodes: Record<
    AutomergeUrl,
    {
      type: "page" | "message";

      /**
       * The unix timestamp in milliseconds for the earliest message in the subpage or, for messages, the timestamp of the message.
       */
      from: number;
      /**
       * The unix timestamp in milliseconds for the latest message in the subpage or, for messages, the timestamp of the message.
       */
      to: number;
    }
  >;
}

export const PageDoc = Object.freeze({
  make: (): PageDoc => ({
    nodes: {},
  }),
});

export interface MessageDoc {
  author: string;
  timestamp: number;
  message: string;
}

export const MessageDoc = Object.freeze({
  make: ({
    author,
    timestamp,
    message,
  }: {
    author: string;
    timestamp: number;
    message: string;
  }): MessageDoc => ({
    author,
    timestamp,
    message,
  }),
});
