import React from 'react';
import {
  Avatar,
  Card,
  CardActions,
  CardHeader,
  CardContent,
  Chip,
  Grid,
  IconButton,
  Typography,
  makeStyles,
} from '@material-ui/core';
import CopyButton from '@material-ui/icons/FileCopy';

const useStyles = makeStyles(() => ({
  sessionId: {
    marginRight: '10px',
  },
}));

export default function SessionList({ sessions }) {
  const classes = useStyles();

  return (
    <Grid container spacing={2}>
      {sessions.map(session => (
        <Grid item xs={6} key={session.id}>
          <Card>
            <CardHeader
              avatar={<Avatar>{session.creator}</Avatar>}
              title={
                // eslint-disable-next-line react/jsx-wrap-multilines
                <div>
                  <span className={classes.sessionId}>{session.sessionId}</span>
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
        </Grid>
      ))}
    </Grid>
  );
}
