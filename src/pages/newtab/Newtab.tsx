import React, { useEffect, useState } from "react";
import logo from "@assets/img/logo.svg";
import "@pages/newtab/FollowingCard";
import "@pages/newtab/Newtab.css";
import "@pages/newtab/Newtab.scss";
import { Channels } from "@pages/newtab/fetchChannels";
import FollowingCard from "@pages/newtab/FollowingCard";
import parseAllChannels from "@pages/newtab/fetchChannels";

const Newtab = () => {
  // do a get request to youtube.com/feed/channels

  // set react state with the channels
  const [channels, setChannels] = useState<Channels[]>([]);
  const [topSites, setTopSites] = useState<any[]>([]);
  // wait till document loads
  // get iframe
  function redirect(url: string) {
    const win: Window = window;
    win.location = url;
  }
  function parseChannelUrl(platform: string, url: string) {
    if (platform === "youtube") {
      return "https://youtube.com" + url;
    } else if (platform === "twitch") {
      return "https://twitch.tv" + url;
    }
  }

  function getAppIcon(url: string): string {
    return "https://www.google.com/s2/favicons?domain=" + url;
  }
  useEffect(() => {
    chrome.topSites.get((sites) => {
      console.log("sites", sites);
      setTopSites(sites);
    });

    (async () => {
      // listen to postMessage
      let channels: Channels[] = [];
      let liveChannels: string[] = [];
      const youtubeParsedChannels = await parseAllChannels([], []);
      setChannels(youtubeParsedChannels);
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          resolve();
        }, 5000);
        window.addEventListener("message", (event) => {
          if (event.origin !== "https://www.twitch.tv") return;
          if (event.data.type === "twitch-channels") {
            channels = event.data.data.channels;
            if (liveChannels.length > 0) resolve();
          } else if (event.data.type === "twitch-live-channels") {
            liveChannels = event.data.data.liveChannels;
            if (channels.length > 0) resolve();
          }

          // cancel event listenter
        });
      });
      const parsedChannels = await parseAllChannels(channels, liveChannels);
      setChannels(parsedChannels);
      // delete all iframes
      const iframes = [...document.getElementsByTagName("iframe")];
      iframes.forEach((iframe) => iframe.remove());
    })();
    // get the body element from the iframe
  }, []);

  return (
    <div className="app">
      <iframe src="https://www.twitch.tv/directory/following/live" frameBorder="0"></iframe>
      <iframe src="https://www.twitch.tv/directory/following/channels" frameBorder="0"></iframe>
      <div className="container">
        <header>
          <img src={logo} className="App-logo" alt="logo" />
        </header>
        <div className="following-container">
          <div className="title">
            <h3>Following</h3>
          </div>
          <div className="following-cards">
            {
              /* loop 12 times */
              channels.map((channel, i) => (
                <div key={i} className="following-card">
                  <FollowingCard
                    name={channel.name}
                    profile={channel.profile}
                    liveData={{
                      platform: channel.platform,
                      isLive: channel.isLive,
                    }}
                    pinned={channel.pinned}
                    id={channel.id}
                    url={parseChannelUrl(channel.platform, channel.url)}
                  ></FollowingCard>
                </div>
              ))
            }
          </div>
        </div>
        <hr />
        <div className="top-sites-title">
          <h3>Top Sites</h3>
        </div>
        <div className="top-sites-container">
          {topSites.map((site, i) => (
            <div onClick={() => redirect(site.url)} key={i} className="top-site-card">
              <img src={getAppIcon(site.url)} alt="" />
              <p>{site.title}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Newtab;
