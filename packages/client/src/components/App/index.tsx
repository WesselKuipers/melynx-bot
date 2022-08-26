import 'antd/dist/antd.css';
import 'antd/dist/antd.dark.min.css';

import { Layout } from 'antd';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';

import styles from './index.module.css';
import { SessionList, Stickers, UserProvider, MelynxHeader } from '..';

export function App() {
  return (
    <Router>
      <UserProvider>
        <Layout>
          <MelynxHeader />
          <Layout.Content className={styles.content}>
            <Routes>
              <Route path="/sessions" element={<SessionList />} />
              <Route path="/stickers" element={<Stickers />} />
              <Route path="/" element={<Navigate replace to="/sessions" />} />
            </Routes>
          </Layout.Content>
        </Layout>
      </UserProvider>
    </Router>
  );
}
