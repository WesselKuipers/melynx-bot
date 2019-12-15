import React from "react";
import logo from "../../assets/logo.png";
import discordLogo from "../../assets/discord.svg";
import styles from "./Menu.css";
import {
  AnchorButton,
  Button,
  Navbar,
  Alignment,
  Menu as BPMenu,
  MenuItem,
  Popover
} from "@blueprintjs/core";
import useUser from "../../hooks/useUser";
import Avatar from '../Avatar';

const Menu = () => {

  const { user, logout } = useUser();

  return (
    <Navbar className={styles.navbar}>
      <Navbar.Group align={Alignment.LEFT}>
        <img className={styles.logo} alt="Logo" src={logo} />
        <Navbar.Heading>Melynx Bot</Navbar.Heading>
      </Navbar.Group>
      <Navbar.Group align={Alignment.RIGHT}>
        {!user && (
          <AnchorButton
            href="/api/discord/login"
            className={styles.discordButton}
          >
            <img
              className={styles.discordLogo}
              src={discordLogo}
              alt="Discord Logo"
            />
            <span>Login with Discord</span>
          </AnchorButton>
        )}
        {user && (
          <Popover content={<BPMenu><MenuItem onClick={logout} icon="log-out" text="Logout" /></BPMenu>} position="bottom-right">
            <Button minimal rightIcon="caret-down">
              <Avatar url={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}`} />
            </Button>
          </Popover>
        )}
      </Navbar.Group>
    </Navbar>
  );
};

export default Menu;
