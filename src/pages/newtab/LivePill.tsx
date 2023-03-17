import React from "react";
import { createRoot } from "react-dom/client";
import "@pages/newtab/LivePill.scss";

export interface PillData {
  platform?: "twitch" | "youtube";
  isLive?: boolean;
}
const FollowingCard = (props: PillData) => {
  // create class name based on props if not live add offline
  const className = `pill ${props.platform} ${props.isLive ? "" : "offline"}`;
  return (
    <>
      <div className={className}>{props.isLive ? "Live" : "Offline"}</div>
    </>
  );
};

export default FollowingCard;
