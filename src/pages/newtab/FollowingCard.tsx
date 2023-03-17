import React, { useEffect } from "react";
import { createRoot } from "react-dom/client";
import "@pages/newtab/FollowingCard.scss";
import LivePill from "@pages/newtab/LivePill";
import pin from "@assets/img/icons/pin.svg";
import { PillData } from "@pages/newtab/LivePill";

interface CardData {
  name: string;
  profile?: string;
  liveData?: PillData;
  pinned?: boolean;
  id: string;
  url: string;
}

const FollowingCard = (props: CardData) => {
  const [pinned, setPinned] = React.useState<boolean>(false);
  function pinItem() {
    setPinned(true);

    // set pinned to id in chrome.storage
    chrome.storage.local.set({ ["truffle-pinned-" + props.id]: true }).catch(console.error);
    // TODO: resort the list of cards
  }
  function unPinItem() {
    setPinned(false);
    // TODO: Delete from chrome storage instead of setting to false
    chrome.storage.local.set({ ["truffle-pinned-" + props.id]: false });
    // TODO: resort the list of cards
  }
  useEffect(() => {
    setPinned(props.pinned);
  }, [props.pinned]);

  return (
    <>
      <div className="card-body">
        <div onClick={pinned ? unPinItem : pinItem} className={pinned ? "pin pinned" : "pin"}>
          <img src={pin} alt="" />
        </div>
        <a href={props.url}>
          <img src={props.profile} alt="Profile Picture" />
          <p>{props.name}</p>
          <LivePill platform={props.liveData.platform} isLive={props.liveData.isLive}></LivePill>
        </a>
      </div>
    </>
  );
};

export default FollowingCard;
