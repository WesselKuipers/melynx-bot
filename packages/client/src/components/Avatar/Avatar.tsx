import React from "react";
import styles from "./Avatar.css";

interface AvatarProps {
  url: string;
  className?: string;
}

export default function Avatar({ className, url }: AvatarProps) {
  return (
    <figure className={`${styles.avatar} ${className || ''}`}>
      <img alt="Avatar" src={url} />
    </figure>
  );
}
