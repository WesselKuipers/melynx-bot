import React from 'react';
import { AppBar, Toolbar, Typography } from '@material-ui/core';
import logo from '../../assets/logo.png';
import styles from './Menu.css';

const Menu = () => (
  <AppBar position="static">
    <Toolbar>
      <img className={styles.logo} alt="Logo" src={logo} />
      <Typography variant="h6">Melynx Bot</Typography>
    </Toolbar>
  </AppBar>
);

export default Menu;
