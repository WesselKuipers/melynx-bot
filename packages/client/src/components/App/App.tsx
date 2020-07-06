import 'antd/dist/antd.css';
import 'antd/dist/antd.dark.min.css';

import { Layout } from 'antd';
import React from 'react';
import { BrowserRouter as Router, Redirect, Route, Switch } from 'react-router-dom';

import Header from '../MelynxHeader';
import SessionList from '../SessionList';
import Stickers from '../Stickers';
import UserProvider from '../UserProvider';
import styles from './App.css';

export default function App() {
  return (
    <Router>
      <UserProvider>
        <Layout>
          <Header />
          <Layout.Content className={styles.content}>
            <Switch>
              <Route exact path="/sessions">
                <SessionList />
              </Route>
              <Route exact path="/stickers">
                <Stickers />
              </Route>
              <Redirect to="/sessions" />
            </Switch>
          </Layout.Content>
        </Layout>
      </UserProvider>
    </Router>
  );
}
