import React from 'react';
import Axios from 'axios';
import { Card, Typography, Popover, Alert, Input } from 'antd';
import styles from './Stickers.css';
import copy from 'copy-to-clipboard';

const { Title } = Typography;
const { Search } = Input;

export default function Stickers() {
  const [stickers, setStickers] = React.useState<string[]>([]);
  const [activePopover, setActivePopover] = React.useState('');
  const [filter, setFilter] = React.useState('');
  let currentTimer: number;

  const onSearchChange = React.useCallback((event: React.ChangeEvent<HTMLInputElement>): void => {
    setFilter(event.target.value);
  }, []);

  React.useEffect(() => {
    const getStickers = async () => {
      const { data } = await Axios.get('/api/stickers');
      setStickers(data);
    };

    getStickers();
  }, []);

  const copySticker = (sticker: string) => {
    clearTimeout(currentTimer);
    copy(`<@489555694211694602> sticker ${sticker.split('.')[0]}`);
    setActivePopover(sticker);
    currentTimer = setTimeout(() => setActivePopover(''), 2e3);
  };

  return (
    <div className={styles.container}>
      <Title level={3}>List of stickers</Title>
      <Title level={4}>Click on one of the cards to copy the command!</Title>
      <Search
        style={{ width: 300 }}
        onChange={onSearchChange}
        placeholder="Search stickers"
        allowClear
      ></Search>
      <div className={styles.stickers}>
        {stickers
          .filter((sticker) => !filter || sticker.includes(filter))
          .map((sticker) => (
            <Popover
              key={sticker}
              trigger="click"
              placement="top"
              content={<Alert message="Copied!" type="success" showIcon />}
              visible={sticker === activePopover}
              onVisibleChange={() => copySticker(sticker)}
            >
              <Card bodyStyle={{ paddingBottom: 10 }} className={styles.sticker} hoverable>
                <img src={`/assets/stickers/${sticker}`} />
                <p>{sticker.split('.')[0]}</p>
              </Card>
            </Popover>
          ))}
      </div>
    </div>
  );
}
