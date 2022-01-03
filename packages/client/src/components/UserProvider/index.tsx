import axios from 'axios';
import * as React from 'react';

import { UserContext } from '../../hooks/useUser';
import { User } from '../../types';
import useQuery from '../../hooks/useQuery';

export default function UserProvider({
  children,
}: {
  children?: React.ReactNode;
}): React.ReactElement {
  const [user, setUser] = React.useState<User>(null);
  const query = useQuery();

  React.useEffect(() => {
    if (localStorage.user) {
      const { token } = JSON.parse(localStorage.user);
      axios.defaults.headers.common.Authorization = `Bearer ${token}`;

      refreshUser();
    }
  }, []);

  React.useEffect(() => {
    const getUser = async () => {
      const token = query.get('token');
      const refreshToken = query.get('refreshToken');
      axios.defaults.headers.common.Authorization = `Bearer ${token}`;
      const { data: discordUser } = await axios.get('https://discordapp.com/api/users/@me');
      const u = {
        token,
        refreshToken,
        date: new Date(),
        id: discordUser.id,
        name: discordUser.username,
        discriminator: discordUser.discriminator,
        avatar: discordUser.avatar,
      };
      localStorage.setItem('user', JSON.stringify(u));
      setUser(u);

      window.history.pushState(
        {},
        document.title,
        `/${
          window.location.href.substring(window.location.href.lastIndexOf('/') + 1).split('?')[0]
        }`
      );
    };

    if (query.has('token')) {
      getUser();
    }
  }, [query]);

  const refreshUser = React.useCallback(async () => {
    const { data: discordUser } = await axios.get('https://discordapp.com/api/users/@me');
    setUser({
      ...user,
      id: discordUser.id,
      name: discordUser.username,
      discriminator: discordUser.discriminator,
      avatar: discordUser.avatar,
    });
  }, [user]);

  const logout = React.useCallback(() => {
    setUser(null);
    delete axios.defaults.headers.common.Authorization;
    delete localStorage.user;
  }, []);

  const value = React.useMemo(
    () => ({
      logout,
      user,
      refreshUser,
    }),
    [logout, user, refreshUser]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}
