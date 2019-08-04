import React from 'react';
import axios from 'axios';
import {
  Button,
  Avatar,
  Container,
  Card,
  CardActions,
  CardHeader,
  CardContent,
  Chip,
  IconButton,
  Typography,
  CssBaseline,
  createMuiTheme,
  MuiThemeProvider,
} from '@material-ui/core';
import CopyButton from '@material-ui/icons/FileCopy';
import styles from './App.css';
import discordLogo from '../../assets/discord.png';
import Menu from '../Menu';

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

  componentDidMount() {
    axios
      .get('/api/sessions')
      .then(response => this.setState({ sessions: response.data }));
  }

  render() {
    const { sessions = [] } = this.state;

    return (
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        <Menu />
        <Container maxWidth="sm">
          <Button variant="contained" href="/api/discord/login" color="primary">
            Login with
            <img
              className={styles.discordLogo}
              src={discordLogo}
              alt="Discord"
            />
          </Button>
          <Card className={styles.sessionCard}>
            <CardHeader
              avatar={<Avatar>C</Avatar>}
              title={
                // eslint-disable-next-line react/jsx-wrap-multilines
                <div className={styles.sessionTitle}>
                  <span>12-1234-1234-1234</span>
                  <Chip size="small" label="Switch" />
                </div>
              }
              subheader={new Date().toLocaleString()}
            />
            <CardContent>
              <Typography variant="body2" color="textSecondary" component="p">
                This impressive paella is a perfect party dish and a fun meal to
                cook together with your guests. Add 1 cup of frozen peas along
                with the mussels, if you like.
              </Typography>
            </CardContent>
            <CardActions disableSpacing>
              <IconButton aria-label="copy session ID">
                <CopyButton />
              </IconButton>
            </CardActions>
          </Card>
          {sessions.map(session => (
            <Card className={styles.sessionCard} key={session.id}>
              <CardHeader
                avatar={<Avatar>{session.creator}</Avatar>}
                title={
                  // eslint-disable-next-line react/jsx-wrap-multilines
                  <div className={styles.sessionTitle}>
                    <span>{session.sessionId}</span>
                    <Chip
                      size="small"
                      label={
                        session.platform === 'Unknown' ? 'PC' : session.platform
                      }
                    />
                  </div>
                }
                subheader={new Date(session.date).toLocaleString()}
              />
              <CardContent>
                <Typography variant="body2" color="textSecondary" component="p">
                  {session.description}
                </Typography>
              </CardContent>
              <CardActions disableSpacing>
                <IconButton aria-label="copy session ID">
                  <CopyButton />
                </IconButton>
              </CardActions>
            </Card>
          ))}
        </Container>
      </MuiThemeProvider>
    );
  }
}
