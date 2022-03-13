import 'antd/dist/antd.css';
import 'antd/dist/antd.dark.min.css';

import { Layout } from 'antd';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';

import Header from '../MelynxHeader';
import SessionList from '../SessionList';
import Stickers from '../Stickers';
import UserProvider from '../UserProvider';
import styles from './App.module.css';

export default function App() {
  return (
    <Router>
      <UserProvider>
        <Layout>
          <Header />
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
