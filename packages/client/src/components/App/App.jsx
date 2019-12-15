import 'normalize.css';
import '@blueprintjs/core/lib/css/blueprint.css';
import '@blueprintjs/icons/lib/css/blueprint-icons.css';

import React from 'react';
import {
  BrowserRouter as Router,
  Redirect,
  Route,
  Switch,
} from 'react-router-dom';

import Menu from '../Menu';
import SessionList from '../SessionList';
import Stickers from '../Stickers';
import UserProvider from '../UserProvider';
import styles from './App.css';

export default function App() {
  return (
    <div className="bp3-dark">
      <Router>
        <UserProvider>
          <Menu />
          <div className={styles.container}>
            <Switch>
              <Route exact path="/sessions" component={SessionList} />
              <Route exact path="/stickers" component={Stickers} />
              <Redirect to="/sessions" />
            </Switch>
          </div>
        </UserProvider>
      </Router>
    </div>
  );
}
