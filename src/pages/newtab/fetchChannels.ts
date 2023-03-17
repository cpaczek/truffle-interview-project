export interface Channels {
  name: string;
  profile: string;
  url: string;
  id: string;
  // TODO: put platform into its own interface
  platform: "twitch" | "youtube";
  isLive: boolean;
  pinned?: boolean;
}
async function fetchYoutubeChannels(): Promise<Channels[]> {
  try {
    const response = await fetch("https://youtube.com/feed/channels", {
      credentials: "include",
    });
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const scripts = doc.querySelectorAll("script");
    const ytInitialData = Array.from(scripts).find((script) => script.innerHTML.includes("ytInitialData"));
    const ytInitialDataJson = JSON.parse(
      ytInitialData.innerHTML.split("var ytInitialData = ")[1].split("};")[0].concat("}")
    );
    const channels =
      ytInitialDataJson.contents.twoColumnBrowseResultsRenderer.tabs[0].tabRenderer.content.sectionListRenderer
        .contents[0].itemSectionRenderer.contents[0].shelfRenderer.content.expandedShelfContentsRenderer.items;
    const parsedChannels = channels.map((channel) => {
      return {
        name: channel.channelRenderer.title.simpleText,
        profile: "https://" + channel.channelRenderer.thumbnail.thumbnails[0].url.slice(2),
        url: channel.channelRenderer.navigationEndpoint.browseEndpoint.canonicalBaseUrl,
        platform: "youtube",
        id: channel.channelRenderer.channelId,
        // assume not live until we check
        isLive: false,
      };
    });
    return parsedChannels;
  } catch (error) {
    console.error(error);
  }
}
async function fetchYoutubeLiveChannels(): Promise<string[]> {
  try {
    const response = await fetch("https://www.youtube.com/feed/subscriptions", {
      credentials: "include",
    });
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const scripts = doc.querySelectorAll("script");
    const ytInitialData = Array.from(scripts).find((script) => script.innerHTML.includes("ytInitialData"));
    const ytInitialDataJson = JSON.parse(
      ytInitialData.innerHTML.split("var ytInitialData = ")[1].split("};")[0].concat("}")
    );
    const channels: any =
      ytInitialDataJson.contents.twoColumnBrowseResultsRenderer.tabs[0].tabRenderer.content.sectionListRenderer
        .contents;
    // return channel ids of live channels
    // Check if channel is live by looking at
    // itemSectionRenderer.contents[0].shelfRenderer.content.expandedShelfContentsRenderer.items[0].
    // videoRenderer.badges
    // if badges contains label === "LIVE" inside of metadataBadgeRenderer.icon then it is live
    const parsedLiveChannels = [];
    for (const channel of channels) {
      const data =
        channel.itemSectionRenderer?.contents[0]?.shelfRenderer?.content?.expandedShelfContentsRenderer?.items[0]
          ?.videoRenderer;
      const badges = data?.badges;
      if (badges) {
        const isLive = badges.some((badge) => {
          return badge.metadataBadgeRenderer.label === "LIVE";
        });
        if (isLive) {
          // push the canonical url from data.ownerText.runs[0].navigationEndpoint.browseEndpoint.canonicalBaseUrl
          parsedLiveChannels.push(data.ownerText.runs[0].navigationEndpoint.browseEndpoint.canonicalBaseUrl);
        } else {
          // livestreams will be the first data that shows on the list
          break;
        }
      }
    }
    return parsedLiveChannels;
  } catch (error) {
    console.error(error);
  }
}
async function parseLiveChannels(limit: number, channels: Channels[], liveChannels: string[]): Promise<Channels[]> {
  const pinnedChannels = await chrome.storage.local.get();
  const pinnedChannelIds = Object.keys(pinnedChannels);
  for (const channel of channels) {
    if (pinnedChannelIds.includes("truffle-pinned-" + channel.id) && pinnedChannels["truffle-pinned-" + channel.id]) {
      channel.pinned = true;
    }
  }

  const combinedChannels = [];
  for (const channel of channels) {
    if (channel.pinned) {
      combinedChannels.push(channel);
    }
    if (combinedChannels.length === limit) {
      return combinedChannels;
    }
  }
  for (const channel of channels) {
    if (liveChannels.includes(channel.url)) {
      channel.isLive = true;
      if (channel.pinned) continue;
      combinedChannels.push(channel);
    }
    if (combinedChannels.length === limit) {
      return combinedChannels;
    }
  }
  for (const channel of channels) {
    if (channel.pinned) continue;
    if (!liveChannels.includes(channel.url)) {
      combinedChannels.push(channel);
    }
    if (combinedChannels.length === limit) {
      return combinedChannels;
    }
  }
  return combinedChannels;
}
export default async function parseAllChannels(
  allTwitchChannels: Channels[],
  liveTwitchChannels: string[]
): Promise<Channels[]> {
  const allYoutubeChannels = await fetchYoutubeChannels();
  const allChannels = [...allTwitchChannels, ...allYoutubeChannels].sort((a, b) => a.name.localeCompare(b.name));
  const liveYoutubeChannels = await fetchYoutubeLiveChannels();
  const liveChannels = [...liveTwitchChannels, ...liveYoutubeChannels];
  const combinedChannels = await parseLiveChannels(12, allChannels, liveChannels);
  return combinedChannels;
}
