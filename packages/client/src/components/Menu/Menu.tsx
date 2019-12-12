import React from 'react';
import {
  AppBar,
  Avatar,
  Button,
  Toolbar,
  Typography,
  makeStyles,
} from '@material-ui/core';
import logo from '../../assets/logo.png';
import discordLogo from '../../assets/discord.png';
import styles from './Menu.css';

const useStyles = makeStyles(theme => ({
  root: {
    flexGrow: 1,
  },
  menuButton: {
    marginRight: theme.spacing(2),
  },
  title: {
    flexGrow: 1,
  },
  discordLogo: {
    paddingLeft: '5px',
    height: '32px',
  },
}));

interface MenuProps {
  user: { id: string; avatar: string; };
  setUser: (token: string, refreshToken: string) => void;
}

const Menu = ({ user, setUser }: MenuProps) => {
  const classes = useStyles({});

  if (!user) {
    const params = new URLSearchParams(window.location.search);
    if (params.has('token')) {
      setUser(params.get('token'), params.get('refreshToken'));
      window.history.pushState(
        {},
        document.title,
        `/${
          window.location.href
            .substring(window.location.href.lastIndexOf('/') + 1)
            .split('?')[0]
        }`
      );
    }
  }

  return (
    <div className={classes.root}>
      <AppBar position="static">
        <Toolbar>
          <img
            className={`${styles.logo} ${classes.menuButton}`}
            alt="Logo"
            src={logo}
          />
          <Typography className={classes.title} variant="h6">
            Melynx Bot
          </Typography>
          {!user && (
            <Button
              variant="contained"
              href="/api/discord/login"
              color="primary"
            >
              Login with
              <img
                className={classes.discordLogo}
                src={discordLogo}
                alt="Discord"
              />
            </Button>
          )}
          {user && (
            <Avatar
              alt="Avatar"
              src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}`}
            />
          )}
        </Toolbar>
      </AppBar>
    </div>
  );
};

export default Menu;
