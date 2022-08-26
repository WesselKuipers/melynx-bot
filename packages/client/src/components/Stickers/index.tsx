import { Card, Typography, Popover, Alert, Input } from 'antd';
import styles from './index.module.css';
import copy from 'copy-to-clipboard';
import { useState, useCallback, ChangeEvent, useEffect } from 'react';
import axios, { apiUrl } from '../../utils/axios';

const { Title } = Typography;
const { Search } = Input;

export function Stickers() {
  const [stickers, setStickers] = useState<string[]>([]);
  const [activePopover, setActivePopover] = useState('');
  const [filter, setFilter] = useState('');
  let currentTimer: number;

  const onSearchChange = useCallback((event: ChangeEvent<HTMLInputElement>): void => {
    setFilter(event.target.value);
  }, []);

  useEffect(() => {
    const getStickers = async () => {
      const { data } = await axios.get('/api/stickers');
      setStickers(data);
    };

    getStickers();
  }, []);

  const copySticker = (sticker: string) => {
    clearTimeout(currentTimer);
    copy(`/sticker ${sticker.split('.')[0]}`);
    setActivePopover(sticker);
    currentTimer = window.setTimeout(() => setActivePopover(''), 2e3);
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
                <img src={`${apiUrl}/assets/stickers/${sticker}`} />
                <p>{sticker.split('.')[0]}</p>
              </Card>
            </Popover>
          ))}
      </div>
    </div>
  );
}
