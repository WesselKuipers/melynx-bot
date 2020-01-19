import React from "react";
import axios from "axios";
import {
  Button,
  Callout,
  Spinner,
  Card,
  Tag,
  Popover,
  Tooltip,
  NonIdealState
} from "@blueprintjs/core";
import Avatar from "../Avatar";
import copy from "copy-to-clipboard";
import styles from "./SessionList.css";
import useUser from "../../hooks/useUser";
import kutku from "../../assets/kutku.png";
import garuga from "../../assets/garuga.png";

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
  const [sessions, setSessions] = React.useState<Session[]>(undefined);
  const [copiedMessage, setCopiedMessage] = React.useState(0);

  const { user } = useUser();

  React.useEffect(() => {
    const getSessions = async () => {
      const { data } = await axios.get<Session[]>("/api/sessions");
      setSessions(data);
    };

    if (!user) {
      setSessions([]);
      return;
    }

    getSessions();
  }, [user]);

  const copySession = (s: Session) => {
    copy(s.sessionId);
    setCopiedMessage(s.id);
    setTimeout(() => setCopiedMessage(0), 2e3);
  };

  if (sessions === undefined) {
    return <Spinner className={styles.center} size={Spinner.SIZE_LARGE} />;
  }

  if (!user) {
    return (
      <div className={styles.center}>
        <img
          className={styles.shake}
          src={Math.round(Math.random()) ? kutku : garuga}
        />
        <p>Please log in to view sessions</p>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className={styles.center}>
        <NonIdealState
          icon="heart-broken"
          description="Looks like there aren't any sessions yet!"
        />
      </div>
    );
  }

  return (
    <div className={styles.sessionList}>
      {sessions.map(session => (
        <Card key={session.id} className={styles.session}>
          <div className={styles.cardHeader}>
            <Avatar className={styles.cardAvatar} url={session.avatar} />
            <div>
              <span>{session.sessionId}</span>
              <Tag className={styles.tag} minimal round>
                {session.platform}
              </Tag>
              <p className={styles.date}>
                {new Date(session.date).toLocaleString()}
              </p>
            </div>
          </div>
          <p>{session.description}</p>
          <Popover
            isOpen={copiedMessage === session.id}
            content={
              <Callout icon="tick" intent="success">
                Copied! Happy hunting!
              </Callout>
            }
            position="right"
          >
            <Tooltip content="Copy to clipboard" position="right">
              <Button onClick={() => copySession(session)} icon="clipboard" />
            </Tooltip>
          </Popover>
        </Card>
      ))}
    </div>
  );
}
