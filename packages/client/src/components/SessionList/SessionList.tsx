import React from 'react';
import axios from 'axios';
import { Spin, Card, Tag, Popover, Empty, Alert, Avatar } from 'antd';
import copy from 'copy-to-clipboard';
import styles from './SessionList.css';
import useUser from '../../hooks/useUser';
import kutku from '../../assets/kutku.png';
import garuga from '../../assets/garuga.png';
import { LoadingOutlined, FrownFilled, CopyFilled } from '@ant-design/icons';

interface Session {
  id: number;
  sessionId: string;
  platform: string;
  date: string;
  guildId: string;
  userId: string;
  avatar: string;
  creator: string;
  description: string;
}

export default function SessionList() {
  const [loading, setLoading] = React.useState(true);
  const [sessions, setSessions] = React.useState<Session[]>(undefined);
  const [copiedMessage, setCopiedMessage] = React.useState(0);

  const { user } = useUser();

  React.useEffect(() => {
    const getSessions = async () => {
      const { data } = await axios.get<Session[]>('/api/sessions');
      setSessions(data);
      setLoading(false);
    };

    if (!user) {
      setSessions([]);
      setLoading(false);
      return;
    }

    getSessions();
  }, [user]);

  const copySession = (s: Session) => {
    copy(s.sessionId);
    setCopiedMessage(s.id);
    setTimeout(() => setCopiedMessage(0), 2e3);
  };

  if (!user) {
    return (
      <div className={styles.center}>
        <Empty
          image={<img src={Math.round(Math.random()) ? kutku : garuga} className={styles.shake} />}
          description="Please log in to view sessions"
        />
      </div>
    );
  }

  if (loading) {
    return <Spin indicator={<LoadingOutlined spin />} className={styles.spinner} size="large" />;
  }

  if (sessions.length === 0) {
    return (
      <div className={styles.center}>
        <Empty
          image={<FrownFilled style={{ fontSize: 100 }} />}
          description="Looks like there aren't any sessions yet!"
        />
      </div>
    );
  }

  return (
    <div className={styles.sessionList}>
      {sessions.map((session) => (
        <Card
          key={session.id}
          className={styles.session}
          actions={[
            <Popover
              trigger="click"
              content={<Alert message="Copied! Happy hunting!" type="success" showIcon />}
              visible={copiedMessage === session.id}
              placement="right"
              onVisibleChange={() => copySession(session)}
            >
              <span>
                <CopyFilled /> Copy to clipboard
              </span>
            </Popover>,
          ]}
        >
          <Card.Meta
            avatar={<Avatar className={styles.cardAvatar} src={session.avatar} />}
            title={
              <>
                <span>{session.sessionId}</span>
                <Tag className={styles.tag}>{session.platform}</Tag>
              </>
            }
            description={
              <span className={styles.date}>{new Date(session.date).toLocaleString()}</span>
            }
          />
          {session.description && <span>{session.description}</span>}
        </Card>
      ))}
    </div>
  );
}
