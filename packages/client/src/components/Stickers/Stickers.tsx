import React from "react";
import Axios from "axios";
import { Card, Popover, Callout } from "@blueprintjs/core";
import styles from "./Stickers.css";
import copy from "copy-to-clipboard";

export default function Stickers() {
  const [stickers, setStickers] = React.useState<string[]>([]);
  const [activePopover, setActivePopover] = React.useState("");
  let currentTimer = 0;

  React.useEffect(() => {
    const getStickers = async () => {
      const { data } = await Axios.get("/api/stickers");
      setStickers(data);
    };

    getStickers();
  }, []);

  const copySticker = (sticker: string) => {
    clearTimeout(currentTimer);
    copy(`<@489555694211694602> sticker ${sticker.split(".")[0]}`);
    setActivePopover(sticker);
    currentTimer = setTimeout(() => setActivePopover(''), 2e3);
  };

  return (
    <div className={styles.container}>
      <h2>List of stickers</h2>
      <h3>Click on one of the cards to copy the command!</h3>
      <div className={styles.stickers}>
        {stickers.map(sticker => (
          <Popover
            key={sticker}
            content={
              <Callout icon="tick" intent="success">
                Copied!
              </Callout>
            }
            isOpen={sticker === activePopover}
          >
            <Card onClick={() => copySticker(sticker)} interactive>
              <img src={`/assets/stickers/${sticker}`} />
              <p>{sticker.split(".")[0]}</p>
            </Card>
          </Popover>
        ))}
      </div>
    </div>
  );
}
