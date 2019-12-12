import React from 'react';
import axios from 'axios';
import {
  Container,
  CssBaseline,
  createMuiTheme,
  MuiThemeProvider,
} from '@material-ui/core';
import {
  BrowserRouter as Router,
  Route,
  Switch,
  Redirect,
} from 'react-router-dom';
import styles from './App.css';
import Menu from '../Menu';
import SessionList from '../SessionList';
import UserProvider from '../../state/provider';
import UserConsumer from '../../state/consumer';

const theme = createMuiTheme({
  palette: {
    type: 'dark',
  },
});

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      sessions: [],
    };
  }

  async componentDidMount() {
    const { data } = await axios.get('/api/sessions');
    this.setState({
      sessions: [...data],
    });
  }

  render() {
    const { sessions = [] } = this.state;

    return (
      <UserProvider>
        <MuiThemeProvider theme={theme}>
          <CssBaseline />
          <UserConsumer>
            <Menu />
          </UserConsumer>
          <Container className={styles.root}>
            <Router>
              <Switch>
                <Route
                  exact
                  path="/sessions"
                  render={props => (
                    <SessionList {...props} sessions={sessions} />
                  )}
                />
                <Redirect to="/sessions" />
              </Switch>
            </Router>
          </Container>
        </MuiThemeProvider>
      </UserProvider>
    );
  }
}
