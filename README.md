# Truffle Interview Project


https://user-images.githubusercontent.com/25715982/225932539-a904ddf0-0f84-49fb-b8c3-fd6cc2f3de58.mp4

# TOC
<!-- TOC -->

- [Truffle Interview Project](#truffle-interview-project)
    - [How To Run](#how-to-run)
    - [Approach](#approach)
        - [Getting Youtube Data](#getting-youtube-data)
        - [Getting Twitch Data](#getting-twitch-data)
        - [Displaying Data](#displaying-data)
        - [Displaying both youtube and twitch](#displaying-both-youtube-and-twitch)
        - [Pinning Channels](#pinning-channels)
        - [Top Sites](#top-sites)
    - [TODOs:](#todos)
    - [Analysis](#analysis)
    - [Time Spent](#time-spent)

<!-- /TOC -->

## How To Run

Project is forked from [React Vite Boilerplate](https://github.com/Jonghakseo/chrome-extension-boilerplate-react-vite)

## Approach

### Getting Youtube Data

I decided to scrape the "dom" in order to the data for youtube. During my research I found that google will server-side render the initial data into a json object called `ytInitialData` which I could then parse.

I had to first get all the channels from `https://www.youtube.com/feed/channels` however this page doesn't tell you if a creator is live or not. so I have to also scrape this page `https://www.youtube.com/feed/subscriptions` which will have all the livestreams as the first video.

### Getting Twitch Data

This was way more difficult than youtube as twitch uses a graphql api meaning that just sending a request to the page won't pass the proper authentication headers like youtube does.

To solve this issue I had to disable the X-Frame-Options header on twitch to load a twitch page in an iframe. I then used a content script to send the data the iframe to the parent using `window.top.postMessage` and then in the new tab I would listen for the message and parse the data.

With Twitch I had to scrape the dom using querySelector to get the data. I debated trying to hijack the fetch but ran into some difficulties as content-scripts are isolated and don't have access to the same window.fetch object meaning trying to override that would be difficult.

I then used the same approach as youtube where I scraped `https://www.twitch.tv/directory/following/live` to get the live channels and `https://www.twitch.tv/directory/following/channels` to get the currently followed channels

### Displaying Data

After I got all the information I had to figure out which channels were live.

I stored the raw channel data in this type

```typescript
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
```

By default the `isLive` boolean was false. I then compared the raw data with the data from the live channels and set the `isLive` to true if the channel was in both lists.

I then sort the channels first by if they are pinned, then if they are live, then by the name of the channel.

### Displaying both youtube and twitch

Because Youtube loads so much faster than twitch I decided to load youtube first and display it while the twitch data was loading. The downside of this is that it will cause layout shift when twitch loads. The other option is to either use a loading spinner and wait for both to be done or have 2 seperate sections for twitch and youtube.

### Pinning Channels

When a user pins a channel it will store that channel id (url in twitch's case) in chrome's storage. When the user loads the extension it will check if the channel is pinned and set the `pinned` property to true.

Currenly if you unsubscribe from a channel it will still stay "pinned" but it will be hidden. This just means if you resubscribe it will still be pinned. This could be changed to unpin the channel if you unsubscribe but I would need to implement a bit more error handling with fetching data.

### Top Sites

Top sites was pretty simple. All I did was use the `chrome.topSites` and displayed them. I used google's service to get the favicon image.

```ts
function getAppIcon(url: string): string {
  return "https://www.google.com/s2/favicons?domain=" + url;
}
```

## TODOs:

Most of these are just chores that I would do if this code was going into production. Let me know if you would like me to implement any of these for the interview process.

- [ ] Add tests
- [ ] Add more error handling (Currently untested if the user is logged out of youtube, in theory it should just work)
- [ ] Type everything. This was my first time really using typescript so I typed the important things but there are a lot of `any` types.
- [ ] Add a loading spinner for when youtube takes a sec to load (or maybe do skeleton loaders)
- [ ] Perhaps add caching of twitch channels to reduce layout shift
- [ ] Resort list when user pins/unpins a channel currenly if you pin a channel it will stay its it's spot until you refresh the page. (Maybe not do this to reduce layout shift)
- [ ] remove unpinned/unsubscribed channels from the chrome storage
- [ ] Increase security with modifyingHeaders and posting messages. Currently its set to basically just `*` but I would make it more specific.
- [ ] Remove other boilerplate code

## Analysis

This project was very eye opening when it comes to the power of extensions. I've had some experience with building the truffle auto bonus extension and building an [Auto Scheduling Extension](https://chrome.google.com/webstore/detail/sfsu-scheduler/kcdjjkdoipjipflpjkggcpmffkoickbc?hl=en) for my school but the way you can scrape data and modify headers

This is essentially my first time using React and Typescript so if there are any bad practices that I am doing please let me know!

## Time Spent

I probably spend a good 10 hours of work on this.

Rough breakdown:

- 1 hour planning an resarch
- 1.5 hours of figuring out react and typescript as I don't use them very often (I'm more of a vue guy)
- 4 hours of trying to figure out how to get twitch data
- Rest of the time spend styling and on other tasks.

After I get better at React, Typescript, and IFrames/extensions I could have probably done this in about 4-5 hours maybe less.
