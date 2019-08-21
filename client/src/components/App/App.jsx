import React from 'react';
import axios from 'axios';
import {
  Avatar,
  Container,
  Card,
  CardActions,
  CardHeader,
  CardContent,
  Chip,
  Grid,
  IconButton,
  Typography,
  CssBaseline,
  createMuiTheme,
  MuiThemeProvider,
} from '@material-ui/core';
import CopyButton from '@material-ui/icons/FileCopy';
import styles from './App.css';
import Menu from '../Menu';
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
            <Grid container spacing={2}>
              {sessions.map(session => (
                <Grid item xs={6} key={session.id}>
                  <Card className={styles.sessionCard}>
                    <CardHeader
                      avatar={<Avatar>{session.creator}</Avatar>}
                      title={
                        // eslint-disable-next-line react/jsx-wrap-multilines
                        <div className={styles.sessionTitle}>
                          <span>{session.sessionId}</span>
                          <Chip
                            size="small"
                            label={
                              session.platform === 'Unknown'
                                ? 'PC'
                                : session.platform
                            }
                          />
                        </div>
                      }
                      subheader={new Date(session.date).toLocaleString()}
                    />
                    <CardContent>
                      <Typography
                        variant="body2"
                        color="textSecondary"
                        component="p"
                      >
                        {session.description}
                      </Typography>
                    </CardContent>
                    <CardActions disableSpacing>
                      <IconButton aria-label="copy session ID">
                        <CopyButton />
                      </IconButton>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Container>
        </MuiThemeProvider>
      </UserProvider>
    );
  }
}
