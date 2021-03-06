import React from 'react';
import logo from '../../assets/logo.png';
import discordLogo from '../../assets/discord.svg';
import styles from './MelynxHeader.css';

import useUser from '../../hooks/useUser';
import { Layout, Menu, Button, Avatar, Popover } from 'antd';
import { HeartFilled, SnippetsFilled, CaretDownFilled, LogoutOutlined } from '@ant-design/icons';
import { Link, useLocation } from 'react-router-dom';

const { Header } = Layout;

export function MelynxHeader() {
  const { user, logout } = useUser();
  const location = useLocation();
  const current = location.pathname.split('/')[1];

  return (
    <Header className={styles.header}>
      <div className={styles.brand}>
        <Link to="/">
          <img className={styles.logo} alt="Logo" src={logo} />
          <span>Melynx Bot</span>
        </Link>
      </div>
      <Menu
        theme="dark"
        className={styles.menu}
        mode="horizontal"
        defaultSelectedKeys={['1']}
        selectedKeys={[current]}
      >
        <Menu.Item key="sessions">
          <Link to="/sessions">
            <HeartFilled />
            <span>Sessions</span>
          </Link>
        </Menu.Item>
        <Menu.Item key="stickers">
          <Link to="/stickers">
            <SnippetsFilled />
            <span>Stickers</span>
          </Link>
        </Menu.Item>
      </Menu>
      <div className={styles.rightMenu}>
        {!user ? (
          <Button
            className={styles.discordButton}
            href="/api/discord/login"
            icon={<img className={styles.discordLogo} src={discordLogo} alt="Discord Logo" />}
          >
            Login
          </Button>
        ) : (
          <Popover
            placement="topRight"
            content={
              <Menu mode="vertical" theme="dark">
                <Menu.Item onClick={logout}>
                  <LogoutOutlined />
                  <span>Logout</span>
                </Menu.Item>
              </Menu>
            }
            trigger={'click'}
          >
            <div className={styles.avatarButton}>
              <Avatar
                size="large"
                src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}`}
              />
              <CaretDownFilled />
            </div>
          </Popover>
        )}
      </div>
    </Header>
  );
};

export default MelynxHeader;
