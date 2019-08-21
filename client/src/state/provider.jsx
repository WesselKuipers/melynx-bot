import React from 'react';
import axios from 'axios';

const u = localStorage.getItem('user');
const DEFAULT_STATE = { user: u ? JSON.parse(u) : undefined };

export const Context = React.createContext(DEFAULT_STATE);

export default class Provider extends React.Component {
  state = DEFAULT_STATE;

  setUser = async (token, refreshToken) => {
    axios.defaults.headers.common.Authorization = `Bearer ${token}`;
    const { data: discordUser } = await axios.get(
      'https://discordapp.com/api/users/@me'
    );
    const user = {
      token,
      refreshToken,
      date: new Date(),
      id: discordUser.id,
      name: discordUser.username,
      discriminator: discordUser.discriminator,
      avatar: discordUser.avatar,
    };
    localStorage.setItem('user', JSON.stringify(user));
    this.setState({ user });
  };

  render() {
    const { children } = this.props;

    return (
      <Context.Provider
        value={{
          ...this.state,
          setUser: this.setUser,
        }}
      >
        {children}
      </Context.Provider>
    );
  }
}
