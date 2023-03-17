import { Channels } from "@pages/newtab/fetchChannels";
/**
 * @description
 * Chrome extensions don't support modules in content scripts.
 */

// check if we are at https://www.twitch.tv/
async function getChannelData() {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  //scrape dom
  // Here is what we need to scrape:
  // The main list has a class of "tw-tower"
  // In each child we need to find the following values:
  // 1. The channel name this is located in a class that starts with "CoreText-"
  // 2. the Channel Image has a class of "tw-image-avatar"
  // 3. the channel url is located in a class that starts with "ScCoreLink-"
  // 4. the channel id should use the channel url
  const followerElements = document.getElementsByClassName("tw-tower")[0].children;
  const channels: Channels[] = [];
  for (let i = 0; i < followerElements.length; i++) {
    const channel = followerElements[i];
    const channelName = (channel.querySelectorAll("[class^=CoreText]")[0] as HTMLElement)?.innerText || "";
    const channelImage = channel.getElementsByClassName("tw-image-avatar")[0]?.getAttribute("src") || "";
    const channelUrl = channel.querySelectorAll("[class^=ScCoreLink]")[0]?.getAttribute("href") || "";

    const channelId = channelUrl;
    // if any of the value are empty break out of the loop
    if (channelName === "" || channelImage === "" || channelUrl === "") {
      break;
    }
    channels.push({
      name: channelName,
      profile: channelImage,
      url: channelUrl,
      platform: "twitch",
      id: channelId,
      isLive: false,
    });
  }
  window.top.postMessage(
    {
      type: "twitch-channels",
      data: {
        channels,
      },
    },
    "*"
  );
}
async function getLiveData() {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  const liveElements = document.getElementsByClassName("tw-tower")[0].children;
  const liveChannels: string[] = [];
  for (let i = 0; i < liveElements.length; i++) {
    const channel = liveElements[i];
    const channelUrl = channel.querySelectorAll("[class^=ScCoreLink]")[0]?.getAttribute("href") || "";
    const channelId = channelUrl;
    if (channelUrl !== "") {
      liveChannels.push(channelId);
    } else {
      break;
    }
  }
  window.top.postMessage(
    {
      type: "twitch-live-channels",
      data: {
        liveChannels,
      },
    },
    "*"
  );
}
// wait for page load

window.onload = () => {
  if (window.self === window.top) return;
  if (window.location.href === "https://www.twitch.tv/directory/following/channels") {
    getChannelData();
  }
  if (window.location.href === "https://www.twitch.tv/directory/following/live") {
    getLiveData();
  }
};
